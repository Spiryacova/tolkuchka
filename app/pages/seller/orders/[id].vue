<template>
  <div v-if="order">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <ULink to="/seller/orders" class="text-sm text-muted hover:text-primary">
          ← Все заказы
        </ULink>
        <h1 class="mt-1 text-2xl font-bold">Заказ #{{ order.id.slice(-6) }}</h1>
        <div class="mt-2 flex items-center gap-3">
          <UBadge :color="orderStatusColor(order.status)" variant="subtle">
            {{ orderStatusLabel(order.status) }}
          </UBadge>
          <span class="text-sm text-muted">
            Создан {{ formatDate(order.createdAt) }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <USelect
          v-model="selected"
          :items="transitionItems"
          :disabled="saving || transitionItems.length === 0"
          :placeholder="transitionItems.length === 0 ? 'Терминальный статус' : 'Новый статус…'"
          class="w-56"
        />
        <UButton
          color="primary"
          variant="solid"
          icon="i-heroicons-arrow-path"
          :loading="saving"
          :disabled="!selected || selected === order.status"
          @click="applyStatus"
        >
          Применить
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">Товары</h2>
              <span class="text-sm text-muted">{{ order.items.length }} поз.</span>
            </div>
          </template>

          <ul class="divide-y divide-(--ui-border)">
            <li v-for="item in order.items" :key="item.id" class="flex items-center gap-4 py-3">
              <UAvatar :src="item.image ?? undefined" :alt="item.name" size="lg" />
              <div class="min-w-0 flex-1">
                <ULink :to="`/products/${item.productId}`" class="font-medium hover:text-primary">
                  {{ item.name }}
                </ULink>
                <p class="text-sm text-muted">
                  {{ item.quantity }} × {{ formatPrice(item.priceAtPurchase) }}
                </p>
              </div>
              <span class="font-medium">{{ formatPrice(item.priceAtPurchase * item.quantity) }}</span>
            </li>
          </ul>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">Доставка</h2>
          </template>
          <dl v-if="order.shippingAddress" class="space-y-2 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Получатель</dt>
              <dd class="text-right">{{ order.shippingAddress.name }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Email</dt>
              <dd class="text-right">{{ order.buyerEmail }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Адрес</dt>
              <dd class="max-w-72 text-right">{{ order.shippingAddress.address }}</dd>
            </div>
            <div v-if="order.shippingAddress.comment" class="flex justify-between gap-4">
              <dt class="text-muted">Комментарий</dt>
              <dd class="max-w-72 text-right">{{ order.shippingAddress.comment }}</dd>
            </div>
          </dl>
          <p v-else class="text-sm text-muted">Адрес не указан</p>
        </UCard>
      </div>

      <div class="space-y-6">
        <UCard>
          <template #header>
            <h2 class="font-semibold">Покупатель</h2>
          </template>
          <div class="flex items-center gap-3">
            <UAvatar :alt="order.buyerName ?? undefined" />
            <div>
              <p class="font-medium">{{ order.buyerName ?? 'Без имени' }}</p>
              <p class="text-sm text-muted">{{ order.buyerEmail }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">Итого (ваши товары)</h2>
          </template>
          <div class="flex items-baseline justify-between">
            <span class="text-muted">Сумма</span>
            <span class="text-2xl font-bold">{{ formatPrice(order.sellerTotal) }}</span>
          </div>
        </UCard>
      </div>
    </div>
  </div>

  <div v-else class="space-y-4">
    <USkeleton class="h-9 w-64" />
    <USkeleton class="h-40 rounded-xl" />
    <USkeleton class="h-40 rounded-xl" />
  </div>
</template>

<script setup lang="ts">
  import type { OrderStatus, SellerOrderDetail } from '#shared/schemas/order.schema';
  import { ALLOWED_TRANSITIONS } from '#shared/schemas/order.schema';

  const route = useRoute();
  const toast = useToast();
  const requestFetch = useRequestFetch();

  definePageMeta({
    layout: 'dashboard',
    middleware: ['seller'],
    robots: false,
  });

  const { data: order, error } = await useAsyncData(
    'seller-order-' + route.params.id,
    () => requestFetch<SellerOrderDetail>(`/api/sellers/orders/${route.params.id}`),
  );
  if (error.value) throw createError({ statusCode: 404, statusMessage: 'Заказ не найден' });

  const selected = ref<OrderStatus | undefined>(undefined);
  const saving = ref(false);

  const transitionItems = computed(() =>
    ALLOWED_TRANSITIONS[order.value!.status].map((s) => ({
      label: orderStatusLabel(s),
      value: s,
    })),
  );

  async function applyStatus() {
    if (!selected.value) return;
    saving.value = true;
    try {
      await requestFetch(`/api/sellers/orders/${order.value!.id}`, {
        method: 'PATCH',
        body: { status: selected.value },
      });
      order.value!.status = selected.value;
      selected.value = undefined;
      toast.add({
        title: 'Статус обновлён',
        description: `${orderStatusLabel(order.value!.status)} · заказ #${order.value!.id.slice(-6)}`,
        color: 'success',
      });
    } catch (e) {
      toast.add({
        title: 'Не удалось обновить статус',
        description: apiErrorMessage(e),
        color: 'error',
      });
    } finally {
      saving.value = false;
    }
  }
</script>