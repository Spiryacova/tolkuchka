import { prisma } from '#server/utils/prisma';
import { requireSeller } from '#server/utils/requireSeller';
import { sellerOrdersQuerySchema, ORDER_STATUSES } from '#shared/schemas/order.schema';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';
import type { SellerOrderListResponse, SellerOrderSummary, OrderStatus } from '#shared/schemas/order.schema';
import type { Prisma } from '#server/generated/prisma/client';

defineRouteMeta({
  openAPI: {
    parameters: [
      {
        name: 'status',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
      },
      { name: 'page',
        in: 'query',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      },
      { name: 'perPage',
        in: 'query',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          default: 10
        }
      },
      { name: 'q', in: 'query', required: false, schema: { type: 'string', default: '' } },
      { name: 'sortBy',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          enum: ['createdAt', 'sellerTotal', 'itemCount', 'buyerName', 'status', 'no']
        }
      },
      { name: 'sortDir',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          enum: ['asc', 'desc']
        }
      },
    ],
    responses: {
      '200': { description: 'Список заказов продавца' },
      '401': { description: 'Требуется авторизация' },
      '403': { description: 'Требуется роль продавца' },
    },
  },
});

export default defineEventHandler<object, EventHandlerResponse<SellerOrderListResponse>>(async (event) => {
  const sellerId = await requireSeller(event);
  const query = await getValidatedQuery(event, (data) => sellerOrdersQuerySchema.parse(data));

  // Модель «заказ = один продавец»: фильтруем напрямую по sellerId.
  const where: Prisma.OrderWhereInput = {
    sellerId,
    ...(query.status ? { status: query.status as OrderStatus } : {}),
    ...(query.q
      ? {
          OR: /^\d+$/.test(query.q)
            ? [
                { no: { equals: Number(query.q) } },
                { buyer: { customerNo: { equals: Number(query.q) } } },
              ]
            : [
                { buyer: { name: { contains: query.q, mode: 'insensitive' } } },
                { buyer: { email: { contains: query.q, mode: 'insensitive' } } },
              ],
        }
      : {}),
  };

  // Счётчики по статусам — для табов. Прямой groupBy без второго запроса по orderItems.
  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  const grouped = await prisma.order.groupBy({
    by: ['status'],
    where: { sellerId },
    _count: { _all: true },
  });
  for (const g of grouped) statusCounts[g.status] = g._count._all;

  const total = await prisma.order.count({ where });

  const orderBy = query.sortBy === 'sellerTotal' ? { total: query.sortDir }
    : query.sortBy === 'itemCount' ? { items: { _count: query.sortDir } }
    : query.sortBy === 'buyerName' ? { buyer: { name: query.sortDir } }
    : { [query.sortBy]: query.sortDir };

  const orders = await prisma.order.findMany({
    where,
    orderBy: orderBy,
    skip: (query.page - 1) * query.perPage,
    take: query.perPage,
    include: {
      buyer: { select: { name: true, customerNo: true } },
      items: { select: { id: true, quantity: true, priceAtPurchase: true, status: true } },
    },
  });

  const items: SellerOrderSummary[] = orders.map((o) => ({
    id: o.id,
    buyerName: o.buyer?.name ?? null,
    buyerNo: o.buyer!.customerNo,
    no: o.no,
    status: o.status,
    sellerTotal: Number(o.total),
    itemCount: o.items.length,
    totalQuantity: o.items.reduce((sum, i) => sum + i.quantity, 0),
    hasCancelledItems: o.items.some((i) => i.status === 'CANCELLED'),
    createdAt: o.createdAt.toISOString(),
  }));

  return { items, page: query.page, perPage: query.perPage, total, statusCounts };
});
