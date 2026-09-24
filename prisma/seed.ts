import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../server/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { categories, products } from '../shared/mocks/products';
import type { Role } from '../server/generated/prisma/enums';

// Подключение — тот же паттерн, что в server/utils/prisma.ts (Prisma 7 требует адаптер драйвера)
const url = process.env.DATABASE_URL ?? `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@localhost:${process.env.PG_PORT}/${process.env.PG_DB}`;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

// Тестовые продавцы, как в моках (slug совпадает с p.seller.slug)
const SELLERS = [
  { email: 'torgmix@example.com',   name: 'ТоргМикс',     slug: 'torgmix',   bio: 'Электроника и гаджеты для дома.' },
  { email: 'dom-sklad@example.com', name: 'ДомСклад',     slug: 'dom-sklad', bio: 'Товары для дома и кухни.' },
  { email: 'moda-sport@example.com',name: 'Мода+Спорт',   slug: 'moda-sport',bio: 'Одежда и спорттовары.' },
  { email: 'lit-list@example.com',  name: 'ЛитЛист',      slug: 'lit-list',  bio: 'Книги, пазлы и настольные игры.' },
];

const BUYER = { email: 'buyer@example.com', name: 'Иван Покупатель' };

async function main() {
  // 1) Категории: upsert по @unique(slug).
  //    upsert = «обнови или создай» → повторный запуск не плодит дубли (идемпотентность).
  const catBySlug = new Map<string, string>();
  for (const c of categories) {
    const { id } = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { slug: c.slug, name: c.name },
    });
    catBySlug.set(c.slug, id);
  }

  // 2) Продавцы + покупатель.
  //    Пароль хешируем bcrypt (как register.post.ts:12) — в БД лежит хеш, а не пароль.
  //    Seller123!/Buyer123! проходят serverRegisterSchema → этими учётками можно логиниться.
  const sellerBySlug = new Map<string, string>();
  const sellerHash = await bcrypt.hash('Seller123!', 10);
  for (const s of SELLERS) {
    const { id } = await prisma.user.upsert({
      where: { email: s.email }, // email уникален у любого юзера (покупатель тоже без слага)
      update: {
        name: s.name,
        slug: s.slug, // @unique — на него вешает product.seller
        bio: s.bio,
        role: 'SELLER' as Role
      },
      create: {
        email: s.email,
        name: s.name,
        slug: s.slug,
        bio: s.bio,
        role: 'SELLER' as Role,
        passwordHash: sellerHash
      },
    });
    sellerBySlug.set(s.slug, id);
  }
  await prisma.user.upsert({
    where: { email: BUYER.email },
    update: { name: BUYER.name, role: 'BUYER' },
    create: {
      email: BUYER.email,
      name: BUYER.name,
      role: 'BUYER',
      passwordHash: await bcrypt.hash('Buyer123!', 10)
    },
  });

  // 3) Товары. connect по id из Map
  //    connection продублирован в update → повторный seed синхронизирует БД с моком целиком.
  for (const p of products) {
    const seller = p.seller;
    if (!seller) throw new Error(`У товара ${p.slug} нет seller`);

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        rating: p.rating ?? null,
        images: p.images ?? [],
        stock: p.stock,
        category: {
          connect: {
            id: catBySlug.get(p.category.slug)!
          }
        },
        seller: {
          connect: {
            id: sellerBySlug.get(seller.slug)!
          }
        },
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        rating: p.rating ?? null,
        images: p.images ?? [],
        stock: p.stock,
        isActive: true,
        category: {
          connect: {
            id: catBySlug.get(p.category.slug)!
          }
        },
        seller: {
          connect: {
            id: sellerBySlug.get(seller.slug)!
          }
        },
      },
    });
  }

  // 4) Синхронизация productCount — счётчик живёт на категории, чтобы API не делал COUNT.
  //    Считаем по мокам: источник правды тот же.
  for (const c of categories) {
    const count = products.filter(p => p.category.slug === c.slug).length;
    await prisma.category.update({ where: { slug: c.slug }, data: { productCount: count } });
  }
}

main()
  .then(() => console.error('✅ seed завершён'))
  .catch((e) => { console.error(e); process.exitCode = 1; }) // ненулевой код при ошибке — CI/скрипты заметят падение
  .finally(() => prisma.$disconnect());