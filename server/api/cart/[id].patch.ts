import { prisma } from '#server/utils/prisma';
import { requireUser } from '#server/utils/requireUser';
import { updateCartItemSchema } from '#shared/schemas/cart.schema';
import { toCartItemDto, cartItemProductSelect } from '#server/utils/cart';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';
import type { UpdateCartItem, CartItem } from '#shared/schemas/cart.schema';

defineRouteMeta({
  openAPI: {
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['quantity'],
            properties: { quantity: { type: 'integer', minimum: 1 } },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Количество обновлено' },
      '401': { description: 'Требуется авторизация' },
      '404': { description: 'Позиция не найдена' },
      '409': { description: 'Товар закончился' },
    },
  },
});

export default defineEventHandler<{ params: { id: string }, body: UpdateCartItem }, EventHandlerResponse<CartItem>>(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, 'id');
  const body = await readValidatedBody(event, (data) => updateCartItemSchema.parse(data));

  const item = await prisma.$transaction(async (tx) => {
    // Ищем строку корзины с условием принадлежности: id И userId
    const cartItem = await tx.cartItem.findFirst({
      where: { id, userId },
      include: { product: { select: { stock: true } } },
    });
    if (!cartItem) throw createError({ statusCode: 404, statusMessage: 'Позиция не найдена' });
    if (cartItem.product.stock <= 0) throw createError({ statusCode: 409, statusMessage: 'Товар закончился' });

    return tx.cartItem.update({
      where: { id },
      data: { quantity: Math.min(body.quantity, cartItem.product.stock) },
      select: {
        id: true,
        quantity: true,
        product: {
          select: cartItemProductSelect,
        },
      },
    });
  });

  return toCartItemDto(item);
});
