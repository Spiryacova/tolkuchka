# Толкучка (Tolkuchka) — План учебного проекта (Nuxt 4 Marketplace)

## Общая задача

**Толкучка** (`tolkuchka`) — учебная мультивендорная площадка электронной коммерции. Продавцы размещают товары, покупатели ищут, фильтруют и приобретают. Проект используется для **полного изучения Nuxt 4** командой из 2 разработчиков.

### Заявленные темы для изучения

- Авторизация (JWT + bcrypt, email + OAuth Google через @sidebase/nuxt-auth)
- SEO (SSR, ISR, useHead, useSeoMeta, Open Graph, sitemap)
- Оптимизация загрузки (lazy loading, code splitting, кэширование, routeRules)
- Code Review (процесс, чеклисты, PR-шаблоны)
- CI/CD (GitHub Actions, автоматический деплой, preview-деплои)
- Pinia (глобальное состояние, SSR-безопасность)
- Prisma ORM (миграции, типизация, серверная логика)
- Nuxt UI v4 (UI-компоненты, Tailwind CSS, auto-import)
- Swagger / OpenAPI (документация API для тестирования бэкенда)

---

## Стек технологий

| Слой | Технология |
|------|------------|
| Фреймворк | Nuxt 4 (Vue 3, Composition API, `<script setup>`) |
| Язык | TypeScript (strict) |
| UI-библиотека | Nuxt UI v4 (Tailwind CSS, auto-import компонентов) |
| Состояние (клиент) | Pinia (`@pinia/nuxt`) |
| Бэкенд | Nuxt Server Routes (`server/api/`) |
| ORM | Prisma |
| Валидация | zod (+ `readValidatedBody`/`readValidatedQuery` в h3, `UForm :schema` на клиенте) |
| БД | PostgreSQL (локально через Docker, прод — Neon/Supabase) |
| Docker | docker-compose для локальной БД (Postgres + pgAdmin), Dockerfile для Nuxt |
| Auth | `@sidebase/nuxt-auth` (JWT, NextAuth-подобный) + bcrypt |
| Тестирование | Vitest + @nuxt/test-utils |
| Linting | ESLint + Prettier |
| CI/CD | GitHub Actions |
| Деплой | Vercel (staging из develop, production из main) |
| Мониторинг | Sentry (опционально) |
| API Docs | `@scalar/nuxt` (Scalar UI на `/api-docs`, тёмная тема) + Nitro OpenAPI-спека (`nitro.experimental.openAPI` → `/_openapi.json`) |

### Спринтовые зависимости (кто и когда ставит)

Общие зависимости уже установлены: `@fontsource-variable/inter`, `zod` (коммиты 015f907, 36a3772). Остальные ставит владелец спринта just-in-time, отдельным коммитом:

