import * as z from 'zod';
import { productSchema } from './product.schema';

export const catalogQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  categoryId: z.string().min(1).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['relevance', 'priceAsc', 'priceDesc', 'rating']).default('relevance'),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(24).default(12),
});

export type CatalogQuery = z.output<typeof catalogQuerySchema>;

export const catalogResponseSchema = z.object({
  products: z.array(productSchema),
  total: z.number().int(),
  page: z.number().int(),
  perPage: z.number().int(),
});

export type CatalogResponse = z.output<typeof catalogResponseSchema>;