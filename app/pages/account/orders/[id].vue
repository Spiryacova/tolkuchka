<template>
  <div v-if="order">
    <div class="mb-6">
      <ULink to="/account/orders" class="text-sm text-muted hover:text-primary">
        ← Мои заказы
      </ULink>
      <h1 class="mt-1 text-2xl font-bold">Заказ #{{ formatOrderNumber(order.buyerNo, order.no) }}</h1>
      <div class="mt-2 flex flex-wrap items-center gap-3">
        <UBadge :color="orderStatusColor(order.status)" variant="subtle">
          {{ orderStatusLabel(order.status) }}
        </UBadge>
        <span class="text-sm text-muted">Создан {{ formatDate(order.createdAt) }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">Товары</h2>
              <span class="text-sm text-muted">{{ pluralCount(order.itemCount) }}</span>
            </div>
          </template>
          <ul class="flex flex-col divide-y divide-base">
            <li
              v-for="item in order.items"
              :key="item.id"
              class="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.name"
                class="h-14 w-14 shrink-0 rounded border border-base object-cover"
              />
              <div v-else class="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-base bg-base">
                <UIcon name="i-heroicons-photo" class="size-5 text-muted" />
              </div>
              <div class="min-w-0 flex-1">
                <NuxtLink :to="`/products/${item.slug}`" class="truncate font-medium hover:text-primary">
                  {{ item.name }}
                </NuxtLink>
                <p class="text-sm text-muted">
                  {{ item.quantity }} шт. · {{ formatPrice(item.priceAtPurchase) }}
                </p>
              </div>
              <span class="shrink-0 font-medium">
                {{ formatPrice(item.priceAtPurchase * item.quantity) }}
              </span>
            </li>
          </ul>
        </UCard>
      </div>

      <div class="flex flex-col gap-6">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-truck" class="size-4 text-muted" />
              <h2 class="font-semibold">Доставка</h2>
            </div>
          </template>
          <dl v-if="order.shippingAddress" class="flex flex-col gap-2 text-sm">
            <div>
              <dt class="text-muted">Получатель</dt>
              <dd class="font-medium">{{ order.shippingAddress.name }}</dd>
            </div>
            <div>
              <dt class="text-muted">Email</dt>
              <dd>{{ order.shippingAddress.email }}</dd>
            </div>
            <div>
              <dt class="text-muted">Адрес</dt>
              <dd>{{ order.shippingAddress.address }}</dd>
            </div>
            <div v-if="order.shippingAddress.comment">
              <dt class="text-muted">Комментарий</dt>
              <dd>{{ order.shippingAddress.comment }}</dd>
            </div>
          </dl>
          <p v-else class="text-sm text-muted">Данные доставки недоступны</p>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-user" class="size-4 text-muted" />
              <h2 class="font-semibold">Продавец</h2>
            </div>
          </template>
          <p class="text-sm font-medium">{{ order.sellerName ?? 'Продавец' }}</p>
        </UCard>

        <UCard>
          <div class="flex items-baseline justify-between">
            <span class="font-semibold">Итого</span>
            <span class="text-xl font-bold">{{ formatPrice(order.total) }}</span>
          </div>
        </UCard>
      </div>
    </div>

    <div class="mt-6">
      <UButton color="primary" variant="soft" icon="i-heroicons-arrow-left" to="/account/orders">
        К списку заказов
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { BuyerOrderDetail } from '#shared/schemas/order.schema';

  definePageMeta({
    middleware: ['sidebase-auth'],
    robots: false,
  });

  const route = useRoute();
  const requestFetch = useRequestFetch();

  const { data: order } = await useAsyncData(`account-order-${route.params.id}`, () =>
    requestFetch<BuyerOrderDetail>(`/api/orders/${String(route.params.id)}`),
  );

  if (!order.value) {
    throw createError({ statusCode: 404, statusMessage: 'Заказ не найден' });
  }

  function pluralCount(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} позиция`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} позиции`;
    return `${count} позиций`;
  }
</script>