| Пакеты | Спринт | Кто | Задача |
|--------|--------|-----|--------|
| `prisma`, `@prisma/client` | 1–2 | Dev 1 | init, схема, первая миграция |
| `@sidebase/nuxt-auth`, `next-auth@~4.21.1` (peer!), `bcrypt` | 1–2 | Dev 1 | auth (#9) |
| `@scalar/nuxt` (выбран в #10) | 1–2 | Dev 1 | API docs (#10) |
| `pinia`, `@pinia/nuxt` | 1–2 | Dev 1 | products store (#21), корзина (#30); auth-стор заменён на `useAuth()` (#14) |
| `vitest`, `@nuxt/test-utils` | 5 | по задаче | тесты (#50–51) |

Gotcha: `@sidebase/nuxt-auth` требует peer `next-auth` именно v4 (`~4.21.1`), не v5/Auth.js.

### Дополнительные инструкции

- [GIT-WORKFLOW.md](./GIT-WORKFLOW.md) — правила совместной работы, ветвление, PR, ревью
- [CI-CD.md](./CI-CD.md) — Docker, GitHub Actions, деплой staging/production
- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) — единый стиль проекта: цвета, типографика, компоненты Nuxt UI
- [DEV-WORKFLOW.md](./DEV-WORKFLOW.md) — процесс разработки фич через скиллы (JTBD → CRO → сущности + компоненты → refactoring-ui)
- [skeletons/](./skeletons/README.md) — каркасы всех страниц: блоки, UX, компоненты, сущности, тех. каркас

---

## Уровень команды

Начинающий — знакомы с Vue, но Nuxt не использовали ранее.

## Горизонт планирования

4–6 недель (5 спринтов по ~1 неделе).

---

## Структура проекта (Nuxt 4)

В Nuxt 4 весь клиентский код lives в `app/`, серверный — в `server/` на корневом уровне.

```
tolkuchka/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint + Typecheck + Tests на каждый PR
│   │   ├── deploy-staging.yml        # Деплой на Vercel при мерже в develop
│   │   └── deploy-production.yml     # Деплой на Vercel при мерже в main
│   └── PULL_REQUEST_TEMPLATE.md      # Чеклист Code Review
├── docker-compose.yml                # Postgres + pgAdmin для локальной разработки
├── Dockerfile                        # Multi-stage образ Nuxt (опционально)
├── prisma/
│   ├── schema.prisma                 # Схема БД
│   ├── seed.ts                       # Seed-данные (товары, тестовые пользователи)
│   └── migrations/                   # Автогенерированные миграции
├── app/
│   ├── app.vue                       # Root component
│   ├── app.config.ts                 # Цветовая палитра и тема Nuxt UI
│   ├── error.vue                     # Глобальная страница ошибок
│   ├── components/
│   │   ├── common/                   # Доменные композиты (НЕ обёртки Nuxt UI)
│   │   ├── product/                  # ProductCard, ProductGallery, ProductFilters
│   │   ├── cart/                     # CartItem, CartSummary
│   │   ├── layout/                   # AppHeader, AppFooter, AppSidebar
│   │   └── seller/                   # SellerStats, SellerOrderList
│   ├── composables/
│   │   ├── useCart.ts                # Корзина (клиентская логика + Pinia)
│   │   ├── useSeo.ts                 # Генерация SEO-тегов
│   │   └── useFormat.ts              # Форматирование цен, дат
│   ├── stores/
│   │   ├── auth.ts                   # useAuthStore() — сессия, профиль, роли
│   │   ├── cart.ts                   # useCartStore() — корзина (межстраничная)
│   │   ├── products.ts               # useProductsStore() — каталог, фильтры, кэш
│   │   └── seller.ts                 # useSellerStore() — статистика продавца
│   ├── layouts/
│   │   ├── default.vue
│   │   └── dashboard.vue             # Лейаут для кабинета продавца
│   ├── middleware/
│   │   ├── auth.ts                   # Проверка авторизации (клиентская)
│   │   ├── seller.ts                 # Проверка роли продавца
│   │   └── guest.ts                  # Редирект авторизованных с login/register
│   ├── pages/
│   │   ├── index.vue                 # /               Главная (SSR)
│   │   ├── products/
│   │   │   ├── index.vue             # /products       Каталог + фильтры (ISR)
│   │   │   └── [slug].vue            # /products/:slug Карточка товара (SSR + ISR)
│   │   ├── categories/
│   │   │   └── [slug].vue            # /categories/:slug  Категория (ISR, SEO)
│   │   ├── auth/
│   │   │   ├── login.vue             # /auth/login     (guest middleware)
│   │   │   └── register.vue          # /auth/register  (guest middleware, выбор роли)
│   │   ├── cart.vue                  # /cart           (default layout)
│   │   ├── checkout/
│   │   │   ├── index.vue             # /checkout       (auth middleware)
│   │   │   └── success.vue           # /checkout/success (подтверждение заказа)
│   │   ├── seller/                   # index.vue — публичный лендинг (без middleware);
│   │   │   │                         # кабинет: layout: dashboard, middleware: seller
│   │   │   ├── index.vue             # /seller         Лендинг «Продавайте на Толкучке»
│   │   │   ├── dashboard.vue         # /seller/dashboard
│   │   │   ├── products/
│   │   │   │   ├── index.vue         # /seller/products
│   │   │   │   ├── new.vue           # /seller/products/new
│   │   │   │   └── [id]/
│   │   │   │       └── edit.vue      # /seller/products/:id/edit
│   │   │   └── orders/
│   │   │       ├── index.vue         # /seller/orders
│   │   │       └── [id].vue          # /seller/orders/:id
│   │   ├── sellers/
│   │   │   └── [slug].vue            # /sellers/:slug  Публичный профиль продавца (ISR)
│   │   ├── account/                  # middleware: auth
│   │   │   ├── settings.vue          # /account/settings
│   │   │   └── orders/
│   │   │       ├── index.vue         # /account/orders
│   │   │       └── [id].vue          # /account/orders/:id
│   │   ├── about.vue                 # /about
│   │   ├── contact.vue               # /contact
│   │   ├── privacy.vue               # /privacy
│   │   ├── terms.vue                 # /terms
│   │   └── [...slug].vue             # /[...slug]      404 catch-all
│   ├── plugins/
│   │   └── prisma.client.ts          # Prisma-клиент (синглтон)
│   └── utils/
│       ├── format.ts                 # Форматирование цен, дат
│       └── validators.ts             # Валидация форм
├── server/
│   ├── plugins/
│   │   └── prisma.ts                 # Prisma синглтон (серверный плагин Nuxt)
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...].ts              # @sidebase/nuxt-auth API-маршруты
│   │   ├── categories/
│   │   │   ├── index.get.ts          # GET /api/categories (список для dropdown/футера)
│   │   │   └── [slug].get.ts         # GET /api/categories/:slug (категория + товары)
│   │   ├── products/
│   │   │   ├── index.get.ts          # GET /api/products (фильтры, пагинация)
│   │   │   ├── [slug].get.ts         # GET /api/products/:slug
│   │   │   └── index.post.ts         # POST /api/products (создание)
│   │   ├── cart/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   └── [id].delete.ts
│   │   ├── orders/
│   │   │   ├── index.get.ts
│   │   │   └── index.post.ts
│   │   └── sellers/
│   │       ├── stats.get.ts
│   │       ├── products.get.ts
│   │       ├── [slug].get.ts          # GET /api/sellers/:slug (публичный профиль + товары)
│   │       └── become.post.ts         # POST /api/sellers/become (смена роли BUYER → SELLER)
│   ├── middleware/
│   │   ├── auth.ts                   # Серверная проверка JWT (сессия)
│   │   └── seller-role.ts            # Проверка роли продавца на сервере
│   └── utils/
│       ├── prisma.ts                 # Экспорт prisma-клиента (для server/)
│       └── swagger.ts                # OpenAPI мета-информация (название, версия, schemas)
├── shared/
│   └── schemas/                      # Общие zod-схемы (клиент + сервер)
│       ├── auth.schema.ts            # loginSchema, registerSchema
│       ├── product.schema.ts         # createProductSchema, updateProductSchema
│       ├── cart.schema.ts
│       └── order.schema.ts
├── assets/
│   └── css/
│       └── main.css
├── public/
│   ├── favicon.ico
│   └── images/
├── nuxt.config.ts
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── .prettierrc
├── .prettierignore
├── .env.example
└── README.md
```

---

## API Документация (Scalar / OpenAPI)

> ⚠️ **Решение команды 2026-08-21:** заявленный в плане `@sidebase/nuxt-swagger` **не существует на npm**. Выбор инструмента — задача Dev 1 в спринте 1–2 (задача #10), выбран `@scalar/nuxt` (нативный Nuxt-модуль; рендерит OpenAPI-спек с эндпоинтами, параметрами, схемами и Test request). Конфигурация ниже — иллюстративная, актуальная настройка в `nuxt.config.ts` (модуль + `nitro.experimental.openAPI`).

Для тестирования бэкенда используется OpenAPI-документация UI — автоматически генерируемая спецификация из TypeScript-типов server routes.

### Как это работает

1. Nitro генерирует OpenAPI-спеку: `nitro.experimental.openAPI: true` → JSON доступен по `/_openapi.json`
2. Модуль `@scalar/nuxt` регистрирует страницу `/api-docs/:pathMatch(.*)*` (спасибо `pathRouting.basePath`), рендерит Scalar UI и тянет спеку с `/_openapi.json`
3. Страница отдаётся как SPA: `routeRules: { '/api-docs': { ssr: false }, '/api-docs/**': { ssr: false } }` — SSR-рендер компонента Scalar крашится в Nitro (`web-worker` → `threads.workerData` undefined, см. `@scalar/nuxt` SSR-issue). Клиентская отрисовка не страдает.

### Конфигурация (`nuxt.config.ts`)

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@pinia/nuxt', '@sidebase/nuxt-auth', '@scalar/nuxt'],
  nitro: {
    experimental: {
      openAPI: true, // генерация /_openapi.json
    },
  },
  routeRules: {
    '/api-docs': { ssr: false },
    '/api-docs/**': { ssr: false },
  },
  scalar: {
    pathRouting: { basePath: '/api-docs' },
    metaData: { title: 'Толкучка API' },
    darkMode: true,
    showSidebar: true,
  },
})
```

### Аnotations в server routes (опционально, для более точной документации)

Для описания endpoint'ов можно использовать JSDoc-аннотации в серверных обработчиках:

```ts
// server/api/products/index.get.ts
/**
 * @summary Get products list
 * @description Returns paginated list of products with filters
 * @tags Products
 * @queryParam {string} category - Filter by category
 * @queryParam {number} minPrice - Min price filter
 * @queryParam {number} maxPrice - Max price filter
 * @queryParam {string} search - Search by title
 * @queryParam {number} page - Page number (default: 1)
 * @queryParam {number} limit - Items per page (default: 20)
 * @response 200 - Success response with products array
 */
export default defineEventHandler(async (event) => {
  // ...
})
```

### Порядок работы для команды

1. **Dev 1** (бэкенд) — создаёт server routes с типизацией
2. **Scalar UI** автоматически обновляется — тот же Dev 1 тестирует API без ожидания фронта
3. **Dev 1** — подключает фронтенд к уже задокументированным API
4. При PR — ревьювер (Dev 2) может открыть `/api-docs` и проверить все endpoint'ы

---

## Тема и цветовая палитра (Nuxt UI v4)

Отдельный Tailwind-конфиг подключать **не нужно** — Tailwind идёт в составе Nuxt UI, его utility-классы доступны сразу (layout, сетки, выравнивание, отступы). Палитра и тёмная тема настраиваются в одном месте.

### Цвета и тёмная тема

Все компоненты Nuxt UI автоматически поддерживают светлую и тёмную темы (класс `.dark` на `<html>`). Тема CSS-first: базовые токены — через `@theme` в `app/assets/css/main.css`, семантические цвета бренда — маппингом на шкалы Tailwind в `app/app.config.ts` (подробно — [DESIGN-SYSTEM.md §2](./DESIGN-SYSTEM.md)):

```ts
// app/app.config.ts — единая цветовая палитра проекта
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',   // ← основной цвет бренда (зелёный, #10b981 @ 500)
      secondary: 'blue',    // ← вторичный (ссылки, вторичные действия)
      neutral: 'slate',     // ← текст, бордеры, фоны
    },
  },
})
```

### Переключатель темы

```vue
<script setup lang="ts">
const colorMode = useColorMode()
</script>

