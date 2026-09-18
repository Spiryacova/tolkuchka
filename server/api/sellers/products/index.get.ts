import { prisma } from '#server/utils/prisma';
import { requireSeller } from '#server/utils/requireSeller';
import { sellerProductInclude, toSellerProduct } from '#server/utils/sellerProduct';
import {
  sellerProductsQuerySchema,
  type SellerProduct,
  type SellerProductListResponse,
} from '#shared/schemas/product.schema';
import type { Prisma } from '#server/generated/prisma/client';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';

defineRouteMeta({
  openAPI: {
    tags: ['seller-products'],
    summary: 'Товары продавца',
    parameters: [
      { name: 'q', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'status', in: 'query', required: false, schema: { type: 'string', enum: ['all', 'active', 'hidden'], default: 'all' } },
      { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1, default: 1 } },
      { name: 'perPage', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 } },
    ],
    responses: {
      '200': { description: 'Список товаров продавца' },
      '401': { description: 'Требуется авторизация' },
      '403': { description: 'Требуется роль продавца' },
    },
  },
});

export default defineEventHandler<object, EventHandlerResponse<SellerProductListResponse>>(async (event) => {
  const sellerId = await requireSeller(event);
  const query = await getValidatedQuery(event, (data) => sellerProductsQuerySchema.parse(data));

  const searchFilter: Prisma.ProductWhereInput = query.q
    ? { name: { contains: query.q, mode: 'insensitive' } }
    : {};

  const where: Prisma.ProductWhereInput = {
    sellerId,
    ...searchFilter,
    ...(query.status === 'active' ? { isActive: true } : {}),
    ...(query.status === 'hidden' ? { isActive: false } : {}),
  };

  const countsWhere: Prisma.ProductWhereInput = { sellerId, ...searchFilter };

  const [total, grouped, totalProducts, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.groupBy({ by: ['isActive'], where: countsWhere, _count: { _all: true } }),
    prisma.product.count({ where: { sellerId } }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      include: sellerProductInclude,
    }),
  ]);

  const active = grouped.find((g) => g.isActive)?._count._all ?? 0;
  const hidden = grouped.find((g) => !g.isActive)?._count._all ?? 0;

  const items: SellerProduct[] = products.map(toSellerProduct);

  return {
    items,
    page: query.page,
    perPage: query.perPage,
    total,
    counts: { all: active + hidden, active, hidden },
    totalProducts,
  };
});
