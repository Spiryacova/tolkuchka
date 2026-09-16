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

let inflight: Promise<void> | null = null;

function currentSource(): CartSource {
  if (!import.meta.client) return 'idle';
  const { status } = useAuth();
  return status.value === 'authenticated' ? 'server' : status.value === 'unauthenticated' ? 'guest' : 'idle';
}

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

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    source: 'idle' as CartSource,
    isLoading: false,
    isRevalidating: false,
  }),

  getters: {
    count(): number {
      return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    subtotal(): number {
      return this.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    },
    isGuest(): boolean {
      return this.source === 'guest';
    },
  },

  actions: {
    async refresh() {
      if (!import.meta.client) return;
      if (inflight) return inflight;
      this.isLoading = true;
      inflight = (async () => {
        try {
          const source = currentSource();
          if (source === 'server') {
            const cart = await $fetch<CartResponse>('/api/cart');
            this.items = cart.items;
            this.source = 'server';
          } else if (source === 'guest') {
            this.items = readGuestCart().items as CartItem[];
            this.source = 'guest';
          }
          // source === 'idle' — сессия ещё определяется, пропускаем до следующего триггера
        } catch {
          this.items = [];
          this.source = 'guest';
        } finally {
          this.isLoading = false;
          inflight = null;
        }
      })();
      return inflight;
    },
    async load() {
      await this.refresh();
    },
    async addToCart(productId: string, qty: number, product?: Product) {
      if (currentSource() === 'server') {
        const item = await $fetch<CartItem>('/api/cart', {
          method: 'POST',
          body: { productId, quantity: qty },
        });
        const index = this.items.findIndex((i) => i.id === item.id);
        if (index !== -1) this.items[index] = item;
        else this.items.push(item);
        this.source = 'server';
        return;
      }

      const cart = readGuestCart();
      const existing = cart.items.find((item) => item.id === productId);
      let embed = product ? toCartProduct(product) : undefined;
      if (!embed && existing) embed = existing.product;
      if (!embed) return;
      writeGuestCart(upsertGuestLine(cart, productId, qty, embed));
      this.items = readGuestCart().items as CartItem[];
      this.source = 'guest';
    },
    async updateQty(id: string, qty: number) {
      if (currentSource() === 'server') {
        const item = await $fetch<CartItem>(`/api/cart/${id}`, {
          method: 'PATCH',
          body: { quantity: qty },
        });
        const index = this.items.findIndex((i) => i.id === item.id);
        if (index !== -1) this.items[index] = item;
        return;
      }

      const cart = readGuestCart();
      writeGuestCart(setGuestQuantity(cart, id, qty));
      this.items = readGuestCart().items as CartItem[];
    },
    async remove(id: string) {
      if (currentSource() === 'server') {
        await $fetch(`/api/cart/${id}`, { method: 'DELETE' });
        const index = this.items.findIndex((i) => i.id === id);
        if (index !== -1) this.items.splice(index, 1);
        return;
      }

      const cart = readGuestCart();
      writeGuestCart(removeGuestLine(cart, id));
      this.items = readGuestCart().items as CartItem[];
    },
    // Гость: на открытии /cart сверяем снапшот с живыми данными каталога.
    // 404 (товар скрыт/удалён) → stock:0 → строка помечается «Нет в наличии».
    async revalidateGuestLines() {
      if (!import.meta.client || this.source !== 'guest' || this.items.length === 0) return;
      this.isRevalidating = true;
      try {
        const results = await Promise.allSettled(
          this.items.map((line) =>
            $fetch<Product>(`/api/products/${line.product.slug}`).then((product) => ({ id: line.id, product })),
          ),
        );
        const fresh = this.items.map((line) => {
          const result = results.find((r) => r.status === 'fulfilled' && r.value.id === line.id);
          if (result?.status === 'fulfilled') {
            return { ...line, product: toCartProduct(result.value.product) };
          }
          return { ...line, product: { ...line.product, stock: 0 } };
        });
        writeGuestCart({ items: fresh });
        this.items = fresh as CartItem[];
      } finally {
        this.isRevalidating = false;
      }
    },
    // Вызывается после успешного signIn. POST инкрементит → сервер сам сливает количества.
    async mergeGuestCart(): Promise<{ merged: number; skipped: number }> {
      if (!import.meta.client) return { merged: 0, skipped: 0 };
      const guest = readGuestCart();
      let merged = 0;
      let skipped = 0;
      if (guest.items.length > 0) {
        for (const line of guest.items) {
          try {
            await $fetch('/api/cart', {
              method: 'POST',
              body: { productId: line.product.id, quantity: line.quantity },
            });
            merged++;
          } catch {
            skipped++;
          }
        }
        clearGuestCart();
      }
      // Грузим серверную корзину напрямую — не полагаемся на реактивность status (redirect:false).
      try {
        const cart = await $fetch<CartResponse>('/api/cart');
        this.items = cart.items;
        this.source = 'server';
      } catch {
        this.items = [];
        this.source = 'server';
      }
      return { merged, skipped };
    },
    async handleLogout() {
      if (!import.meta.client) return;
      clearGuestCart();
      this.$patch({ items: [], source: 'guest' });
    },
  },
});