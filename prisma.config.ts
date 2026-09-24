import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const url = process.env.DATABASE_URL ?? `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@localhost:${process.env.PG_PORT}/${process.env.PG_DB}`;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url,
  },
});
