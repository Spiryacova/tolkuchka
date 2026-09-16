<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Заказы</h1>
      <p v-if="data" class="mt-1 text-sm text-muted">Заказы на ваши товары</p>
    </div>

    <UTabs v-model="tab" :items="tabs" class="mb-4" />

    <template v-if="error">
      <UAlert
        color="error"
        variant="subtle"
        :title="apiErrorMessage(error)"
        description="Повторите попытку или обновите страницу"
      >
        <template #actions>
          <UButton color="error" variant="solid" icon="i-heroicons-arrow-path" @click="() => refresh()">
            Попробовать снова
          </UButton>
        </template>
      </UAlert>
    </template>

    <template v-else-if="data && data.total > 0">
      <UCard :ui="{ body: 'p-0' }">
        <UTable :data="data.items" :columns="columns" :loading="pending">
          <template #loading>
            <USkeleton class="h-10 w-full" />
          </template>
          <template #id-cell="{ row }">
            <ULink :to="`/seller/orders/${row.original.id}`" class="font-medium text-primary">
              #{{ row.original.id.slice(-6) }}
            </ULink>
          </template>
          <template #buyerName-cell="{ row }">
            {{ row.original.buyerName ?? 'Без имени' }}
          </template>
          <template #itemCount-cell="{ row }">
            {{ row.original.itemCount }} поз. · {{ row.original.totalQuantity }} шт.
          </template>
          <template #sellerTotal-cell="{ row }">
            <span class="font-medium">{{ formatPrice(row.original.sellerTotal) }}</span>
          </template>
          <template #status-cell="{ row }">
            <UBadge :color="orderStatusColor(row.original.status)" variant="subtle">
              {{ orderStatusLabel(row.original.status) }}
            </UBadge>
          </template>
          <template #createdAt-cell="{ row }">
            <span class="whitespace-nowrap text-sm text-muted">{{ formatDate(row.original.createdAt) }}</span>
          </template>
        </UTable>
      </UCard>

      <div v-if="data.total > perPage" class="mt-6 flex justify-center">
        <UPagination
          v-model:page="page"
          :items-per-page="perPage"
          :total="data.total"
          :sibling-count="2"
          :show-edges="true"
        />
      </div>
    </template>

    <template v-else>
      <UCard>
        <UEmpty
          :icon="tab === 'ALL' ? 'i-heroicons-receipt-percent' : 'i-heroicons-inbox'"
          :title="tab === 'ALL' ? 'Заказов пока нет' : 'В этой категории нет заказов'"
          :description="tab === 'ALL' ? 'Когда покупатели оформят заказы на ваши товары, они появятся здесь.' : 'Попробуйте выбрать другой статус.'"
        />
      </UCard>
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { OrderStatus, SellerOrderListResponse, SellerOrderSummary } from '#shared/schemas/order.schema';
  import type { ColumnDef } from '@tanstack/vue-table';
  import { ORDER_STATUSES } from '#shared/schemas/order.schema';

  definePageMeta({
    layout: 'dashboard',
    middleware: ['seller'],
    robots: false,
  });

  const requestFetch = useRequestFetch();
  const perPage = 10;
  const tab = ref<'ALL' | OrderStatus>('ALL');
  const page = ref(1);

  const emptyResponse: SellerOrderListResponse = {
    items: [],
    page: 1,
    perPage,
    total: 0,
    statusCounts: { PENDING: 0, CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 },
  };

  const { data, error, pending, refresh } = await useAsyncData(
    'seller-orders',
    () =>
      requestFetch<SellerOrderListResponse>('/api/sellers/orders', {
        query: {
          page: page.value,
          perPage,
          ...(tab.value !== 'ALL' ? { status: tab.value } : {}),
        },
      }),
    { watch: [tab, page], default: () => emptyResponse },
  );

  watch(tab, () => {
    page.value = 1;
  });

  const tabs = computed(() => {
    const counts = data.value?.statusCounts ?? emptyResponse.statusCounts;
    const all = ORDER_STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
    return [
      { label: `Все (${all})`, value: 'ALL' },
      ...ORDER_STATUSES.map((s) => ({
        label: `${orderStatusLabel(s)} (${counts[s] ?? 0})`,
        value: s,
      })),
    ];
  });

  const columns: ColumnDef<SellerOrderSummary>[] = [
    { accessorKey: 'id', header: 'Заказ' },
    { accessorKey: 'buyerName', header: 'Покупатель' },
    { accessorKey: 'itemCount', header: 'Позиции · шт' },
    { accessorKey: 'sellerTotal', header: 'Сумма' },
    { accessorKey: 'status', header: 'Статус' },
    { accessorKey: 'createdAt', header: 'Дата' },
  ];
</script>