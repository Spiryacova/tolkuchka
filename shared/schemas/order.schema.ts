import * as z from 'zod';

export const shippingAddressSchema = z.object({
  name: z.string().min(1, 'Укажите имя'),
  email: z.email('Некорректный email'),
  address: z.string().min(1, 'Укажите адрес доставки'),
  comment: z.string().optional(),
});

export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
});

export type CreateOrder = z.output<typeof createOrderSchema>;
export type ShippingAddress = z.output<typeof shippingAddressSchema>;

export const orderCreatedSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  total: z.number().nonnegative(),
  itemCount: z.number().int().nonnegative(),
});

export type OrderCreated = z.output<typeof orderCreatedSchema>;
