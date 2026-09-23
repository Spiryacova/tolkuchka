import type { SellerProduct, SellerProductDetail } from '#shared/schemas/product.schema';

interface SellerProductRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: { toNumber(): number } | number;
  oldPrice: { toNumber(): number } | number | null;
  images: string[];
  stock: number;
  isActive: boolean;
  updatedAt: Date;
  categoryId: string;
  category: { name: string };
  _count: { orderItems: number };
}

function toNumber(value: { toNumber(): number } | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

export function toSellerProduct(row: SellerProductRow): SellerProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    image: row.images[0] ?? null,
    categoryName: row.category.name,
    price: toNumber(row.price),
    stock: row.stock,
    isActive: row.isActive,
    hasOrders: row._count.orderItems > 0,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toSellerProductDetail(row: SellerProductRow): SellerProductDetail {
  return {
    ...toSellerProduct(row),
    description: row.description ?? '',
    oldPrice: row.oldPrice === null ? null : toNumber(row.oldPrice),
    categoryId: row.categoryId,
    images: row.images,
  };
}

export const sellerProductInclude = {
  category: { select: { name: true } },
  _count: { select: { orderItems: true } },
} as const;
