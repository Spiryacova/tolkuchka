<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Заказы</h1>
      <p v-if="data" class="mt-1 text-sm text-muted">Заказы на ваши товары</p>
    </div>

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <UInput
        v-model="searchText"
        icon="i-heroicons-magnifying-glass"
        placeholder="Поиск: номер, имя, email"
        class="w-full sm:w-72"
        size="sm"
      />
      <USelect v-model="perPage" :items="perPageOptions" size="sm" class="w-28" />
    </div>
    <p class="mb-4 text-xs text-muted">
      Цифры — точный номер без нулей слева: 9 = заказ …-0009 · 1009 = покупатель #001009. Текст — имя или email.
    </p>

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

    <template v-else-if="data && q && data.total === 0">
      <UCard>
        <UEmpty
          icon="i-heroicons-magnifying-glass"
          title="Ничего не найдено"
          :description="`По запросу «${q}» заказов нет`"
        >
          <template #actions>
            <UButton
              icon="i-heroicons-x-mark"
              color="neutral"
              variant="soft"
              @click="q = ''; searchText = ''"
            >
              Сбросить поиск
            </UButton>
          </template>
        </UEmpty>
      </UCard>
    </template>

    <template v-else-if="data && data.total > 0">
      <UCard :ui="{ body: 'p-0' }">
        <UTable
          v-model:sorting="sorting"
          :data="data.items"
          :columns="columns"
          :loading="pending"
        >
          <template #loading>
            <USkeleton class="h-10 w-full" />
          </template>
          <template #id-cell="{ row }">
            <ULink :to="`/seller/orders/${row.original.id}`" class="font-medium text-primary">
              {{ formatOrderNumber(row.original.buyerNo, row.original.no) }}
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
            <div class="flex items-center gap-2">
              <UBadge :color="orderStatusColor(row.original.status)" variant="subtle">
                {{ orderStatusLabel(row.original.status) }}
              </UBadge>
              <UBadge
                v-if="row.original.hasCancelledItems && row.original.status !== 'CANCELLED'"
                color="warning"
                variant="subtle"
              >
                Частичная отмена
              </UBadge>
            </div>
          </template>
          <template #createdAt-cell="{ row }">
            <span class="whitespace-nowrap text-sm text-muted">{{ formatDate(row.original.createdAt) }}</span>
          </template>

          <template #buyerName-header="{ column }">
            <button class="inline-flex items-center gap-1.5" @click="column.getToggleSortingHandler()?.($event)">
              Покупатель
              <UIcon
                :name="column.getIsSorted() === 'asc' ? 'i-heroicons-chevron-up' : column.getIsSorted() === 'desc' ? 'i-heroicons-chevron-down' : 'i-heroicons-arrows-up-down'"
                class="size-3.5 text-muted"
              />
            </button>
          </template>
          <template #itemCount-header="{ column }">
            <button class="inline-flex items-center gap-1.5" @click="column.getToggleSortingHandler()?.($event)">
              Позиции · шт
              <UIcon
                :name="column.getIsSorted() === 'asc' ? 'i-heroicons-chevron-up' : column.getIsSorted() === 'desc' ? 'i-heroicons-chevron-down' : 'i-heroicons-arrows-up-down'"
                class="size-3.5 text-muted"
              />
            </button>
          </template>
          <template #sellerTotal-header="{ column }">
            <button class="inline-flex items-center gap-1.5" @click="column.getToggleSortingHandler()?.($event)">
              Сумма
              <UIcon
                :name="column.getIsSorted() === 'asc' ? 'i-heroicons-chevron-up' : column.getIsSorted() === 'desc' ? 'i-heroicons-chevron-down' : 'i-heroicons-arrows-up-down'"
                class="size-3.5 text-muted"
              />
            </button>
          </template>
          <template #status-header="{ column }">
            <button class="inline-flex items-center gap-1.5" @click="column.getToggleSortingHandler()?.($event)">
              Статус
              <UIcon
                :name="column.getIsSorted() === 'asc' ? 'i-heroicons-chevron-up' : column.getIsSorted() === 'desc' ? 'i-heroicons-chevron-down' : 'i-heroicons-arrows-up-down'"
                class="size-3.5 text-muted"
              />
            </button>
          </template>
          <template #createdAt-header="{ column }">
            <button class="inline-flex items-center gap-1.5" @click="column.getToggleSortingHandler()?.($event)">
              Дата
              <UIcon
                :name="column.getIsSorted() === 'asc' ? 'i-heroicons-chevron-up' : column.getIsSorted() === 'desc' ? 'i-heroicons-chevron-down' : 'i-heroicons-arrows-up-down'"
                class="size-3.5 text-muted"
              />
            </button>
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
  import type { ColumnDef, SortingState } from '@tanstack/vue-table';
  import { ORDER_STATUSES } from '#shared/schemas/order.schema';

  definePageMeta({
    layout: 'dashboard',
    middleware: ['seller'],
    robots: false,
  });

  const requestFetch = useRequestFetch();
  const perPage = ref(10);
  const q = ref('');
  const searchText = ref('');
  const sorting = ref<SortingState>([{ id: 'createdAt', desc: true }]);
  const sortBy = computed(() => sorting.value[0]?.id ?? 'createdAt');
  const sortDir = computed(() => (sorting.value[0]?.desc ? 'desc' : 'asc'));
  const tab = ref<'ALL' | OrderStatus>('ALL');
  const page = ref(1);

  const emptyResponse: SellerOrderListResponse = {
    items: [],
    page: 1,
    perPage: perPage.value,
    total: 0,
    statusCounts: { PENDING: 0, CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 },
  };

  const { data, error, pending, refresh } = await useAsyncData(
    'seller-orders',
    () =>
      requestFetch<SellerOrderListResponse>('/api/sellers/orders', {
        query: {
          page: page.value,
          q: q.value,
          sortBy: sortBy.value,
          sortDir: sortDir.value,
          perPage: perPage.value,
          ...(tab.value !== 'ALL' ? { status: tab.value } : {}),
        },
      }),
    { watch: [tab, page, q, sortBy, sortDir, perPage], default: () => emptyResponse },
  );

  watch([tab, q, sortBy, sortDir, perPage], () => {
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
    { accessorKey: 'sellerTotal', header: 'Сумма', meta: { class: { th: 'text-right', td: 'text-right' } } },
    { accessorKey: 'status', header: 'Статус' },
    { accessorKey: 'createdAt', header: 'Дата' },
  ];

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  watch(searchText, (v) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { q.value = v.trim(); }, 350);
  });

  const perPageOptions = [10, 25, 50].map((n) => ({ label: `${n}`, value: n }));
</script>
