import { prisma } from '#server/utils/prisma';
import { requireUser } from '#server/utils/requireUser';
import type { EventHandlerResponse } from 'h3';

export default defineEventHandler<object, EventHandlerResponse<{ ok: boolean }>>(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, 'id');

  const result = await prisma.cartItem.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) throw createError({ statusCode: 404, statusMessage: 'Позиция не найдена' });
  return { ok: true };
});
