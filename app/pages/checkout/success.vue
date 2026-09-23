<template>
  <div class="mx-auto w-full max-w-xl px-4 py-12 sm:px-6 lg:px-8">
    <template v-if="pending">
      <div class="space-y-4">
        <USkeleton class="mx-auto h-8 w-64" />
        <USkeleton v-for="i in 2" :key="i" class="h-28 rounded-lg" />
      </div>
    </template>

    <template v-else-if="allFailed">
      <UEmpty
        icon="i-heroicons-exclamation-triangle"
        title="Не удалось загрузить заказы"
        description="Проверьте историю покупок — заказы могли оформиться, но не отобразиться здесь"
        :actions="[
          { label: 'К моим заказам', color: 'primary', variant: 'solid', to: '/account/orders' },
          { label: 'Продолжить покупки', color: 'neutral', variant: 'ghost', to: '/products' },
        ]"
        class="mx-auto max-w-md"
      />
    </template>

    <template v-else>
      <div class="mb-8 text-center">
        <div
          class="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-3xl text-success"
        >
          <UIcon name="i-heroicons-check-circle" />
        </div>
        <h1 class="text-2xl font-bold sm:text-3xl">Заказ оформлен!</h1>
        <p class="mt-2 text-sm text-muted">
          Продавцы получили ваши заказы и свяжутся по доставке
        </p>
      </div>

      <UAlert
        v-if="failedCount > 0"
        color="warning"
        variant="subtle"
        icon="i-heroicons-exclamation-triangle"
        :title="`${pluralOrders(failedCount)} не отобразилось`"
        description="Заказ мог оформиться — посмотрите в истории покупок"
        class="mb-6"
      >
        <template #actions>
          <UButton color="neutral" variant="ghost" size="sm" to="/account/orders">
            К моим заказам
          </UButton>
        </template>
      </UAlert>

      <ul class="flex flex-col gap-4">
        <li v-for="order in orders" :key="order.id">
          <UCard>
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <NuxtLink to="/account/orders" class="text-base font-semibold hover:underline">
                Заказ {{ formatOrderNumber(order.buyerNo, order.no) }}
              </NuxtLink>
              <UBadge color="primary" variant="subtle">Новый</UBadge>
            </div>
            <p v-if="order.sellerName" class="mt-1 text-xs text-muted">
              Продавец: {{ order.sellerName }}
            </p>
            <ul class="mt-3 flex flex-col gap-2">
              <li
                v-for="item in order.items"
                :key="item.id"
                class="flex items-center justify-between gap-3 text-sm"
              >
                <span class="min-w-0 truncate">
                  {{ item.name }}
                  <span class="text-muted">× {{ item.quantity }}</span>
                </span>
                <span class="shrink-0 font-medium">
                  {{ formatPrice(item.priceAtPurchase * item.quantity) }}
                </span>
              </li>
            </ul>
            <USeparator class="my-3" />
            <div class="flex items-baseline justify-between">
              <span class="text-sm text-muted">{{ pluralCount(order.itemCount) }}</span>
              <span class="text-lg font-semibold">{{ formatPrice(order.total) }}</span>
            </div>
          </UCard>
        </li>
      </ul>

      <div class="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <UButton color="primary" variant="solid" class="w-full sm:w-auto" to="/account/orders">
          К моим заказам
        </UButton>
        <UButton color="neutral" variant="ghost" class="w-full sm:w-auto" to="/products">
          Продолжить покупки
        </UButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { BuyerOrderDetail } from '#shared/schemas/order.schema';

  definePageMeta({
    middleware: ['sidebase-auth'],
  });

  useSeoMeta({
    title: 'Заказ оформлен — Толкучка',
    robots: 'noindex',
  });

  const route = useRoute();
  const cart = useCartStore();

  // Серверная корзина уже очищена POST /api/orders — сбрасываем клиентское состояние
  // (бейдж в шапке, гостевые строки), чтобы не висели «фантомные» товары.
  onMounted(() => cart.clear());

  const ids = computed(() => {
    const raw = route.query.ids;
    const list = Array.isArray(raw) ? raw : [raw];
    return list
      .flatMap((value) => (typeof value === 'string' ? value.split(',') : []))
      .filter((value) => value.length > 0);
  });

  if (ids.value.length === 0) {
    await navigateTo('/');
  }

  const requestFetch = useRequestFetch();

  // Каждый заказ подтягиваем отдельно: GET /api/orders/[id] отдаёт только свои заказы.
  // Ключ содержит payload (ids): разные оформления не делят кеш чужого набора id.
  // allSettled — один сбойный GET не роняет страницу: упавшие считаем и показываем подсказку.
  type SuccessResult = { orders: BuyerOrderDetail[]; total: number; failed: number };

  const { data, pending } = await useAsyncData<SuccessResult>(
    `checkout-success-${ids.value.join(',')}`,
    async () => {
      const list = ids.value;
      const results = await Promise.allSettled(
        list.map((id) => requestFetch<BuyerOrderDetail>(`/api/orders/${id}`)),
      );
      const fulfilled = results
        .filter((r): r is PromiseFulfilledResult<BuyerOrderDetail> => r.status === 'fulfilled')
        .map((r) => r.value);
      return { orders: fulfilled, total: list.length, failed: list.length - fulfilled.length };
    },
    { default: () => ({ orders: [], total: 0, failed: 0 }) },
  );

  const orders = computed(() => data.value?.orders ?? []);
  const failedCount = computed(() => data.value?.failed ?? 0);
  const allFailed = computed(() => failedCount.value > 0 && failedCount.value === (data.value?.total ?? 0));

  function pluralOrders(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} заказ`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} заказа`;
    return `${count} заказов`;
  }

  function pluralCount(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} позиция`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} позиции`;
    return `${count} позиций`;
  }
</script>