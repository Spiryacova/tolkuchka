import { prisma } from '#server/utils/prisma';
import { requireSeller } from '#server/utils/requireSeller';
import { sellerProductInclude, toSellerProductDetail } from '#server/utils/sellerProduct';
import type { SellerProductDetail } from '#shared/schemas/product.schema';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';

defineRouteMeta({
  openAPI: {
    tags: ['seller-products'],
    summary: 'Товар продавца',
    responses: {
      '200': { description: 'Данные товара' },
      '401': { description: 'Требуется авторизация' },
      '403': { description: 'Требуется роль продавца' },
      '404': { description: 'Товар не найден или не принадлежит продавцу' },
    },
  },
});

export default defineEventHandler<object, EventHandlerResponse<SellerProductDetail>>(async (event) => {
  const sellerId = await requireSeller(event);
  const id = getRouterParam(event, 'id');

  const product = await prisma.product.findFirst({
    where: { id, sellerId },
    include: sellerProductInclude,
  });
  if (!product) throw createError({ statusCode: 404, statusMessage: 'Товар не найден' });

  return toSellerProductDetail(product);
});