<template>
  <UButton icon="i-heroicons-moon" @click="colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'" />
</template>
```

### Правила для команды

- **Никаких хардкод-цветов** в компонентах — только токены (`@theme` в `main.css`, `ui.colors` в `app.config.ts`) и Tailwind-классы
- Оба разработчика используют одну палитру из `app.config.ts` (меняется в одном месте)
- `useColorMode` хранит выбор в localStorage, при SSR отдаёт серверную тему без мигания
- Для сущностей (статусы заказов, категории) — семантические цвета `success`/`warning`/`error`, а не новые hex

---

## Схема базы данных (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================
// Пользователи и авторизация
// ==========================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?   @map("password_hash")
  name          String?
  slug          String?   @unique     # для публичного профиля /sellers/:slug (у продавцов)
  bio           String?               # краткое описание магазина
  avatarUrl     String?   @map("avatar_url")
  role          Role      @default(BUYER)
  emailVerified DateTime? @map("email_verified")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  products      Product[]
  cartItems     CartItem[]
  buyerOrders   Order[]     @relation("BuyerOrders")
  sellerOrders  OrderItem[]
  accounts      Account[]
  sessions      Session[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refreshToken      String? @map("refresh_token")
  accessToken       String? @map("access_token")
  expiresAt         Int?    @map("expires_at")
  tokenType         String? @map("token_type")
  scope             String?
  idToken           String? @map("id_token")
  sessionState      String? @map("session_state")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

enum Role {
  BUYER
  SELLER
  ADMIN
}

// ==========================
// Товары
// ==========================

model Category {
  id        String    @id @default(cuid())
  slug      String    @unique
  name      String
  imageUrl  String?   @map("image_url")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  products  Product[]

  @@map("categories")
}

model Product {
  id          String   @id @default(cuid())
  sellerId    String   @map("seller_id")
  categoryId  String   @map("category_id")
  title       String
  slug        String   @unique
  description String?
  price       Decimal  @db.Decimal(10, 2)
  images      String[]
  stock       Int      @default(0)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  seller      User        @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  category    Category    @relation(fields: [categoryId], references: [id])
  cartItems   CartItem[]
  orderItems  OrderItem[]

  @@index([categoryId])
  @@index([sellerId])
  @@map("products")
}

// ==========================
// Корзина
// ==========================

model CartItem {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  productId String   @map("product_id")
  quantity  Int      @default(1)
  createdAt DateTime @default(now()) @map("created_at")

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@map("cart_items")
}

// ==========================
// Заказы
// ==========================

model Order {
  id              String      @id @default(cuid())
  buyerId         String      @map("buyer_id")
  total           Decimal     @db.Decimal(10, 2)
  status          OrderStatus @default(PENDING)
  shippingAddress Json?       @map("shipping_address")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  buyer      User        @relation("BuyerOrders", fields: [buyerId], references: [id])
  items      OrderItem[]

  @@index([buyerId])
  @@map("orders")
}

model OrderItem {
  id               String  @id @default(cuid())
  orderId          String  @map("order_id")
  productId        String  @map("product_id")
  sellerId         String  @map("seller_id")
  quantity         Int
  priceAtPurchase  Decimal @db.Decimal(10, 2) @map("price_at_purchase")

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])
  seller  User    @relation(fields: [sellerId], references: [id])

  @@map("order_items")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}
```

