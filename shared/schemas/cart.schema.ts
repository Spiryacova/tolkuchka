import * as z from 'zod';

export const addCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1),
});

export type AddToCart = z.output<typeof addCartSchema>;
export type UpdateCartItem = z.output<typeof updateCartItemSchema>;

export const cartProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  price: z.number().positive(),
  imageUrl: z.string().nullable(),
  stock: z.number().int(),
});

export type CartProduct = z.output<typeof cartProductSchema>;

export const cartItemSchema = z.object({
  id: z.string(),
  quantity: z.number().int(),
  product: cartProductSchema,
});

export type CartItem = z.output<typeof cartItemSchema>;

export const cartResponseSchema = z.object({
  items: z.array(cartItemSchema),
});

export type CartResponse = z.output<typeof cartResponseSchema>;
