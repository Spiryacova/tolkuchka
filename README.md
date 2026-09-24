# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Docker

Нужно создать .env файл в корне проекта (либо открыть имеющийся) и заполнить следующие переменные:

Порты для postgres и pgAdmin (pgAdmin по идее дополнительно ставить не надо, он в докер сам скачается-подтянется), доступ к pgAdmin через браузер будет через указанный вами PG_ADMIN_PORT

- PG_PORT
- PG_ADMIN_PORT

Пользователь, пароль и база для postgres

- PG_USER
- PG_PASSWORD
- PG_DB

Логин и пароль для входа в pgAdmin

- PG_ADMIN_LOGIN
- PG_ADMIN_PASSWORD

Чтобы поднять контейнер: `docker compose up -d` (-d даст в этом же терминале вводить новые команды)

Выключить контейнер: `docker compose down`, либо для полного очищения volume'ов (сохраненных между запусками контейнеров данных) `docker compose down -v`