---

## Спринты

### Спринт 1 (Неделя 1–2): Фундамент + Авторизация

**Цель:** Проект запускается, авторизация работает, базовая навигация готова.

| # | Задача | Кто | Ключевые темы |
|---|--------|-----|---------------|
| 1 | Инициализация GitHub-репозитория: ветки `main`/`develop`, protected branches, ознакомиться с [GIT-WORKFLOW.md](./GIT-WORKFLOW.md) | Dev 1 ✅ | Git flow, GitHub настройки |
| 2 | `npx nuxi@latest init`, настройка TS (strict), Tailwind, ESLint, Prettier | Dev 1 ✅ | Nuxt CLI, конфигурация |
| 3 | Установка модулей: `@nuxt/ui`, `@pinia/nuxt`, `@sidebase/nuxt-auth` | Dev 1 ✅ | nuxt.config.ts, modules |
| 4 | Настройка темы Nuxt UI: `app.config.ts` — цветовая палитра (primary/secondary), светлая/тёмная тема, переключатель `useColorMode` в AppHeader | Dev 1 ✅ | Nuxt UI тема, dark mode, токены |
| 5 | Создание [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) — цвета, типографика, отступы, тени, компонентная карта Nuxt UI, состояния | Оба ✅ | Дизайн-система, конвенции |
| 6 | `docker-compose.yml` — Postgres + pgAdmin для локальной разработки (по [CI-CD.md](./CI-CD.md)) | Dev 1 ✅ | Docker, docker-compose |
| 7 | Инициализация Prisma: `npx prisma init`, создание schema.prisma, первая миграция | Dev 1 ✅ | Prisma, PostgreSQL, миграции |
| 8 | Настройка `server/utils/prisma.ts` — синглтон для server/ | Dev 1 ✅ | Server utils, синглтон-паттерн |
| 9 | Настройка `@sidebase/nuxt-auth` — Credentials провайдер + JWT стратегия | Dev 1 ✅ | Auth, JWT, cookies |
| 10 | API-документация: выбран `@scalar/nuxt` (`nitro.experimental.openAPI`), UI на `/api-docs` (SPA) | Dev 1 ✅ | OpenAPI, Nitro-спека, документация |
| 11 | Создание layouts (`default`, `dashboard`), AppHeader, AppFooter на Nuxt UI | Dev 1 ✅ | Layouts, Nuxt UI компоненты |
| 12 | Страницы `auth/login` и `auth/register` (Nuxt UI формы) — при регистрации выбор роли «Покупатель / Продавец» | Dev 1 ✅ | SSR Forms, Nuxt UI |
| 13 | Общие zod-схемы `shared/schemas/auth.schema.ts` (login/register; правило: схему каждой фичи пишет её владелец), подключение к `UForm :schema` и `readValidatedBody`. Пакет zod уже установлен (36a3772) | Dev 1 ✅ | zod, валидация, shared/ |
| 14 | Pinia store `auth.ts` — useAuthStore() с привязкой к сессии (*сделано иначе:* используется `useAuth()` из `@sidebase/nuxt-auth`, отдельный Pinia-стор не создавался) | Dev 1 ✅ | Pinia, SSR-safe stores |
| 15 | Route middleware: защита страниц и guest-редирект — built-in `auth` от `@sidebase` (`auth: { unauthenticatedOnly }`); кастомный файл только `seller.ts` | Dev 1 ✅ | Route middleware, definePageMeta |
| 16 | Seed данных в PostgreSQL: тестовые пользователи (buyer/seller); с #19 расширен до каталога (категории + 54 товара) | Dev 1 ✅ | Prisma seed |
| 17 | Профиль пользователя (`account/settings`) | Dev 1 ✅ | Protected routes |
| 18 | Настройка `.github/workflows/ci.yml` — ESLint + typecheck + тесты | Dev 1 ✅ | CI/CD, GitHub Actions |

