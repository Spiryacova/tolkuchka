import { defineStore } from 'pinia';
import type { Product, Category } from '#shared/schemas/product.schema';
import type { CatalogResponse } from '#shared/schemas/catalog.schema';

export type SortKey = 'relevance' | 'priceAsc' | 'priceDesc' | 'rating';

interface CatalogFilters {
  categoryId: string | null;
  q: string;
  priceMin: number | null;
  priceMax: number | null;
}

export const useProductStore = defineStore('product', {
  state: () => ({
    items: [] as Product[],
    categories: [] as Category[],
    total: 0,
    filters: {
      categoryId: null,
      q: '',
      priceMin: null,
      priceMax: null,
    } as CatalogFilters,
    sort: 'relevance' as SortKey,
    page: 1,
    perPage: 12,
    categoriesLoaded: false,
  }),

  getters: {
    queryKey(): string {
      return [
        this.filters.q,
        this.filters.categoryId ?? '',
        this.filters.priceMin ?? '',
        this.filters.priceMax ?? '',
        this.sort,
        this.page,
        this.perPage,
      ].join('|');
    },
  },

  actions: {
    async fetchCategories() {
      if (this.categoriesLoaded) return;
      this.categories = await $fetch<Category[]>('/api/categories');
      this.categoriesLoaded = true;
    },
    async fetchProducts(): Promise<Product[]> {
      const { q, categoryId, priceMin, priceMax } = this.filters;
      const data = await $fetch<CatalogResponse>('/api/products', {
        query: {
          q: q || undefined,
          categoryId: categoryId ?? undefined,
          priceMin: priceMin ?? undefined,
          priceMax: priceMax ?? undefined,
          sort: this.sort,
          page: this.page,
          perPage: this.perPage,
        },
      });
      this.items = data.products;
      this.total = data.total;
      return data.products;
    },
    setCategory(categoryId: string | null) {
      this.filters.categoryId = categoryId;
      this.page = 1;
    },
    setQuery(q: string) {
      this.filters.q = q;
      this.page = 1;
    },
    setPriceRange(min: number | null, max: number | null) {
      this.filters.priceMin = min;
      this.filters.priceMax = max;
      this.page = 1;
    },
    setSort(sort: SortKey) {
      this.sort = sort;
      this.page = 1;
    },
    setPage(page: number) {
      this.page = page;
    },
    resetFilters() {
      this.filters = { categoryId: null, q: '', priceMin: null, priceMax: null };
      this.sort = 'relevance';
      this.page = 1;
    },
    applyCategory(categoryId: string) {
      this.resetFilters();
      this.filters.categoryId = categoryId;
    },
  },
});
