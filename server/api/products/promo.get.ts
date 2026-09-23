import { prisma } from '#server/utils/prisma';
import { Prisma } from '#server/generated/prisma/client';

const DEALS_LIMIT = 14; // 3 карусель + 8 блок + буфер на дедуп
const DAY_MS = 86_400_000;

export default defineEventHandler(async () => {
  const rangeSql = Prisma.sql`((p.old_price - p.price) * 1.0 / p.old_price BETWEEN 0.10 AND 0.80)`;

  const count = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    SELECT count(*)::bigint AS count
    FROM products p
    WHERE p.is_active = true
      AND p.old_price IS NOT NULL
      AND ${rangeSql}
  `);

  const total = Number(count[0]?.count ?? 0);
  const daySeed = Math.floor(Date.now() / DAY_MS);
  const offset = total > DEALS_LIMIT ? daySeed % (total - DEALS_LIMIT + 1) : 0;

  const ids = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT p.id
    FROM products p
    WHERE p.is_active = true
      AND p.old_price IS NOT NULL
      AND ${rangeSql}
    ORDER BY p.rating DESC NULLS LAST, p.id ASC
    LIMIT ${DEALS_LIMIT} OFFSET ${offset}
  `);

  const products = await prisma.product.findMany({
    where: { id: { in: ids.map((r) => r.id) } },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      seller: { select: { id: true, name: true, slug: true } },
    },
  });

  const order = new Map(ids.map((r, idx) => [r.id, idx]));
  products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  const mapped = products.map((p) => ({
    ...p,
    price: Number(p.price),
    oldPrice: p.oldPrice === null ? undefined : Number(p.oldPrice),
    imageUrl: p.images[0] ?? null,
    description: p.description ?? '',
    rating: p.rating ?? undefined,
  }));

  return { products: mapped, total, page: 1, perPage: DEALS_LIMIT };
});
