<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Дашборд</h1>
      <p class="mt-1 text-sm text-muted">{{ greeting }}, {{ userName }} · {{ today }}</p>
    </div>

    <template v-if="pending">
      <div class="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <USkeleton v-for="i in 4" :key="i" class="h-32" />
      </div>
    </template>

    <template v-else-if="error">
      <UAlert
        color="error"
        variant="subtle"
        :title="apiErrorMessage(error)"
        description="Повторите попытку или обновите страницу"
      >
        <template #actions>
          <UButton
            color="error"
            variant="solid"
            icon="i-heroicons-arrow-path"
            @click="() => refresh()"
          >
            Попробовать снова
          </UButton>
        </template>
      </UAlert>
    </template>

    <template v-else-if="data.productsCount === 0">
      <UCard>
        <UEmpty
          icon="i-heroicons-shopping-bag"
          title="Добавьте первый товар"
          description="Дашборд покажет статистику, когда появятся товары и заказы"
        >
          <template #actions>
            <UButton icon="i-heroicons-plus" :to="'/seller/products/new'">Добавить товар</UButton>
          </template>
        </UEmpty>
      </UCard>
    </template>

    <template v-else>
      <div class="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <UCard v-for="m in metrics" :key="m.label">
          <p class="text-xs font-medium uppercase tracking-wide text-muted">{{ m.label }}</p>
          <p class="mt-1 text-2xl font-bold">{{ m.value }}</p>
          <p class="mt-1 text-sm text-muted">{{ m.hint }}</p>
        </UCard>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <UCard :ui="{ body: 'p-0' }">
          <template #header>
            <div class="flex items-center justify-between">
              <p class="font-medium">Свежие заказы</p>
              <ULink to="/seller/orders" class="text-sm text-primary">Все заказы</ULink>
            </div>
          </template>

          <div v-if="data.recentOrders.length === 0" class="py-6 text-center">
            <Icon name="i-heroicons-inbox" class="mx-auto h-8 w-8 text-muted" />
            <p class="mt-2 text-sm text-muted">
              Заказов пока нет — они появятся, когда покупатели найдут ваши товары
            </p>
          </div>

          <UTable v-else :data="data.recentOrders" :columns="orderColumns">
            <template #id-cell="{ row }">
              <ULink
                :to="`/seller/orders/${row.original.id}`"
                class="font-medium text-primary"
              >
                #{{ row.original.id.slice(-6) }}
              </ULink>
            </template>
            <template #buyerName-cell="{ row }">
              {{ row.original.buyerName ?? 'Без имени' }}
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

        <div class="flex flex-col gap-6">
          <UCard v-if="data.topProducts.length > 0">
            <template #header>
              <p class="font-medium">Топ товаров</p>
            </template>
            <ol>
              <li
                v-for="(item, idx) in data.topProducts"
                :key="item.id"
                class="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
              >
                <span class="w-4 shrink-0 text-sm font-semibold text-muted">{{ idx + 1 }}</span>
                <ULink :to="`/seller/products`" class="truncate text-sm font-medium text-primary">
                  {{ item.name }}
                </ULink>
                <span class="ml-auto whitespace-nowrap text-sm">
                  <span class="font-medium">{{ item.sold }} шт</span>
                  <span class="text-muted"> · {{ formatPrice(item.revenue) }}</span>
                </span>
              </li>
            </ol>
          </UCard>

          <UCard v-if="hasAttention">
            <template #header>
              <p class="font-medium">Нужно внимание</p>
            </template>
            <div
              v-for="item in attentionItems"
              :key="item.id"
              class="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
            >
              <ULink
                :to="`/seller/products`"
                class="truncate text-sm font-medium text-primary"
              >
                {{ item.name }}
              </ULink>
              <UBadge v-if="item.kind === 'hidden'" color="neutral" variant="subtle">Скрыт</UBadge>
              <UBadge v-else :color="item.stock === 0 ? 'error' : 'warning'" variant="subtle">
                {{ item.stock === 0 ? 'Нет в наличии' : `Осталось ${item.stock}` }}
              </UBadge>
            </div>
          </UCard>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <UButton icon="i-heroicons-plus" :to="'/seller/products/new'">Добавить товар</UButton>
        <UButton variant="outline" :to="'/seller/orders'">Все заказы</UButton>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
  import type { SellerStats, RecentOrder } from '#shared/schemas/seller.schema';
  import type { ColumnDef } from '@tanstack/vue-table';

  definePageMeta({
    layout: 'dashboard',
    middleware: ['seller'],
    robots: false,
  });

  const requestFetch = useRequestFetch();
  const store = useSellerStore();
  const { data: session } = useAuth();

  const emptyStats: SellerStats = {
    revenue: 0,
    ordersCount: 0,
    productsCount: 0,
    lowStock: [],
    inactive: [],
    recentOrders: [],
    statusCounts: { PENDING: 0, CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 },
    topProducts: [],
  };

  const { data, error, pending, refresh } = await useAsyncData(
    'seller-stats',
    () => requestFetch<SellerStats>('/api/sellers/stats'),
    { default: () => emptyStats },
  );

  watch(data, (value) => store.setStats(value), { immediate: true });

  const userName = computed(() => session.value?.user?.name ?? 'продавец');
  const today = computed(() => new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }));
  const greeting = computed(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Доброе утро';
    if (h >= 12 && h < 18) return 'Добрый день';
    return 'Добрый вечер';
  });

  const metrics = computed(() => [
    { label: 'Выручка', value: formatPrice(data.value.revenue), hint: 'по не-отменённым заказам' },
    { label: 'Заказы', value: String(data.value.ordersCount), hint: `${store.statusShare('DELIVERED')}% доставлено` },
    { label: 'Товары', value: String(data.value.productsCount), hint: 'всего в каталоге' },
    { label: 'Средний чек', value: formatPrice(store.avgOrder), hint: 'в среднем на заказ' },
  ]);

const orderColumns: ColumnDef<RecentOrder>[] = [
  { accessorKey: 'id', header: '№' },
  { accessorKey: 'buyerName', header: 'Покупатель' },
  { accessorKey: 'sellerTotal', header: 'Сумма' },
  { accessorKey: 'status', header: 'Статус' },
  { accessorKey: 'createdAt', header: 'Дата' },
];

  const attentionItems = computed(() => [
    ...data.value.lowStock.map((p) => ({ id: p.id, name: p.name, kind: 'low' as const, stock: p.stock })),
    ...data.value.inactive.map((p) => ({ id: p.id, name: p.name, kind: 'hidden' as const, stock: null })),
  ]);
  const hasAttention = computed(() => attentionItems.value.length > 0);
</script>
