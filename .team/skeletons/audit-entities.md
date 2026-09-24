# Аудит сущностей (Entity Audit)

Сводная проверка: какие сущности нужны каждой странице и есть ли они в Prisma-схеме (`TOLKUCHKA-PLAN.md §Схема базы данных`).

**Цель:** до написания кода убедиться, что модель данных покрывает все блоки всех страниц, а взаимодействия (relations) корректны.

---

## 1. Матрица «страница × сущность»

| Страница | User | Category | Product | CartItem | Order | OrderItem | shippingAddress | Review |
|----------|:----:|:--------:|:-------:|:--------:|:-----:|:--------:|:---------------:|:------:|
| `/` (главная) | ✅ | ✅ | ✅ | — | — | — | — | —
| `/products` | — | ✅ | ✅ | — | — | — | — | — |
| `/products/[slug]` | ✅ (продавец) | ✅ | ✅ | ✅ (в корзину) | — | — | — | ⬜ (бэклог) |
| `/categories/[slug]` | — | ✅ | ✅ | — | — | — | — | — |
| `/sellers/[slug]` | ✅ (продавец) | — | ✅ | — | — | — | — | ⬜ (бэклог) |
| `/auth/login` | ✅ | — | — | — | — | — | — | — |
| `/auth/register` | ✅ (+ role) | — | — | — | — | — | — | — |
| `/cart` | ✅ | — | ✅ | ✅ | — | — | — | — |
| `/checkout` | ✅ | — | ✅ | ✅ | ✅ (создание) | — | ✅ (сбор) | — |
| `/checkout/success` | ✅ | — | — | ✅ (очистка) | ✅ | — | — | — |
| `/seller` (лендинг) | ✅ (роль) | — | — | — | — | — | — | — |
| `/seller/dashboard` | ✅ | — | ✅ | — | — | ✅ | — | — |
| `/seller/products*` | ✅ | ✅ | ✅ | — | — | — | — | — |
| `/seller/orders*` | ✅ | — | ✅ | — | ✅ | ✅ | — | — |
| `/account/settings` | ✅ | — | — | — | — | — | — | — |
| `/account/orders*` | ✅ | — | ✅ | — | ✅ | ✅ | ✅ (просмотр) | — |
| `/about`, `/contact`, `/privacy`, `/terms` | — | — | — | — | — | — | — | — |
| `/[...slug]`, `error.vue` | — | — | — | — | — | — | — | — |

✅ есть в схеме · — не требуется · ⬜ в бэклоге (осознанно отложено)

---

## 2. Статус сущностей

| Сущность | Статус | Комментарий |
|----------|--------|-------------|
| `User` | ✅ есть | + `slug`/`bio` добавлены для `/sellers/[slug]`; `role` для выбора при регистрации |
| `Role` (BUYER/SELLER/ADMIN) | ✅ есть | смена роли — `sellers/become.post.ts` |
| `Category` | ✅ есть | добавлена при проектировании архитектуры; индекс по `slug` для `/categories/[slug]` |
| `Product` | ✅ есть | `categoryId`+`@@index([categoryId])`; `images String[]`; `isActive` для каталога продавца; популярность = агрегат `_count.orderItems`, без нового поля (2026-08-21); путь эволюции — денормализация `salesCount` |
| `CartItem` | ✅ есть | `@@unique([userId, productId])` — одна строка на товар, количество обновляется |
| `Order` | ✅ есть | `total`, `status`, `shippingAddress Json?` |
| `OrderItem` | ✅ есть | `priceAtPurchase` (цена фиксируется при покупке), `sellerId` для заказов продавца |
| `shippingAddress` (jsonb у Order) | ✅ есть | решение по DEV-WORKFLOW §5: «переиспользовать» вместо модели `Address` |
| `Review` / `Rating` | ⬜ бэклог | нужна на `/products/[slug]` и `/sellers/[slug]` — отдельным PR после MVP |
| `WishlistItem` | ⬜ бэклог | нет страниц избранного в MVP |
| `Account` / `Session` / `VerificationToken` | ✅ есть | служебные модели auth-модуля |

---

## 3. Взаимодействия сущностей (relations), проверенные каркасами

| Связь | Тип | Где используется |
|-------|-----|------------------|
| `User.products → Product.seller` | 1:N | каталог продавца, профиль `/sellers/[slug]` |
| `Category.products → Product.category` | 1:N | каталог, категория, фильтр |
| `User.cartItems → CartItem.product` | N:M через CartItem | корзина |
| `User.buyerOrders → Order.items → OrderItem.product` | 1:N → 1:N | история покупок, checkout, success |
| `OrderItem.seller → User` | N:1 | заказы продавца (`sellerId` на OrderItem) |
| `OrderItem.product → Product` | N:1 | детали заказа, цена фиксируется в `priceAtPurchase` |

**Ключевая проверка:** связка «покупатель → Order → OrderItem → продавец» замкнута через `OrderItem.sellerId` — продавец получает заказы своих товаров без джойна через покупателя. Подтверждено каркасами 12, 16, 17, 19, 20.

---

## 4. Новых гэпов не выявлено

Каркасы всех 26 страниц покрыты текущей схемой. Ранее найденные гэпы закрыты на этапе архитектуры:
- `Category` — добавлена (#19)
- `User.slug`/`User.bio` — добавлены (#59)
- Адрес доставки — решён через `shippingAddress` (jsonb) (#32)

При изменении схемы (например, открытие бэклога `Review`) — обновлять этот документ и пер-страничные каркасы в одном PR.