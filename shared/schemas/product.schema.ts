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

const productImageSchema = z.string().trim().min(1, 'Пустая ссылка на изображение');

export const MAX_PRODUCT_IMAGES = 15;

const productFieldsSchema = z.object({
  name: z.string().trim().min(3, 'Название — минимум 3 символа').max(120, 'Слишком длинное название'),
  categoryId: z.string().min(1, 'Выберите категорию'),
  description: z.string().trim().max(2000, 'Слишком длинное описание').optional(),
  price: z.number({ error: 'Укажите цену' }).int('Цена — целое число рублей').positive('Цена должна быть больше 0'),
  oldPrice: z.number({ error: 'Укажите старую цену' }).int('Старая цена — целое число рублей').positive('Старая цена должна быть больше 0').nullable().optional(),
  stock: z.number({ error: 'Укажите остаток' }).int('Остаток — целое число').min(0, 'Остаток не может быть отрицательным'),
  images: z.array(productImageSchema).max(MAX_PRODUCT_IMAGES, `Не больше ${MAX_PRODUCT_IMAGES} изображений`),
  isActive: z.boolean(),
});

export const productCreateSchema = productFieldsSchema.extend({
  stock: productFieldsSchema.shape.stock.default(0),
  images: productFieldsSchema.shape.images.default([]),
  isActive: productFieldsSchema.shape.isActive.default(true),
});

export type ProductCreate = z.output<typeof productCreateSchema>;

export const productUpdateSchema = productFieldsSchema.partial();

export type ProductUpdate = z.output<typeof productUpdateSchema>;

export const SELLER_PRODUCT_FILTERS = ['all', 'active', 'hidden'] as const;

export const sellerProductsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  status: z.enum(SELLER_PRODUCT_FILTERS).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
});

export type SellerProductsQuery = z.output<typeof sellerProductsQuerySchema>;

export type SellerProductFilter = (typeof SELLER_PRODUCT_FILTERS)[number];

export const sellerProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  categoryName: z.string(),
  price: z.number().nonnegative(),
  stock: z.number().int().min(0),
  isActive: z.boolean(),
  hasOrders: z.boolean(),
  updatedAt: z.string(),
});

export type SellerProduct = z.output<typeof sellerProductSchema>;

export const sellerProductDetailSchema = sellerProductSchema.extend({
  description: z.string(),
  oldPrice: z.number().nonnegative().nullable(),
  categoryId: z.string(),
  images: z.array(z.string()),
});

export type SellerProductDetail = z.output<typeof sellerProductDetailSchema>;

export const sellerProductListResponseSchema = z.object({
  items: z.array(sellerProductSchema),
  page: z.number().int(),
  perPage: z.number().int(),
  total: z.number().int().nonnegative(),
  counts: z.object({
    all: z.number().int().nonnegative(),
    active: z.number().int().nonnegative(),
    hidden: z.number().int().nonnegative(),
  }),
  totalProducts: z.number().int().nonnegative(),
});

export type SellerProductListResponse = z.output<typeof sellerProductListResponseSchema>;
