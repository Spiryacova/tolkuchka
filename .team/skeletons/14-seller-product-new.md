# 14. Новый товар (`/seller/products/new`)

Статус: 🔍 согласован

Уровень: **средний** (JTBD кратко)

## Job (JTBD)

- «Когда я хочу разместить товар, я хочу заполнить минимум полей и сразу увидеть его в каталоге, чтобы не возиться с формами»

## Блоки интерфейса

1. **Заголовок** «Новый товар» (средний)
2. **UForm** (`max-w-lg`): название (`UInput`), категория (`USelect` из `/api/categories`, обязательна), описание (`UTextarea`), цена (`UInputNumber`, целые рубли), остаток (`UInputNumber`, мин 0), изображения (MVP: URL-поле `UInput` + `NuxtImg`-preview, до 15 ссылок, первое = главное; загрузка файлов — бэклог), активен сразу (`USwitch`, по умолчанию вкл) (высокий)
3. **CTA «Сохранить»** (`UButton` primary, `loading`) + «Отмена» (ghost) → список (высокий)
4. **Ошибки** — инлайн `UFormGroup`; `useToast` при сбое (средний)

## UX-правила

- Валидация `createProductSchema` (`shared/schemas/product.schema.ts`) на клиенте и сервере
- Цена — положительная, остаток ≥ 0 (min в `UInputNumber` — ошибка невозможна, а не наказуема); slug генерируется серверно из названия
- После сохранения → `/seller/products` + тост «Товар создан»
- Уход с незаполненной/несохранённой формой — предупреждение `beforeunload` (не терять работу продавца); «Отмена» при изменённых полях — confirm

## Компоненты Nuxt UI

- `UForm`, `UFormGroup`, `UInput`, `USelect`, `UTextarea`, `UInputNumber`, `USwitch`, `UButton`, `USpinner`
- `ImageUploader` (кастомный, с загрузкой файлов) — бэклог; в MVP URL-поля на `UInput`

## Затрагиваемые сущности

- ✅ `Product` (create, sellerId из сессии), `Category`

## Технический каркас

- **Layout:** dashboard; **middleware:** `seller`
- **Рендеринг:** SSR; SEO: `robots: noindex`
- **Состояния:** `USpinner` в кнопке; инлайн-ошибки; тост
- **Ссылки:** входящие — `/seller/products`, `/seller/dashboard`; исходящие — `/seller/products`
- **API:** `POST /api/sellers/products` (валидация zod). Загрузка изображений отложена (решение команды 2026-08-21: в MVP URL-поля; `POST /api/upload` + сторедж — бэклог, причина: Vercel serverless read-only FS, не ядро учебных целей)

## Сверка с дизайн-системой

- Соответствует. Форма `max-w-lg`; метки де-эмфазированы; primary CTA