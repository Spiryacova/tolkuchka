import type { CartItem } from '#shared/schemas/cart.schema';

export const cartItemProductSelect = {
  id: true,
  slug: true,
  name: true,
  price: true,
  images: true,
  stock: true,
} as const;

type CartItemWithProduct = {
  id: string;
  quantity: number;
  product: {
    id: string;
    slug: string;
    name: string;
    price: unknown;
    images: string[];
    stock: number;
  };
};

export function toCartItemDto(item: CartItemWithProduct): CartItem {
  const { price, images, ...rest } = item.product;
  return {
    id: item.id,
    quantity: item.quantity,
    product: {
      ...rest,
      price: Number(price),
      imageUrl: images[0] ?? null,
    },
  };
}
