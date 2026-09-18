import { prisma } from '#server/utils/prisma';
import { Prisma } from '#server/generated/prisma/client';
import { requireSeller } from '#server/utils/requireSeller';
import { ORDER_STATUSES, type OrderStatus } from '#shared/schemas/order.schema';
import type { SellerStats } from '#shared/schemas/seller.schema';
import { defineRouteMeta } from 'nitropack/runtime';
import type { EventHandlerResponse } from 'h3';

defineRouteMeta({
  openAPI: {
    responses: {
      '200': { description: 'Статистика продавца' },
      '401': { description: 'Требуется авторизация' },
      '403': { description: 'Требуется роль продавца' },
    },
  },
});

const LOW_STOCK_THRESHOLD = 5;

export default defineEventHandler<object, EventHandlerResponse<SellerStats>>(async (event) => {
  const sellerId = await requireSeller(event);

  // Все заказы, где есть позиции этого продавца (без дублей по orderId).
  const orderIds = (await prisma.orderItem.findMany({
    where: { sellerId },
    select: { orderId: true },
    distinct: ['orderId'],
  })).map((r) => r.orderId);

  const ordersCount = orderIds.length;

  // Счётчики по статусам: один groupBy вместо отдельного запроса на статус.
  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  if (ordersCount > 0) {
    const grouped = await prisma.order.groupBy({
      by: ['status'],
      where: { id: { in: orderIds } },
      _count: { _all: true },
    });
    for (const g of grouped) statusCounts[g.status] = g._count._all;
  }

  // Выручка: сумма priceAtPurchase × quantity по не-отменённым заказам.
  const revenueItems = await prisma.orderItem.findMany({
    where: { sellerId, order: { status: { not: 'CANCELLED' } } },
    select: { productId: true, priceAtPurchase: true, quantity: true },
  });

  let revenue = new Prisma.Decimal(0);
  const revenueByProduct = new Map<string, Prisma.Decimal>();
  const soldByProduct = new Map<string, number>();

  for (const i of revenueItems) {
    const sum = i.priceAtPurchase.mul(i.quantity);
    revenue = revenue.add(sum);
    revenueByProduct.set(i.productId, (revenueByProduct.get(i.productId) ?? new Prisma.Decimal(0)).add(sum));
    soldByProduct.set(i.productId, (soldByProduct.get(i.productId) ?? 0) + i.quantity);
  }

  // Товары для блока "Внимание": низкий остаток ИЛИ скрыт - одним запросом.
  const products = await prisma.product.findMany({
    where: { sellerId, OR: [{ stock: { lte: LOW_STOCK_THRESHOLD } }, { isActive: false }] },
    select: { id: true, name: true, stock: true, isActive: true },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });
  const lowStock = products
    .filter((p) => p.isActive && p.stock <= LOW_STOCK_THRESHOLD)
    .map(({ id, name, stock }) => ({ id, name, stock }));
  const inactive = products.filter((p) => !p.isActive).map(({ id, name }) => ({ id, name }));

  const productsCount = await prisma.product.count({ where: { sellerId } });

  const topIds = [...soldByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  
  const topNames = topIds.length > 0 ? await prisma.product.findMany({ where: { id: { in: topIds } }, select: { id: true, name: true } }) : [];
  const nameById = new Map(topNames.map((p) => [p.id, p.name]));
  // Топ продаваемых товаров
  const topProducts = topIds.map((id) => ({
    id,
    name: nameById.get(id) ?? 'Товар удалён',
    sold: soldByProduct.get(id) ?? 0,
    revenue: Number(revenueByProduct.get(id) ?? new Prisma.Decimal(0)),
  }));

  // Последние 5 заказов - тот же расчёт sellerTotal, что в GET /api/sellers/orders.
  const recentOrders: SellerStats['recentOrders'] = [];
  if (ordersCount > 0) {
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        buyer: { select: { name: true } },
        items: { where: { sellerId }, select: { priceAtPurchase: true, quantity: true } },
      },
    });
    for (const o of orders) {
      recentOrders.push({
        id: o.id,
        buyerName: o.buyer?.name ?? null,
        status: o.status,
        sellerTotal: Number(
          o.items.reduce((sum, i) => sum.add(i.priceAtPurchase.mul(i.quantity)), new Prisma.Decimal(0)),
        ),
        createdAt: o.createdAt.toISOString(),
      });
    }
  }

  return {
    revenue: Number(revenue),
    ordersCount,
    productsCount,
    lowStock,
    inactive,
    recentOrders,
    statusCounts,
    topProducts,
  };
});
