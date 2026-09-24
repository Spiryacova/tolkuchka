import { prisma } from '#server/utils/prisma';
import { getServerSession } from '#auth';
import { updatePasswordSchema } from '#shared/schemas/user.schema';
import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session?.user?.id) throw createError({ statusCode: 401, statusMessage: 'Не авторизован' });

  // Валидируем: oldPassword, newPassword, confirm (confirm отбрасываем)
  const { oldPassword, newPassword } = await readValidatedBody(event, (data) =>
    updatePasswordSchema.parse(data),
  );

  // Забираем пользователя с passwordHash
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    throw createError({ statusCode: 400, statusMessage: 'Пароль не задан' });
  }

  // Проверяем старый пароль
  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) {
    throw createError({ statusCode: 400, statusMessage: 'Текущий пароль неверен' });
  }

  // Хешируем новый и сохраняем
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hashed },
  });

  return { success: true };
});
