import { prisma } from '#server/utils/prisma';
import { requireUser } from '#server/utils/requireUser';
import { buyerOrdersQuerySchema } from '#shared/schemas/order.schema';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';
import type { BuyerOrderListResponse, BuyerOrderSummary } from '#shared/schemas/order.schema';

defineRouteMeta({
  openAPI: {
    parameters: [
      {
        name: 'page',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      {
        name: 'perPage',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
      },
    ],
    responses: {
      '200': { description: 'Список заказов покупателя: актуальные сверху, завершённые ниже' },
      '401': { description: 'Требуется авторизация' },
    },
  },
});

// «Завершённые» (терминальные) статусы — уходят в конец списка.
const TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELLED']);

export default defineEventHandler<object, EventHandlerResponse<BuyerOrderListResponse>>(async (event) => {
  const buyerId = await requireUser(event);
  const query = await getValidatedQuery(event, (data) => buyerOrdersQuerySchema.parse(data));

  // У покупателя заказов немного, поэтому берём все и сортируем в памяти:
  // актуальные (не завершённые) сверху, завершённые ниже, внутри групп — новые сверху.
  // Пагинацию применяем уже после такой сортировки.
  const orders = await prisma.order.findMany({
    where: { buyerId },
    include: {
      buyer: { select: { customerNo: true } },
      seller: { select: { name: true } },
      items: { select: { id: true, quantity: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const active: typeof orders = [];
  const completed: typeof orders = [];
  for (const order of orders) {
    if (TERMINAL_STATUSES.has(order.status)) completed.push(order);
    else active.push(order);
  }
  const sorted = [...active, ...completed];

  const total = sorted.length;
  const pageItems = sorted.slice((query.page - 1) * query.perPage, query.page * query.perPage);

  const items: BuyerOrderSummary[] = pageItems.map((o) => ({
    id: o.id,
    no: o.no,
    buyerNo: o.buyer!.customerNo,
    status: o.status,
    total: Number(o.total),
    itemCount: o.items.length,
    totalQuantity: o.items.reduce((sum, i) => sum + i.quantity, 0),
    sellerName: o.seller?.name ?? null,
    createdAt: o.createdAt.toISOString(),
  }));

  return { items, page: query.page, perPage: query.perPage, total };
});