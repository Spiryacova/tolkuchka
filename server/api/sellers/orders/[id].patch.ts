import { prisma } from '#server/utils/prisma';
import { requireSeller } from '#server/utils/requireSeller';
import {
  orderStatusUpdateSchema,
  ALLOWED_TRANSITIONS,
  aggregateOrderStatus,
} from '#shared/schemas/order.schema';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';
import type { OrderStatusUpdate, OrderStatus } from '#shared/schemas/order.schema';

defineRouteMeta({
  openAPI: {
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['status'],
            properties: {
              status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
              itemIds: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Статусы позиций обновлены, агрегат заказа пересчитан' },
      '401': { description: 'Требуется авторизация' },
      '403': { description: 'Требуется роль продавца' },
      '404': { description: 'Заказ не найден' },
      '409': { description: 'Недопустимый переход статуса позиции или нет позиций для изменения' },
    },
  },
});

export default defineEventHandler<
  { params: { id: string }, body: OrderStatusUpdate },
  EventHandlerResponse<{ id: string; status: OrderStatus }>
>(async (event) => {
  const sellerId = await requireSeller(event);
  const id = getRouterParam(event, 'id');
  const body = await readValidatedBody(event, (data) => orderStatusUpdateSchema.parse(data));

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id, sellerId },
      include: { items: { select: { id: true, productId: true, quantity: true, status: true } } },
    });
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Заказ не найден' });

    // Цели перехода: активные позиции (batch) или только выбранные itemIds.
    let targets = order.items.filter((item) => item.status !== 'CANCELLED');
    if (body.itemIds) {
      const selected = new Set(body.itemIds);
      targets = targets.filter((item) => selected.has(item.id));
    }
    if (targets.length === 0) {
      throw createError({ statusCode: 409, statusMessage: 'Нет позиций для изменения статуса' });
    }

    // Каждая позиция проходит переход по своему текущему статусу.
    for (const item of targets) {
      const allowed = ALLOWED_TRANSITIONS[item.status];
      if (!allowed.includes(body.status)) {
        throw createError({
          statusCode: 409,
          statusMessage: `Недопустимый переход статуса позиции: ${item.status} → ${body.status}`,
        });
      }
    }

    // Stock возвращается только отменяемым позициям.
    if (body.status === 'CANCELLED') {
      for (const item of targets) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    const now = new Date();
    const targetIds = targets.map((item) => item.id);
    await tx.orderItem.updateMany({
      where: { id: { in: targetIds } },
      data: { status: body.status, statusUpdatedAt: now },
    });

    // Агрегат заказа — по всем позициям с учётом нового статуса.
    const nextItems = order.items.map((item) =>
      targetIds.includes(item.id)
        ? { id: item.id, status: body.status }
        : { id: item.id, status: item.status },
    );
    const aggregate = aggregateOrderStatus(nextItems);

    return tx.order.update({
      where: { id: order.id },
      data: { status: aggregate },
      select: { id: true, status: true },
    });
  });

  return { id: updated.id, status: updated.status };
});
