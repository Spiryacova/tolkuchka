import type { H3Event } from 'h3';
import { getServerSession } from '#auth';

export async function requireSeller(event: H3Event): Promise<string> {
  const session = await getServerSession(event);
  if (!session?.user?.id) throw createError({ statusCode: 401, statusMessage: 'Не авторизован' });
  const { role } = session.user;
  if (role !== 'seller' && role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Требуется роль продавца' });
  }
  return session.user.id;
}