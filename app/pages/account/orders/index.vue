<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Мои заказы</h1>
      <p v-if="data" class="mt-1 text-sm text-muted">История ваших покупок на Толкучке</p>
    </div>

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

    <template v-else-if="data && data.total === 0">
      <UCard>
        <UEmpty
          icon="i-heroicons-shopping-bag"
          title="Заказов пока нет"
          description="Оформите первый заказ — и он появится в этой истории."
        >
          <template #actions>
            <UButton color="primary" variant="soft" icon="i-heroicons-shopping-cart" to="/products">
              Перейти в каталог
            </UButton>
          </template>
        </UEmpty>
      </UCard>
    </template>

    <template v-else-if="data && data.total > 0">
      <UCard :ui="{ body: 'p-0' }">
        <UTable
          :data="data.items"
          :columns="columns"
          :loading="pending"
          :on-select="onRowSelect"
        >
          <template #loading>
            <USkeleton class="h-10 w-full" />
          </template>
          <template #id-cell="{ row }">
            <div class="flex flex-col">
              <ULink :to="`/account/orders/${row.original.id}`" class="font-medium text-primary">
                {{ formatOrderNumber(row.original.buyerNo, row.original.no) }}
              </ULink>
              <span class="truncate text-xs text-muted">
                {{ row.original.sellerName ?? 'Продавец' }}
              </span>
            </div>
          </template>
          <template #itemCount-cell="{ row }">
            {{ row.original.itemCount }} поз. · {{ row.original.totalQuantity }} шт.
          </template>
          <template #total-cell="{ row }">
            <span class="font-medium">{{ formatPrice(row.original.total) }}</span>
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
  </div>
</template>

<script setup lang="ts">
  import type { ColumnDef } from '@tanstack/vue-table';
  import type { BuyerOrderListResponse, BuyerOrderSummary } from '#shared/schemas/order.schema';

  definePageMeta({
    middleware: ['sidebase-auth'],
    robots: false,
  });

  const requestFetch = useRequestFetch();
  const perPage = 10;
  const page = ref(1);

  const emptyResponse: BuyerOrderListResponse = {
    items: [],
    page: 1,
    perPage,
    total: 0,
  };

  const { data, error, pending, refresh } = await useAsyncData(
    'account-orders',
    () =>
      requestFetch<BuyerOrderListResponse>('/api/orders', {
        query: { page: page.value, perPage },
      }),
    { watch: [page], default: () => emptyResponse },
  );

  const columns: ColumnDef<BuyerOrderSummary>[] = [
    { accessorKey: 'id', header: 'Заказ' },
    { accessorKey: 'itemCount', header: 'Товары' },
    { accessorKey: 'total', header: 'Сумма' },
    { accessorKey: 'status', header: 'Статус' },
    { accessorKey: 'createdAt', header: 'Дата' },
  ];

  function onRowSelect(_event: Event, row: { original: BuyerOrderSummary }) {
    navigateTo(`/account/orders/${row.original.id}`);
  }
</script>