import * as z from 'zod';

export const categorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});

export type Category = z.output<typeof categorySchema>;

export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().int().positive(),
  oldPrice: z.number().int().positive().optional(),
  // Мелкое фото для карточек каталога
  imageUrl: z.string().nullable().optional(),
  // Крупные фото для галереи карточки товара (первое = главное)
  images: z.array(z.string()).optional(),
  stock: z.number().int().min(0).default(0).optional(),
  rating: z.number().min(0).max(5).optional(),
  category: categorySchema,
  seller: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    })
    .optional(),
});

export type Product = z.output<typeof productSchema>;
