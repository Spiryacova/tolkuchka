import { prisma } from '#server/utils/prisma';
import { requireSeller } from '#server/utils/requireSeller';
import { uniqueProductSlug } from '#server/utils/slugify';
import { sellerProductInclude, toSellerProductDetail } from '#server/utils/sellerProduct';
import { productCreateSchema, type ProductCreate, type SellerProductDetail } from '#shared/schemas/product.schema';
import { Prisma } from '#server/generated/prisma/client';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';

defineRouteMeta({
  openAPI: {
    tags: ['seller-products'],
    summary: 'Создать товар',
    responses: {
      '201': { description: 'Товар создан' },
      '400': { description: 'Ошибка валидации или категория не найдена' },
      '401': { description: 'Требуется авторизация' },
      '403': { description: 'Требуется роль продавца' },
    },
  },
});

export default defineEventHandler<
  { body: ProductCreate },
  EventHandlerResponse<SellerProductDetail>
>(async (event) => {
  const sellerId = await requireSeller(event);
  const body = await readValidatedBody(event, (data) => productCreateSchema.parse(data));

  const category = await prisma.category.findUnique({
    where: { id: body.categoryId },
    select: { id: true },
  });
  if (!category) throw createError({ statusCode: 400, statusMessage: 'Категория не найдена' });

  const created = await prisma.product.create({
    data: {
      sellerId,
      categoryId: body.categoryId,
      name: body.name,
      slug: await uniqueProductSlug(body.name),
      description: body.description ? body.description : null,
      price: new Prisma.Decimal(body.price),
      oldPrice: body.oldPrice === null || body.oldPrice === undefined ? null : new Prisma.Decimal(body.oldPrice),
      stock: body.stock,
      images: body.images,
      isActive: body.isActive,
    },
    include: sellerProductInclude,
  });

  setResponseStatus(event, 201);
  return toSellerProductDetail(created);
});
