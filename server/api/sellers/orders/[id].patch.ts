import { prisma } from '#server/utils/prisma';
import { requireSeller } from '#server/utils/requireSeller';
import { orderStatusUpdateSchema, ALLOWED_TRANSITIONS } from '#shared/schemas/order.schema';
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
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Статус обновлён' },
      '401': { description: 'Требуется авторизация' },
      '403': { description: 'Требуется роль продавца' },
      '404': { description: 'Заказ не найден или не содержит позиций продавца' },
      '409': { description: 'Недопустимый переход статуса' },
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
      where: { id, items: { some: { sellerId } } },
      include: { items: { select: { id: true, productId: true, quantity: true } } },
    });
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Заказ не найден' });

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(body.status)) {
      throw createError({
        statusCode: 409,
        statusMessage: `Недопустимый переход статуса: ${order.status} → ${body.status}`,
      });
    }

    // При создании заказа stock списывается по всем позициям — при отмене возвращаем по всем.
    if (body.status === 'CANCELLED') {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return tx.order.update({
      where: { id: order.id },
      data: { status: body.status },
      select: { id: true, status: true },
    });
  });

  return { id: updated.id, status: updated.status };
});