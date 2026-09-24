import { prisma } from '#server/utils/prisma';
import { requireSeller } from '#server/utils/requireSeller';
import { sellerProductInclude, toSellerProductDetail } from '#server/utils/sellerProduct';
import { productUpdateSchema, type ProductUpdate, type SellerProductDetail } from '#shared/schemas/product.schema';
import { Prisma } from '#server/generated/prisma/client';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';

defineRouteMeta({
  openAPI: {
    tags: ['seller-products'],
    summary: 'Обновить товар',
    responses: {
      '200': { description: 'Товар обновлён' },
      '400': { description: 'Ошибка валидации или категория не найдена' },
      '401': { description: 'Требуется авторизация' },
      '403': { description: 'Требуется роль продавца' },
      '404': { description: 'Товар не найден или не принадлежит продавцу' },
    },
  },
});

export default defineEventHandler<
  { params: { id: string }, body: ProductUpdate },
  EventHandlerResponse<SellerProductDetail>
>(async (event) => {
  const sellerId = await requireSeller(event);
  const id = getRouterParam(event, 'id');
  const body = await readValidatedBody(event, (data) => productUpdateSchema.parse(data));

  const existing = await prisma.product.findFirst({ where: { id, sellerId }, select: { id: true } });
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Товар не найден' });

  if (body.categoryId !== undefined) {
    const category = await prisma.category.findUnique({ where: { id: body.categoryId }, select: { id: true } });
    if (!category) throw createError({ statusCode: 400, statusMessage: 'Категория не найдена' });
  }

  const updated = await prisma.product.update({
    where: { id: existing.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
      ...(body.description !== undefined ? { description: body.description ? body.description : null } : {}),
      ...(body.price !== undefined ? { price: new Prisma.Decimal(body.price) } : {}),
      ...(body.oldPrice !== undefined
        ? { oldPrice: body.oldPrice === null ? null : new Prisma.Decimal(body.oldPrice) }
        : {}),
      ...(body.stock !== undefined ? { stock: body.stock } : {}),
      ...(body.images !== undefined ? { images: body.images } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    },
    include: sellerProductInclude,
  });

  return toSellerProductDetail(updated);
});
