import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const url = process.env.DATABASE_URL ?? `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@localhost:${process.env.PG_PORT}/${process.env.PG_DB}`;
const adapter = new PrismaPg({
  connectionString: url,
  ssl: { rejectUnauthorized: false }
});

export const prisma = new PrismaClient({ adapter });