**Exit criteria:** Регистрация → Login → Доступ к профилю → Logout. Защищённые страницы перенаправляют на login. CI запускается на PR. Scalar UI доступен по `/api-docs`, OpenAPI-спека — на `/_openapi.json`. Postgres работает в Docker у обоих, первая миграция применена. Тема Nuxt UI настроена (палитра, светлая/тёмная), переключатель темы работает. [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) создан и согласован. Формы auth валидируются через zod (`UForm :schema` + `readValidatedBody`), схемы в `shared/schemas/auth.schema.ts`.

**Спринт 1 закрыт ✅ (2026-09).**

---

### Спринт 2 (Неделя 2–3): Каталог товаров + SEO

**Цель:** Товары отображаются с SSR, SEO-теги настроены, фильтры работают.

| # | Задача | Кто | Ключевые темы |
|---|--------|-----|---------------|
| 19 | Prisma schema: модель `Category` + `Product.categoryId` (связь, индексы, `@@map`), миграция `add_catalog`, seed: категории + 54 товара (идемпотентный `upsert`) | Dev 1 ✅ | Prisma, seed script |
| 20 | `server/api/products/index.get.ts` + `[slug].get.ts`, категории, zod-схема запроса, стор и страницы на серверных фильтрах/пагинации | Dev 1 ✅ | Server API, query params, Prisma, zod |
| 21 | Pinia store `products.ts` — каталог, фильтры, кэш — ✅ PR #6 (на ревью) | Dev 1 | Pinia getters, caching |
| 22 | `pages/products/index.vue` — каталог, фильтры, сортировка (ISR) + `pages/categories/[slug].vue` — страница категории (ISR) — ✅ PR #6 (на ревью) | Dev 1 | `useAsyncData`, ISR, routeRules |
| 23 | `pages/products/[slug].vue` — карточка товара (SSR) — ✅ | Dev 2 | Dynamic routes, definePageMeta |
| 24 | SEO: `useHead`, `useSeoMeta` на каталоге и карточках — ✅ | Dev 1 | SEO — мета-теги, Open Graph |
| 25 | `@nuxtjs/sitemap` — автогенерация sitemap.xml — ✅ | Dev 2 | Sitemap module |
| 26 | `robots.txt` — ✅ | Dev 1 | SEO basics |
| 27 | Breadcrumb-навигация (Nuxt UI UBreadcrumb) — ✅ (есть на карточке товара; на категориях не нужны, пока нет подкатегорий) | Dev 2 | Composables, route matching |
| 28 | OG:image генерация для товаров — ✅ (og-теги настроены; на странице товара ogImage = первое фото) | Dev 1 | Open Graph, SSR для ботов |

**Exit criteria:** Каталог с фильтрацией. Карточка товара с полным SEO. Googlebot видит контент. Lighthouse SEO > 90.

---

### Спринт 3 (Неделя 3–4): Корзина, Оформление, Кабинет продавца

**Цель:** Полный флоу покупки. Продавец управляет товарами и видит заказы.

| # | Задача | Кто | Ключевые темы |
|---|--------|-----|---------------|
| 29 | `server/api/cart/*` — CRUD корзины (Prisma транзакции) | Dev 1 ✅ | Server API, Prisma |
| 30 | Pinia store `cart.ts` — клиентская корзина: серверный контракт `/api/cart` + гостевая корзина в localStorage | Dev 1 ✅ | Pinia actions, SSR-safe |
| 31 | Страница `cart.vue` — отображение, изменение количества (+ гостевая: ревалидация, гейт «Войти и оформить») | Dev 1 ✅ | Forms, Nuxt UI |
| 32 | `pages/checkout/` — `index.vue` (оформление, адрес, подтверждение) + `success.vue` (подтверждение заказа) | Dev 1 | Form validation, middleware |
| 33 | `server/api/orders/index.post.ts` — создание заказа (Prisma транзакция) | Dev 1 ✅ | Server transactions, error handling |
| 34 | Pinia store `seller.ts` — статистика продавца | Dev 1 | Pinia getters, вычисления |
| 35 | `seller/dashboard.vue` — статистика (выручка, заказы) | Dev 1 | `useAsyncData`, серверные данные |
| 36 | `seller/products/new.vue` — создание товара | Dev 1 | Forms, file upload |
| 37 | `seller/products/index.vue` — список товаров + `seller/products/[id]/edit.vue` — редактирование | Dev 1 | CRUD UI, Nuxt UI DataTable |
| 38 | `seller/orders/` — `index.vue` (заказы продавца) + `[id].vue` (детали, смена статуса) | Dev 1 | Status management |
| 39 | `account/orders/` — `index.vue` (история покупок) + `[id].vue` (детали заказа) | Dev 1 | Order history |

**Exit criteria:** Каталог → Добавление в корзину → Оформление → Заказ создан. Продавец видит товар и заказ в кабинете.

---

