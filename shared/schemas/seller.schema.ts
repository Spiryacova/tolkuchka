import * as z from 'zod';
import { orderStatusSchema } from './order.schema';

export const sellerStatsSchema = z.object({
  revenue: z.number().nonnegative(), // выручка по позициям в не отмененных заказах
  ordersCount: z.number().int().nonnegative(), // число разных заказов
  ordersWithRevenue: z.number().int().nonnegative(), // заказы с ≥1 не-отменённой позицией — делитель среднего чека
  productsCount: z.number().int().nonnegative(), // число товаров в каталоге
  lowStock: z.array( // товары с низким количеством на складе
    z.object({
      id: z.string(),
      name: z.string(),
      stock: z.number().int().nonnegative(),
    }),
  ).default([]),
  inactive: z.array( // скрытые товары
    z.object({ id: z.string(), name: z.string() }),
  ).default([]),
  recentOrders: z.array( // последние заказы
    z.object({
      id: z.string(),
      buyerNo: z.number().int(),
      no: z.number().int(),
      buyerName: z.string().nullable(),
      status: orderStatusSchema,
      sellerTotal: z.number().nonnegative(),
      createdAt: z.string(),
    }),
  ).default([]),
  topProducts: z.array( // самые продаваемые товары
    z.object({
      id: z.string(),
      name: z.string(),
      sold: z.number().int().nonnegative(),
      revenue: z.number().nonnegative(),
    }),
  ).default([]),
  statusCounts: z.record(orderStatusSchema, z.number().int().nonnegative()), // счетчик заказов по статусам
});

export type SellerStats = z.output<typeof sellerStatsSchema>;
export type RecentOrder = SellerStats['recentOrders'][number];
