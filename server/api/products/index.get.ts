import { prisma } from '#server/utils/prisma';
import type { Prisma } from '#server/generated/prisma/client';
import { catalogQuerySchema, type CatalogQuery } from '#shared/schemas/catalog.schema';

export default defineEventHandler(async (event) => {
  const { q, categoryId, priceMin, priceMax, sort, page, perPage } =
    await getValidatedQuery(event, (data) => catalogQuerySchema.parse(data));

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(q ? { OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ] } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(priceMin !== undefined || priceMax !== undefined
      ? { price: {
          ...(priceMin !== undefined ? { gte: priceMin } : {}),
          ...(priceMax !== undefined ? { lte: priceMax } : {}),
        } }
      : {}),
  };

  const orderByMap: Record<CatalogQuery['sort'], Prisma.ProductOrderByWithRelationInput[]> = {
    relevance: [{ createdAt: 'desc' }],
    priceAsc: [{ price: 'asc' }],
    priceDesc: [{ price: 'desc' }],
    rating: [{ rating: { sort: 'desc', nulls: 'last' } }],
  };
  const orderBy = orderByMap[sort];

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        category: {
          select: {
            id: true,
            slug: true,
            name: true,
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
      },
    }),
  ]);

  const mapped = products.map((p) => ({
    ...p,
    price: Number(p.price),
    oldPrice: p.oldPrice === null ? undefined : Number(p.oldPrice),
    imageUrl: p.images[0] ?? null,
    description: p.description ?? '',
    rating: p.rating ?? undefined,
  }));

  return { products: mapped, total, page, perPage };
});
