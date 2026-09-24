import { prisma } from '#server/utils/prisma';
import { requireSeller } from '#server/utils/requireSeller';
import { defineRouteMeta } from 'nitropack/runtime';

defineRouteMeta({
  openAPI: {
    tags: ['seller-products'],
    summary: 'Удалить товар',
    responses: {
      '204': { description: 'Товар удалён' },
      '401': { description: 'Требуется авторизация' },
      '403': { description: 'Требуется роль продавца' },
      '404': { description: 'Товар не найден или не принадлежит продавцу' },
      '409': { description: 'Товар есть в заказах — удаление запрещено' },
    },
  },
});

export default defineEventHandler(async (event) => {
  const sellerId = await requireSeller(event);
  const id = getRouterParam(event, 'id');

  const product = await prisma.product.findFirst({
    where: { id, sellerId },
    select: { id: true },
  });
  if (!product) throw createError({ statusCode: 404, statusMessage: 'Товар не найден' });

  const orderItems = await prisma.orderItem.count({ where: { productId: product.id } });
  if (orderItems > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Товар есть в заказах — скройте его вместо удаления',
    });
  }

  // CartItem ссылается на Product с onDelete: Cascade — чистить корзины не нужно.
  await prisma.product.delete({ where: { id: product.id } });

  setResponseStatus(event, 204);
  return null;
});
