import {
  guestCartSchema,
  type CartProduct,
  type GuestCart,
} from '#shared/schemas/cart.schema';

const GUEST_CART_KEY = 'tolkuchka:guest-cart';

const EMPTY_CART: GuestCart = { items: [] };

export function readGuestCart(): GuestCart {
  if (!import.meta.client) return EMPTY_CART;
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = guestCartSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

export function writeGuestCart(cart: GuestCart): void {
  if (!import.meta.client) return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
}

export function clearGuestCart(): void {
  if (!import.meta.client) return;
  localStorage.removeItem(GUEST_CART_KEY);
}

function clampToStock(quantity: number, stock: number): number {
  return Math.min(Math.max(1, quantity), Math.max(stock, 1));
}

export function upsertGuestLine(
  cart: GuestCart,
  productId: string,
  quantity: number,
  product: CartProduct,
): GuestCart {
  const existing = cart.items.find((item) => item.id === productId);
  if (!existing) {
    return {
      items: [...cart.items, { id: productId, quantity: clampToStock(quantity, product.stock), product }],
    };
  }
  return {
    items: cart.items.map((item) =>
      item.id === productId
        ? { ...item, quantity: clampToStock(item.quantity + quantity, item.product.stock) }
        : item,
    ),
  };
}

export function setGuestQuantity(cart: GuestCart, id: string, quantity: number): GuestCart {
  return {
    items: cart.items.map((item) =>
      item.id === id
        ? { ...item, quantity: clampToStock(quantity, item.product.stock) }
        : item,
    ),
  };
}

export function removeGuestLine(cart: GuestCart, id: string): GuestCart {
  return { items: cart.items.filter((item) => item.id !== id) };
}