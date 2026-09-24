import type { H3Event } from 'h3';
import { getServerSession } from '#auth';

export async function requireUser(event: H3Event): Promise<string> {
  const session = await getServerSession(event);
  if (!session?.user?.id) throw createError({ statusCode: 401, statusMessage: 'Не авторизован' });
  return session.user.id;
}
