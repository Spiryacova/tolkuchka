import { prisma } from '#server/utils/prisma';
import { mapRole } from '#server/utils/roles';
import bcrypt from 'bcrypt';
import { serverRegisterSchema } from '#shared/schemas/auth.schema';
import type { Role } from '#server/generated/prisma/enums';

export default defineEventHandler(async (event) => {
  const { name, email, password, role } = await readValidatedBody(event, (data) =>
    serverRegisterSchema.parse(data),
  );

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const created = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        role: role.toUpperCase() as Role,
      },
      select: { id: true, email: true, name: true, role: true },
    });
    return {
      user: {
        id: created.id,
        email: created.email,
        name: created.name,
        role: mapRole(created.role),
      },
    };
  } catch (e) {
    // P2002 — уникальный email уже существует
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Пользователь уже зарегистрирован' });
    }
    throw e;
  }
});
