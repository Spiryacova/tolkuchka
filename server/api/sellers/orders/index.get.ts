import { prisma } from '#server/utils/prisma';
import { Prisma } from '#server/generated/prisma/client';
import { requireSeller } from '#server/utils/requireSeller';
import { sellerOrdersQuerySchema, ORDER_STATUSES } from '#shared/schemas/order.schema';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';
import type { SellerOrderListResponse, SellerOrderSummary, OrderStatus } from '#shared/schemas/order.schema';

defineRouteMeta({
  openAPI: {
    parameters: [
      {
        name: 'status',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
      },
      { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1, default: 1 } },
      { name: 'perPage', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 } },
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

  // Заказы, содержащие позиции текущего продавца (OrderItem.sellerId).
  const where = {
    items: { some: { sellerId } },
    ...(query.status ? { status: query.status as OrderStatus } : {}),
  };

  // Счётчики по статусам — для табов «все / PENDING / …» без второго списка.
  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  const orderIds = await prisma.orderItem.findMany({
    where: { sellerId },
    select: { orderId: true },
    distinct: ['orderId'],
  });
  if (orderIds.length > 0) {
    const grouped = await prisma.order.groupBy({
      by: ['status'],
      where: { id: { in: orderIds.map((r) => r.orderId) } },
      _count: { _all: true },
    });
    for (const g of grouped) statusCounts[g.status] = g._count._all;
  }

  const total = await prisma.order.count({ where });
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (query.page - 1) * query.perPage,
    take: query.perPage,
    include: {
      buyer: { select: { name: true } },
      items: {
        where: { sellerId },
        select: { id: true, productId: true, quantity: true, priceAtPurchase: true },
      },
    },
  });

  const items: SellerOrderSummary[] = orders.map((o) => ({
    id: o.id,
    buyerName: o.buyer?.name ?? null,
    status: o.status,
    sellerTotal: Number(
      o.items.reduce((sum, i) => sum.add(i.priceAtPurchase.mul(i.quantity)), new Prisma.Decimal(0)),
    ),
    itemCount: o.items.length,
    createdAt: o.createdAt.toISOString(),
  }));

  return { items, page: query.page, perPage: query.perPage, total, statusCounts };
});