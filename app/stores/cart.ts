import { defineStore } from 'pinia';
import type { CartItem, CartResponse } from '#shared/schemas/cart.schema';

// Единственный источник данных — server/api/cart/* (#29). SSR-гард: корзина живёт на клиенте.
let inflight: Promise<void> | null = null;

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    isLoading: false,
  }),

  getters: {
    count(): number {
      return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    subtotal(): number {
      return this.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    },
  },

  actions: {
    async refresh() {
      if (!import.meta.client) return;
      if (inflight) return inflight;
      this.isLoading = true;
      inflight = (async () => {
        try {
          const cart = await $fetch<CartResponse>('/api/cart');
          this.items = cart.items;
        } catch {
          // 401 для гостя — корзина пуста (гостевая ветка появится в Фазе B)
          this.items = [];
        } finally {
          this.isLoading = false;
          inflight = null;
        }
      })();
      return inflight;
    },
    async load() {
      await this.refresh();
    },
    async addToCart(productId: string, qty: number) {
      const item = await $fetch<CartItem>('/api/cart', {
        method: 'POST',
        body: { productId, quantity: qty },
      });
      const index = this.items.findIndex((i) => i.id === item.id);
      if (index !== -1) this.items[index] = item;
      else this.items.push(item);
    },
    async updateQty(id: string, qty: number) {
      const item = await $fetch<CartItem>(`/api/cart/${id}`, {
        method: 'PATCH',
        body: { quantity: qty },
      });
      const index = this.items.findIndex((i) => i.id === item.id);
      if (index !== -1) this.items[index] = item;
    },
    async remove(id: string) {
      await $fetch(`/api/cart/${id}`, { method: 'DELETE' });
      const index = this.items.findIndex((i) => i.id === id);
      if (index !== -1) this.items.splice(index, 1);
    },
  },
});