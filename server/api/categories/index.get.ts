import { prisma } from '#server/utils/prisma';

export default defineEventHandler(async () => {
  return prisma.category.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  });
});
