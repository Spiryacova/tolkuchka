import { defineStore } from 'pinia';
import type { OrderStatus } from '#shared/schemas/order.schema';
import type { SellerStats } from '#shared/schemas/seller.schema';

export const useSellerStore = defineStore('seller', {
  state: () => ({
    stats: null as SellerStats | null,
  }),

  getters: {
    // средний чек = выручка / количество заказов
    avgOrder(): number {
      const c = this.stats?.ordersCount ?? 0;
      const r = this.stats?.revenue ?? 0;
      return c > 0 ? r / c : 0;
    },
    // доля заказов по статусам
    statusShare(): (status: OrderStatus) => number {
      return (status) => {
        const total = this.stats?.ordersCount ?? 0;
        if (total === 0) return 0;
        return Math.round(((this.stats?.statusCounts[status] ?? 0) / total) * 100);
      };
    },
  },

  actions: {
    setStats(stats: SellerStats) {
      this.stats = stats;
    },
  },
});
