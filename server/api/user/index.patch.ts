import { prisma } from '#server/utils/prisma';
import { getServerSession } from '#auth';
import { updateProfileSchema } from '#shared/schemas/user.schema';
import { mapRole } from '#server/utils/roles';

export default defineEventHandler(async (event) => {
  // h3-обёртка next-auth на сервере. Читает JWT-cookie и возвращает данные сессии
  const session = await getServerSession(event);
  // Обновлять можно только свой профиль, если нет — 401
  if (!session?.user?.id) throw createError({ statusCode: 401, statusMessage: 'Не авторизован' });

  // Валидируем тело запроса
  const body = await readValidatedBody(event, (data) => updateProfileSchema.parse(data));

  // Обновляем ТОЛЬКО свои поля (id из сессии, а не из тела)
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: body.name,
      avatarUrl: body.avatarUrl,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
    },
  });

  return {
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatarUrl: updated.avatarUrl,
      role: mapRole(updated.role),
    },
  };
});
