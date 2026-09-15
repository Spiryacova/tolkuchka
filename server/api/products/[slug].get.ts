import { prisma } from '#server/utils/prisma';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');

  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
      seller: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  });

  if (!product) throw createError({ statusCode: 404, statusMessage: 'Товар не найден' });

  return {
    ...product,
    price: Number(product.price),
    oldPrice: product.oldPrice === null ? undefined : Number(product.oldPrice),
    imageUrl: product.images[0] ?? null,
    description: product.description ?? '',
    rating: product.rating ?? undefined,
  };
});
