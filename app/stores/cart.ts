import { defineStore } from 'pinia';
import type { CartItem, CartResponse, CartProduct } from '#shared/schemas/cart.schema';
import type { Product } from '#shared/schemas/product.schema';
import {
  readGuestCart,
  writeGuestCart,
  clearGuestCart,
  upsertGuestLine,
  setGuestQuantity,
  removeGuestLine,
} from '../utils/guest-cart';

type CartSource = 'idle' | 'guest' | 'server';

function toCartProduct(product: Product): CartProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl ?? product.images?.[0] ?? null,
    stock: product.stock ?? 0,
  };
}

function is404(error: unknown): boolean {
  try {
    const { status, statusCode } = error as { status?: number; statusCode?: number };
    return status === 404 || statusCode === 404;
  } catch {
    return false;
  }
}

export const useCartStore = defineStore('cart', () => {
  const { status } = useAuth();

  let inflight: Promise<void> | null = null;
  const items = ref<CartItem[]>([]);
  const source = ref<CartSource>('idle');
  const isLoading = ref(false);
  const isRevalidating = ref(false);

  watch(
    status,
    (value) => {
      source.value = value === 'authenticated' ? 'server' : value === 'unauthenticated' ? 'guest' : 'idle';
    },
    { immediate: true },
  );

  function waitForAuth(timeoutMs = 5000): Promise<void> {
    if (status.value !== 'loading') return Promise.resolve();
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        stop();
        resolve();
      }, timeoutMs);
      const stop = watch(status, (value) => {
        if (value !== 'loading') {
          clearTimeout(timer);
          stop();
          resolve();
        }
      });
    });
  }

  async function refresh() {
    if (!import.meta.client) return;
    if (inflight) return inflight;
    isLoading.value = true;
    inflight = (async () => {
      try {
        if (source.value === 'server') {
          const cart = await $fetch<CartResponse>('/api/cart');
          items.value = cart.items;
        } else if (source.value === 'guest') {
          items.value = readGuestCart().items as CartItem[];
        }
      } catch {
        items.value = [];
      } finally {
        isLoading.value = false;
        inflight = null;
      }
    })();
    return inflight;
  }

  async function load() {
    await refresh();
  }

  async function addToCart(productId: string, qty: number, product?: Product, snapshot?: CartProduct) {
    await waitForAuth();
    if (source.value === 'server') {
      const item = await $fetch<CartItem>('/api/cart', {
        method: 'POST',
        body: { productId, quantity: qty },
      });
      const index = items.value.findIndex((i) => i.id === item.id);
      if (index !== -1) items.value[index] = item;
      else items.value.push(item);
      return;
    }

    const cart = readGuestCart();
    const existing = cart.items.find((item) => item.id === productId);
    let embed = snapshot ?? (product ? toCartProduct(product) : undefined);
    if (!embed && existing) embed = existing.product;
    if (!embed) return;
    writeGuestCart(upsertGuestLine(cart, productId, qty, embed));
    items.value = readGuestCart().items as CartItem[];
    source.value = 'guest';
  }

  async function updateQty(id: string, qty: number) {
    if (source.value === 'server') {
      const item = await $fetch<CartItem>(`/api/cart/${id}`, {
        method: 'PATCH',
        body: { quantity: qty },
      });
      const index = items.value.findIndex((i) => i.id === item.id);
      if (index !== -1) items.value[index] = item;
      return;
    }

    const cart = readGuestCart();
    writeGuestCart(setGuestQuantity(cart, id, qty));
    items.value = readGuestCart().items as CartItem[];
  }

  async function remove(id: string) {
    if (source.value === 'server') {
      await $fetch(`/api/cart/${id}`, { method: 'DELETE' });
      const index = items.value.findIndex((i) => i.id === id);
      if (index !== -1) items.value.splice(index, 1);
      return;
    }

    const cart = readGuestCart();
    writeGuestCart(removeGuestLine(cart, id));
    items.value = readGuestCart().items as CartItem[];
  }

  // Гость: на открытии /cart сверяем снапшот с живыми данными каталога.
  // 404 (товар скрыт/удалён) → stock:0 → строка помечается «Нет в наличии»; сетевые сбои снапшот не трогают.
  async function revalidateGuestLines() {
    if (!import.meta.client || source.value !== 'guest' || items.value.length === 0) return;
    isRevalidating.value = true;
    try {
      const results = await Promise.allSettled(
        items.value.map((line) =>
          $fetch<Product>(`/api/products/${line.product.slug}`).then((product) => ({ id: line.id, product })),
        ),
      );
      const fresh = items.value.map((line) => {
        const result = results.find((r) => r.status === 'fulfilled' && r.value.id === line.id);
        if (result?.status === 'fulfilled') {
          return { ...line, product: toCartProduct(result.value.product) };
        }
        if (is404(result?.reason)) {
          return { ...line, product: { ...line.product, stock: 0 } };
        }
        return line;
      });
      writeGuestCart({ items: fresh });
      items.value = fresh as CartItem[];
    } finally {
      isRevalidating.value = false;
    }
  }

  // Вызывается после успешного signIn. POST инкрементит → сервер сам сливает количества.
  // Строки, упавшие по сети/5xx, остаются в гостевой (не теряем); 404 (товара больше нет) — выпадают осознанно.
  async function mergeGuestCart(): Promise<{ merged: number; skipped: number }> {
    if (!import.meta.client) return { merged: 0, skipped: 0 };
    const guest = readGuestCart();
    let merged = 0;
    let skipped = 0;
    const keep: CartItem[] = [];
    for (const line of guest.items) {
      try {
        await $fetch('/api/cart', {
          method: 'POST',
          body: { productId: line.product.id, quantity: line.quantity },
        });
        merged++;
      } catch (error) {
        skipped++;
        if (!is404(error)) keep.push(line);
      }
    }
    if (keep.length > 0) writeGuestCart({ items: keep });
    else clearGuestCart();
    // Грузим серверную корзину напрямую — не полагаемся на реактивность status (redirect:false).
    try {
      const cart = await $fetch<CartResponse>('/api/cart');
      items.value = cart.items;
      source.value = 'server';
    } catch {
      items.value = [];
      source.value = 'server';
    }
    return { merged, skipped };
  }

  async function handleLogout() {
    if (!import.meta.client) return;
    clearGuestCart();
    items.value = [];
    source.value = 'guest';
  }

  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0));
  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  );
  const isGuest = computed(() => source.value === 'guest');

  return {
    items,
    source,
    isLoading,
    isRevalidating,
    count,
    subtotal,
    isGuest,
    load,
    refresh,
    addToCart,
    updateQty,
    remove,
    revalidateGuestLines,
    mergeGuestCart,
    handleLogout,
  };
});