### Спринт 4 (Неделя 4–5): Оптимизация загрузки + Производительность

**Цель:** Lighthouse Performance > 90, команда понимает паттерны оптимизации.

| # | Задача | Кто | Ключевые темы |
|---|--------|-----|---------------|
| 40 | Аудит Lighthouse, фикс LCP — ленивая загрузка изображений | Dev 1 | `<NuxtImg>`, lazy loading, WebP |
| 41 | `routeRules` в `nuxt.config.ts` — ISR для каталога, prerender для лендинга | Dev 1 | routeRules |
| 42 | Кэширование API: `defineCachedEventHandler` для товаров | Dev 1 | Server-side caching |
| 43 | Code Splitting: `<Lazy*>` для тяжёлых компонентов | Dev 1 | Dynamic imports, Lazy* |
| 44 | Скелетоны при загрузке (Nuxt UI USkeleton) | Dev 1 | UX, useLoadingIndicator |
| 45 | `nuxi analyze` — анализ bundle size, оптимизация | Dev 1 | Bundle analysis |
| 46 | Web Vitals метрики, Sentry интеграция (опционально) | Dev 1 | Monitoring, error tracking |
| 47 | Предзагрузка данных: `prefetch` / `preloadRouteComponents` | Dev 1 | Navigation UX |

**Exit criteria:** Lighthouse Performance > 90, FCP < 1.5s, LCP < 2.5s. Скелетоны на всех загружаемых страницах.

---

### Спринт 5 (Неделя 5–6): CI/CD, Тесты, Деплой, Polish

**Цель:** Автодеплой работает, есть тесты, проект готов к демо.

| # | Задача | Кто | Ключевые темы |
|---|--------|-----|---------------|
| 48 | Настройка Vercel: проект, `develop` → staging, `main` → production (по [CI-CD.md](./CI-CD.md)) | Dev 1 | Vercel, env-переменные |
| 49 | `Dockerfile` для Nuxt (multi-stage build) — изучение сборки образа | Dev 1 | Docker, multi-stage |
| 50 | E2E тесты: `@nuxt/test-utils` + Vitest | Dev 1 | Testing in Nuxt |
| 51 | Unit-тесты для server API | Dev 1 | Server testing, Vitest |
| 52 | Error pages: `app/error.vue` + `app/pages/[...slug].vue` (404 catch-all) | Dev 1 | Error handling, createError |
| 53 | Мультиязычность: `@nuxtjs/i18n` — RU/EN | Dev 1 | i18n, locale routing |
| 54 | Поиск с debounce + подсветка результатов | Dev 1 | Client-side UX, useDebounceFn |
| 55 | README.md, документация API, .env.example | Dev 1 | Documentation |
| 56 | Финальный polish: анимации переходов, loading states | Dev 1 | Transitions, UX |
| 57 | Релиз `develop → main` по сценарию [CI-CD.md](./CI-CD.md), smoke test | Оба | Release process |

**Exit Criteria:** CI зелёный, staging и production на Vercel работают, все критические флоу протестированы, Performance > 90.

### Дополнительные задачи (добавлены при проектировании архитектуры)

| # | Задача | Спринт | Кто | Ключевые темы |
|---|--------|--------|-----|---------------|
| 58 | Лендинг `/seller` «Продавайте на Толкучке» + флоу «Стать продавцом» (`server/api/sellers/become.post.ts`, смена роли BUYER → SELLER; CTA из шапки/футера) | 3 | Dev 1 | Роли, server action, лендинг |
| 59 | Публичный профиль продавца `/sellers/[slug]` + `server/api/sellers/[slug].get.ts` (товары продавца, ссылка из карточки товара) | 3 | Dev 1 | ISR, SEO, динамические роуты |

---

## Бэклог (на потом)

Фичи полноценного маркетплейса, осознанно вынесенные из учебного MVP. Открывать отдельным PR с проектированием по [DEV-WORKFLOW.md](./DEV-WORKFLOW.md).

