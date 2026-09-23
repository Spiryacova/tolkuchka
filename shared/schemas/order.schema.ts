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

const AGGREGATE_RANK: Record<OrderStatus, number> = {
  PENDING: 0, CONFIRMED: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: 4,
};
export function aggregateOrderStatus(items: Array<{ status: OrderStatus }>): OrderStatus {
  const active = items.filter((i) => i.status !== 'CANCELLED');
  if (active.length === 0) return 'CANCELLED';
  return active.reduce(
    (min, i) => (AGGREGATE_RANK[i.status] < AGGREGATE_RANK[min.status] ? i : min),
  ).status;
}

export const orderStatusUpdateSchema = z.object({
  status: orderStatusSchema,
  itemIds: z.array(z.string()).optional(),
});

export type OrderStatusUpdate = z.output<typeof orderStatusUpdateSchema>;

export const orderCreatedSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  total: z.number().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  no: z.number().int(),
});

export type OrderCreated = z.output<typeof orderCreatedSchema>;

export const checkoutCreatedSchema = z.object({
  checkoutGroupId: z.string(),
  orders: z.array(orderCreatedSchema),
  buyerNo: z.number().int(),
});

export type CheckoutCreated = z.output<typeof checkoutCreatedSchema>;

export const sellerOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
  status: orderStatusSchema.optional(),
  q: z.string().trim().default(''),
  sortBy: z.enum(['createdAt', 'sellerTotal', 'itemCount', 'buyerName', 'status', 'no']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type SellerOrdersQuery = z.output<typeof sellerOrdersQuerySchema>;

export const sellerOrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  quantity: z.number().int().positive(),
  priceAtPurchase: z.number().nonnegative(),
  status: orderStatusSchema,
  statusUpdatedAt: z.string().nullable(),
});

export type SellerOrderItem = z.output<typeof sellerOrderItemSchema>;

export const sellerOrderSummarySchema = z.object({
  id: z.string(),
  buyerName: z.string().nullable(),
  status: orderStatusSchema,
  sellerTotal: z.number().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  totalQuantity: z.number().int().nonnegative(),
  hasCancelledItems: z.boolean(),
  buyerNo: z.number().int(),
  no: z.number().int(),
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
  buyerNo: z.number().int(),
  no: z.number().int(),
  items: z.array(sellerOrderItemSchema),
});

export type SellerOrderDetail = z.output<typeof sellerOrderDetailSchema>;

export const buyerOrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  quantity: z.number().int().positive(),
  priceAtPurchase: z.number().nonnegative(),
  status: orderStatusSchema,
});

export type BuyerOrderItem = z.output<typeof buyerOrderItemSchema>;

// Деталь заказа глазами покупателя: свой заказ целиком + имя продавца.
export const buyerOrderDetailSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  sellerName: z.string().nullable(),
  shippingAddress: shippingAddressSchema.nullable(),
  total: z.number().nonnegative(),
  buyerNo: z.number().int(),
  no: z.number().int(),
  itemCount: z.number().int().positive(),
  items: z.array(buyerOrderItemSchema),
});

export type BuyerOrderDetail = z.output<typeof buyerOrderDetailSchema>;

export const buyerOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
});

export type BuyerOrdersQuery = z.output<typeof buyerOrdersQuerySchema>;

export const buyerOrderSummarySchema = z.object({
  id: z.string(),
  no: z.number().int(),
  buyerNo: z.number().int(),
  status: orderStatusSchema,
  total: z.number().nonnegative(),
  itemCount: z.number().int().positive(),
  totalQuantity: z.number().int().positive(),
  sellerName: z.string().nullable(),
  createdAt: z.string(),
});

export type BuyerOrderSummary = z.output<typeof buyerOrderSummarySchema>;

export const buyerOrderListResponseSchema = z.object({
  items: z.array(buyerOrderSummarySchema),
  page: z.number().int(),
  perPage: z.number().int(),
  total: z.number().int().nonnegative(),
});

export type BuyerOrderListResponse = z.output<typeof buyerOrderListResponseSchema>;
