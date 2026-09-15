import { prisma } from '#server/utils/prisma';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });
  if (!category) throw createError({ statusCode: 404, statusMessage: 'Категория не найдена' });
  return category;
});