| Фича | Что потребуется | Заметки |
|------|-----------------|---------|
| Отзывы и рейтинги | модель `Review`/`Rating` в Prisma + блоки на карточке товара и профиле продавца | самая весомая из отсутствующих фич маркетплейса |
| Восстановление пароля | `auth/forgot-password` + `auth/reset-password`, почтовая отправка | сейчас email-инфраструктуры нет |
| Помощь/FAQ | контентные `/help/*` (доставка, возвраты, вопросы) | — |
| Избранное (wishlist) | модель `WishlistItem` + страница `/account/favorites` | уже помечено в DEV-WORKFLOW как бэклог |
| Админ-панель | `Role.ADMIN` есть в enum, но ни одной админ-страницы | вне скоупа учебного проекта |
| **Оплата** | платёжный провайдер (Stripe/ЮKassa), webhook, статусы оплаты | **осознанное ограничение MVP:** заказ создаётся без оплаты; подключать на этапе развития проекта |
| Вход через GitHub (OAuth) | провайдер `GitHubProvider` в `server/api/auth/[...].ts` + env (`GITHUB_ID`, `GITHUB_SECRET`) + redirect URI | лучший первый «внешний IdP»: бесплатно, без ревью приложения. Роль по умолчанию — `buyer`; вопрос «как стать продавцом» решаем при реализации. Делать после #15 |
| Вход по телефону и паролю | идентификатор входа `phone` (или выбор phone/email) в mock-users/schema/`authorize` | ломает «email = уникальный логин» — меняется контракт, а не просто новый провайдер. Отдельная мини-фича со своим проектированием |
| SMS-OTP (учебная тема) | мок-эмуляция кода (вывод в консоль/ответ в dev), флоу «запросить код → ввести код» | реальный провайдер платный (Twilio и т.п.), для учебного проекта мок достаточен, чтобы понять OTP-флоу |
| Привязка аккаунтов (OAuth ↔ email) | связывание нескольких identity с одним аккаунтом | сложность выше среднего; есть смысл только когда появятся и социальные, и парольные входы вместе |
| Перенос sitemap на данные БД/API | сейчас `nuxt.config.ts` импортирует `shared/mocks/products` для `sitemap.urls` (PR #18); после #20 каталог переедет в БД | делать сразу после #20 — моки и API разъедутся, sitemap перестанет совпадать с сайтом |
| OG-превью и канонические ссылки | `site.url: 'https://tolkuchka.ru'` захардкожен (PR #18); `og:image` на карточке товара и странице категории — относительные, соцсети (VK/TG/FB) без абсолютного URL не соберут превью | при деплое на Vercel: `site.url` брать из env (`NUXT_SITE_URL`/runtimeConfig), `og:image` собирать абсолютным (для категорий — первое фото товара категории); мелочи: `ogType` → `'product'` на карточке |
| Отображение скрытых/закончившихся товаров в корзине | продумать UX и судьбу строки: товар скрыт продавцом / `stock = 0` — что показывает корзина (гостевая после ревалидации и залогиненная) | сейчас такие строки **молча выпадают** при merge (гостевая чистится целиком) и помечаются «Нет в наличии» в UI; нужно решить: индикация, блокировка оформления, авто-удаление с уведомлением |

---

## Известные проблемы (разобраться)

| Проблема | Что проверено | Обход сейчас | Как чинить |
|----------|---------------|--------------|------------|
| SSR-warning иконок `[Icon] failed to load icon heroicons:*`, в серверном HTML 0 SVG (2026-08-23) | @nuxt/icon **2.5.0** + @nuxt/ui **4.10.0**. Проверено: коллекция `@iconify-json/heroicons` локально установлена; бандл `.nuxt/nuxt-icon-server-bundle.mjs` генерируется верно; лоадер отдаёт все иконки при прямом вызове; эндпоинт `/api/_nuxt_icon/heroicons.json` работает (curl); конфиг `provider: 'server'` + `serverBundle.collections` доходит до runtime app.config — но SSR-резолв всё равно падает. Дефолтный `mode: 'css'` тоже не даёт классов в HTML. Гипотеза: плагин отдаёт загрузчику Iconify «сырый» fetch (`$fetch.native`), который на сервере не резолвит относительный URL `/api/...` | Иконки визуально работают (клиент докупает после гидрации); warning — девелоперский шум. Конфиг иконок оставлен как есть — он правильный и пригодится на проде | Варианты: пин `@nuxt/icon@2.4.1` через `overrides` (в диапазоне `^2.3.1` от @nuxt/ui) → перезапуск → проверить HTML; если не поможет — изучить цепочку `plugin.js → shared.js → @iconify/vue` в node_modules; оформить issue в [nuxt/icon](https://github.com/nuxt/icon) с repro |
| `@sidebase/nuxt-auth`: warning `AUTH_NO_ORIGIN: No origin`; при заданном без пути env — `Recursion detected at /session` + GET `/session` 404 (2026-08-28) | `AUTH_ORIGIN` — НЕ «доменная подсказка», а полный `baseURL` (origin + path). Модуль подставляет его вместо `baseURL` в `url.js:15–20`, затем отрезает до **pathname** в `url.js:21–23`. Пример поломки: `AUTH_ORIGIN=http://localhost:3000` → pathname `''` → запрос уходит на `/session` вместо `/api/auth/session` → 404 + срабатывает детектор рекурсии. Корректно — только с путём: `AUTH_ORIGIN=http://localhost:3000/api/auth` | В dev работает и без переменной (дефолт `auth.baseURL: '/api/auth'`), warning безвреден. Держим `AUTH_ORIGIN=http://localhost:3000/api/auth` — тишина в логах + паритет с продом | Перед деплоем на Vercel (спринт 5): `AUTH_ORIGIN=https://<домен>/api/auth` (staging + production). Также на проде обязателен `NUXT_AUTH_SECRET` (без него хендлер падает `Error: NO_SECRET`) |

---

## Процесс Code Review

> Подробная инструкция по git-флоу, созданию PR и настройке GitHub — в [GIT-WORKFLOW.md](./GIT-WORKFLOW.md).

### Ветвление

```
main (protected, автодеплой на PRODUCTION)
  └── develop (protected, автодеплой на STAGING)
       ├── feature/TASK-01-init-project
       ├── feature/TASK-02-prisma-setup
       ├── feature/TASK-03-layouts
       └── ...
```

### Правила

1. **Все изменения** — только через PR в `develop`
2. **PR требует 1 approval** (команда из 2 человек — ревьюят друг друга)
3. **Запрет прямого мержа в `main`** — только через `develop` после интеграции спринта
4. **Название PR:** `TASK-XX: Краткое описание`

### PR Template (`.github/PULL_REQUEST_TEMPLATE.md`)

```markdown
## Описание
<!-- Что сделано и почему -->

## Связанные задачи
- TASK-XX

## Тип изменения
- [ ] Фича
- [ ] Багфикс
- [ ] Рефакторинг
- [ ] Оптимизация

## Как тестировать
<!-- Шаги для проверки -->

## Code Review Checklist

### Общее
- [ ] Код компилируется без ошибок (`npx nuxi typecheck`)
- [ ] ESLint без ошибок
- [ ] Нет дублирования — вынесено в store/composable/util
- [ ] Компоненты чистые и переиспользуемые

### SSR / SEO
- [ ] Публичные страницы используют SSR или ISR
- [ ] `useHead` / `useSeoMeta` установлены на страницах
- [ ] Open Graph теги для карточек товаров
- [ ] Нет приватных данных в серверном рендере

### Производительность
- [ ] Изображения через `<NuxtImg>` с lazy loading
- [ ] Тяжёлые компоненты через `<Lazy*>`
- [ ] `useAsyncData` / `useFetch` с правильным ключом кэша
- [ ] Нет лишних fetch-запросов при навигации

### Безопасность
- [ ] Серверные API проверяют авторизацию
- [ ] Роли проверяются серверно (не только на клиенте)
- [ ] Валидация входных данных на сервере (zod, `readValidatedBody`/`readValidatedQuery`)
- [ ] Zod-схемы лежат в `shared/schemas/` и переиспользуются клиентом (`UForm :schema`)
- [ ] Нет секретов в клиентском коде
- [ ] Prisma-запросы не утечивают приватные данные

### Типизация
- [ ] TypeScript strict — нет `any`
- [ ] Типы для API-ответов определены
- [ ] Pinia stores типизированы (state + getters + actions)
- [ ] Prisma-типы используются для API-ответов

### Pinia
- [ ] Store используется для межстраничного состояния
- [ ] Composable — для логики привязанной к контексту
- [ ] SSR-safe: нет side-effects при определении store

### UX
- [ ] Есть skeleton/spinner при загрузке (USkeleton, USpinner)
- [ ] Обработка ошибок (пустые состояния, ошибки сервера)
- [ ] Адаптивность (mobile-first)
```

### Правила для ревьювера

- Оставлять **минимум 2 комментария** к каждому PR (1 вопрос + 1 предложение)
- Использовать labels: `needs-discussion`, `approved`, `changes-requested`
- Автор PR объясняет контекст в описании

---

## Роли и чередование

Для того чтобы оба разработчика освоили все аспекты:

| Период | Dev 1 | Dev 2 |
|--------|-------|-------|
| Спринт 1–2 | Вся реализация: фронтенд (UI, layouts, страницы, Pinia, дизайн-система, SEO) + бэкенд (Prisma, миграции, Auth, Server API, seed, CI) | Code review всех PR (min 1 approval), работа с `/api-docs`, smoke-тесты флоу |
| Спринт 3–4 | Вся реализация: бэкенд (API корзины/заказов, Prisma транзакции, оптимизация) + фронтенд (корзина Pinia, кабинет продавца) | Code review PR, тестирование флоу покупки и кабинета |
| Спринт 5 | CI/CD, тесты, деплой, polish, документация | Code review финальных PR, итоговое демо-тестирование |

> **Решение 2026-09:** задачи бэкенда (ранее — Dev 2) переданы Dev 1 — команда работает как «1 исполнитель + ревьюер»; Dev 2 утверждает изменения через ревью PR.

---

## Контрольные точки (Sprint Review)

| Неделя | Демо | Метрика |
|--------|------|---------|
| 2 | Авторизация, навигация, защита роутов, Prisma, дизайн-система | Login/Register/Logout, middleware, миграции Applied, DESIGN-SYSTEM.md согласован |
| 3 | Каталог + SEO + Pinia store | Lighthouse SEO > 90, мета-теги, store реагирует |
| 4 | Полный флоу покупки + кабинет продавца | Заказ создаётся через Prisma транзакцию, продавец видит статистику |
| 5 | Оптимизация производительности | Lighthouse Performance > 90, FCP < 1.5s |
| 6 | CI/CD, деплой, финальное демо | Staging и Production на Vercel работают, CI зелёный, все флоу протестированы |

---

## Полезные ссылки для команды

### Внутренние инструкции
- [GIT-WORKFLOW.md](./GIT-WORKFLOW.md) — правила совместной работы, ветвление, PR
- [CI-CD.md](./CI-CD.md) — Docker, GitHub Actions, деплой staging/production
- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) — единый стиль: цвета, типографика, компоненты Nuxt UI
- [DEV-WORKFLOW.md](./DEV-WORKFLOW.md) — процесс разработки фич через скиллы (JTBD → UX → дизайн)

### Внешняя документация
- [Nuxt 4 Docs](https://nuxt.com/docs)
- [Nuxt 4 Getting Started](https://nuxt.com/docs/getting-started/introduction)
- [Nuxt UI v4](https://ui.nuxt.com/)
- [Nuxt SEO](https://nuxt.com/modules/seo)
- [Pinia + Nuxt](https://pinia.vuejs.org/ssr/nuxt.html)
- [Prisma + Nuxt Guide](https://www.prisma.io/docs/guides/frameworks/nuxt)
- [Prisma Docs](https://www.prisma.io/docs)
- [@sidebase/nuxt-auth](https://sidebase.io/nuxt-auth)
- [Nuxt Image](https://image.nuxt.com/)
- [Vercel Nuxt Guide](https://vercel.com/docs/frameworks/nuxtjs)
- [Scalar Nuxt-интеграция](https://github.com/scalar/scalar/tree/main/integrations/nuxt) — используется (задача #10) ✅
- [openapi добавление meta в Nitro docs](https://nitro.build/config#openapi) — генерация `/_openapi.json`
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
