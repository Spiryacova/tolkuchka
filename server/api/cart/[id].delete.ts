import { prisma } from '#server/utils/prisma';
import { requireUser } from '#server/utils/requireUser';

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, 'id');

  const result = await prisma.cartItem.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) throw createError({ statusCode: 404, statusMessage: 'Позиция не найдена' });
  return { ok: true };
});
