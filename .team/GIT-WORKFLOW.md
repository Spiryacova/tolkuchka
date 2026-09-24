# GIT-WORKFLOW.md — Правила совместной работы в репозитории

Инструкция для команды из 2 разработчиков. Описывает модель ветвления, процесс разработки, Code Review и настройку GitHub.

---

## 1. Модель репозитория

Работаем в **одном общем репозитории** на GitHub (не через fork). Оба разработчика — Collaborators с полным доступом.

### Создание репозитория (Dev 1 — владелец)

```bash
mkdir tolkuchka && cd tolkuchka
git init
git add . && git commit -m "init"
# создать пустой репозиторий на GitHub → скопировать URL
git remote add origin git@github.com:USERNAME/tolkuchka.git
git push -u origin main
```

Затем: **GitHub → Settings → Collaborators** → добавить Dev 2 по username или email.

### Подключение второго разработчика (Dev 2)

```bash
git clone git@github.com:USERNAME/tolkuchka.git
cd tolkuchka
git checkout -b develop origin/main   # первая ветка develop
git push -u origin develop
```

---

## 2. Модель ветвления

```
main ────────────────────  релизы, автодеплой на PRODUCTION
  └── develop ────────────  интеграция фич, автодеплой на STAGING
       ├── feature/auth
       ├── feature/catalog
       ├── feature/cart
       └── feature/orders
```

### Правила по веткам

| Ветка | Назначение | Деплой | Прямой push |
|-------|-----------|--------|-------------|
| `main` | Релизные версии, стабильный код | Production | Запрещён (protected) |
| `develop` | Интеграция всех фич | Staging | Запрещён (protected) |
| `feature/*` | Отдельная задача | Preview (Vercel) | Разрешён |

### Именование веток

```
feature/task-XX-short-name     → feature/cart-api
feature/add-product-form
fix/cart-quantity-bug          → багфиксы
refactor/cart-store            → рефакторинг
```

---

## 3. Стандартный цикл разработки

Оба разработчика работают одинаково:

```bash
# 1. Актуализировать develop (обязательно перед новой веткой!)
git checkout develop
git pull

# 2. Создать feature-ветку
git checkout -b feature/cart

# 3. Писать код, коммитить (осмысленные сообщения)
git add .
git commit -m "feat: add cart store with add/remove actions"
git commit -m "fix: reset quantity on product remove"

# 4. Запушить свою ветку
git push -u origin feature/cart

# 5. Открыть Pull Request в GitHub (base: develop)
```

---

## 4. Pull Request

### Создание PR

- **base:** `develop`, **compare:** `feature/...`
- Название: `TASK-XX: Краткое описание`
- В описании указать: что сделано, как тестировать, связанные задачи

### Правила для обоих

1. Все изменения — только через PR в `develop`
2. PR требует **1 approval** (второй разработчик ревьюит)
3. Запрет прямого мержа в `main` и `develop`
4. Мерж в `main` — только через PR `develop → main` в конце спринта/релиза

### Решение конфликтов

Если PR показывает конфликт:

```bash
git checkout develop
git pull
git checkout feature/cart
git merge develop    # или git rebase develop
# разрешить конфликты вручную, закоммитить
git push
```

---

## 5. Настройка protected branches (GitHub UI)

Прописывает Dev 1 (владелец репозитория), один раз.

1. **GitHub → Settings → Branches → Add branch ruleset**
2. **Для `main`:**
   - Require a pull request before merging — **включить**
   - Require approvals: **1**
   - Require status checks: отметить `CI / lint-typecheck` (после создания workflow в Sprint 1)
   - Block force pushes — включить
3. **Для `develop`:** те же правила (PR + 1 approval + CI)
4. **Для `feature/*`:** правила не нужны

---

## 6. Чеклист коммита

- [ ] Сообщение осмысленное: `feat/fix/refactor/docs: краткое описание`
- [ ] Не коммитим `.env`, секреты, node_modules, .nuxt/, dist/
- [ ] Перед коммитом прогнать `npm run lint` и `npm run typecheck`

### .gitignore (обязательно с первого коммита)

```
node_modules/
.nuxt/
.output/
.env
.env.*
!.env.example
dist/
```

---

## 7. График синхронизации

| Когда | Действие |
|-------|----------|
| Перед каждой новой веткой | `git pull` из `develop` |
| Утром / после крупного мержа коллеги | `git pull` из `develop` |
| Перед релизом | Проверить, что все feature PR смержены |
| После мержа `develop → main` | Обновить локальный `main` и `develop` |

---

## 8. Чеклист Code Review (для ревьюера)

- [ ] Проверил поведение в preview-деплое Vercel (URL в PR)
- [ ] CI зелёный (lint, typecheck, тесты)
- [ ] Нет дублирования — вынесено в store/composable/util
- [ ] Нет `any`, типы определены
- [ ] SSR/SEO: публичные страницы с SSR/ISR, `useHead`/`useSeoMeta` на месте
- [ ] Производительность: `NuxtImg` lazy, `<Lazy*>` для тяжёлых компонентов
- [ ] Безопасность: API проверяет авторизацию, роли на сервере, нет секретов
- [ ] Оставил минимум 2 комментария (1 вопрос + 1 предложение)

Полный чеклист — в `TOLKUCHKA-PLAN.md` → секция "Процесс Code Review".
