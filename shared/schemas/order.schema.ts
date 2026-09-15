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

export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

export const orderStatusSchema = z.enum(ORDER_STATUSES);

export type OrderStatus = z.output<typeof orderStatusSchema>;

// Единая машина состояний: сервер валидирует переход (409), фронт строит USelect из допустимых целей.
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const orderStatusUpdateSchema = z.object({
  status: orderStatusSchema,
});

export type OrderStatusUpdate = z.output<typeof orderStatusUpdateSchema>;

export const orderCreatedSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  total: z.number().nonnegative(),
  itemCount: z.number().int().nonnegative(),
});

export type OrderCreated = z.output<typeof orderCreatedSchema>;

export const sellerOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
  status: orderStatusSchema.optional(),
});

export type SellerOrdersQuery = z.output<typeof sellerOrdersQuerySchema>;

export const sellerOrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  quantity: z.number().int().positive(),
  priceAtPurchase: z.number().nonnegative(),
});

export type SellerOrderItem = z.output<typeof sellerOrderItemSchema>;

export const sellerOrderSummarySchema = z.object({
  id: z.string(),
  buyerName: z.string().nullable(),
  status: orderStatusSchema,
  sellerTotal: z.number().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  totalQuantity: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export type SellerOrderSummary = z.output<typeof sellerOrderSummarySchema>;

export const sellerOrderListResponseSchema = z.object({
  items: z.array(sellerOrderSummarySchema),
  page: z.number().int(),
  perPage: z.number().int(),
  total: z.number().int().nonnegative(),
  statusCounts: z.record(orderStatusSchema, z.number().int().nonnegative()),
});

export type SellerOrderListResponse = z.output<typeof sellerOrderListResponseSchema>;

export const sellerOrderDetailSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  buyerName: z.string().nullable(),
  buyerEmail: z.string(),
  shippingAddress: shippingAddressSchema.nullable(),
  sellerTotal: z.number().nonnegative(),
  items: z.array(sellerOrderItemSchema),
});

export type SellerOrderDetail = z.output<typeof sellerOrderDetailSchema>;