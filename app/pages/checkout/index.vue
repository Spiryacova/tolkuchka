<template>
  <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <template v-if="isLoading">
      <USkeleton class="mb-8 h-9 w-40" />
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <USkeleton class="h-96 rounded-lg" />
        <USkeleton class="h-64 rounded-lg" />
      </div>
    </template>

    <template v-else-if="lines.length === 0">
      <UEmpty
        icon="i-heroicons-shopping-cart"
        title="Корзина пуста"
        description="Оформлять нечего — вернитесь в каталог и добавьте товары"
        :actions="[
          { label: 'Перейти в каталог', color: 'primary', variant: 'solid', to: '/products' },
        ]"
        class="mx-auto max-w-md"
      />
    </template>

    <template v-else>
      <header class="mb-8">
        <h1 class="text-2xl font-semibold sm:text-3xl">Оформление заказа</h1>
        <p class="mt-1 text-sm text-muted">
          Товары едут от разных продавцов — на каждого сформируем отдельный заказ
        </p>
      </header>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <UForm
          :state="form"
          :schema="shippingAddressSchema"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UCard>
            <template #header>Данные для доставки</template>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <UFormField name="name" label="Имя">
                <UInput v-model="form.name" class="w-full" />
              </UFormField>
              <UFormField name="email" label="Email">
                <UInput v-model="form.email" class="w-full" />
              </UFormField>
            </div>
            <UFormField name="address" label="Адрес доставки">
              <UInput v-model="form.address" class="w-full" placeholder="Город, улица, дом, квартира" />
            </UFormField>
            <UFormField name="comment" label="Комментарий к заказу">
              <UTextarea v-model="form.comment" class="w-full" placeholder="Необязательно" :rows="3" />
            </UFormField>
          </UCard>

          <UButton
            type="submit"
            color="primary"
            variant="solid"
            size="lg"
            class="w-full sm:w-auto"
            :loading="submitting"
            :disabled="hasUnavailable"
          >
            Подтвердить заказ — {{ formatPrice(subtotal) }}
          </UButton>
        </UForm>

        <UCard class="lg:sticky lg:top-8">
          <template #header>Ваш заказ</template>
          <ul class="flex flex-col gap-3">
            <li v-for="line in lines" :key="line.id" class="flex items-start gap-3">
              <UAvatar :src="line.product.imageUrl ?? undefined" :alt="line.product.name" size="md" />
              <div class="min-w-0 flex-1 truncate">
                <NuxtLink
                  :to="`/products/${line.product.slug}`"
                  class="truncate text-sm font-medium hover:underline"
                >
                  {{ line.product.name }}
                </NuxtLink>
                <p class="text-xs text-muted">{{ line.quantity }} × {{ formatPrice(line.product.price) }}</p>
              </div>
              <span
                v-if="(line.product.stock ?? 0) === 0"
                class="shrink-0 text-xs font-medium text-error"
              >
                Нет в наличии
              </span>
              <span v-else class="shrink-0 text-sm font-semibold">
                {{ formatPrice(line.product.price * line.quantity) }}
              </span>
            </li>
          </ul>
          <p v-if="hasUnavailable" class="mt-3 text-xs text-muted">
            Позиции «Нет в наличии» мешают оформлению —
            <NuxtLink to="/cart" class="font-medium text-primary hover:underline">вернитесь в корзину</NuxtLink>
          </p>
          <USeparator class="my-4" />
          <div class="flex items-baseline justify-between">
            <span class="text-lg font-semibold">Итого</span>
            <span class="text-2xl font-semibold">{{ formatPrice(subtotal) }}</span>
          </div>
        </UCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';
  import {
    shippingAddressSchema,
    type CheckoutCreated,
    type ShippingAddress,
  } from '#shared/schemas/order.schema';

  definePageMeta({
    middleware: ['sidebase-auth'],
  });

  useSeoMeta({
    title: 'Оформление заказа — Толкучка',
    robots: 'noindex',
  });

  const cart = useCartStore();
  const { items, isLoading } = storeToRefs(cart);
  const { data: session } = useAuth();
  const toast = useToast();

  onMounted(() => cart.load());

  const lines = computed(() => items.value);
  const available = computed(() => lines.value.filter((line) => (line.product.stock ?? 0) > 0));
  const hasUnavailable = computed(() => available.value.length !== lines.value.length);
  const subtotal = computed(() =>
    available.value.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
  );

  const form = reactive<ShippingAddress>({
    name: session.value?.user?.name ?? '',
    email: session.value?.user?.email ?? '',
    address: '',
    comment: '',
  });
  const submitting = ref(false);

  async function onSubmit(event: FormSubmitEvent<ShippingAddress>) {
    if (submitting.value) return;
    submitting.value = true;
    try {
      const res = await $fetch<CheckoutCreated>('/api/orders', {
        method: 'POST',
        body: { shippingAddress: event.data },
      });
      const ids = res.orders.map((order) => order.id).join(',');
      await navigateTo({ path: '/checkout/success', query: { ids } });
    } catch (e) {
      const statusCode = (e as { statusCode?: number })?.statusCode;
      if (statusCode === 409) {
        const items = (e as { data?: { items?: { name: string }[] } })?.data?.items;
        const names = items?.map((item) => item.name).join(', ') ?? '';
        toast.add({
          title: 'Часть товаров недоступна',
          description: names
            ? `Товар закончился: ${names} — уберите его из корзины`
            : 'Обновите корзину и попробуйте ещё раз',
          color: 'error',
          actions: [{ label: 'К корзине', onClick: () => navigateTo('/cart') }],
        });
      } else if (statusCode === 400) {
        // Корзина опустела (например, уже оформили заказ в другой вкладке) — просто уходим.
        await navigateTo('/cart');
      } else {
        toast.add({
          title: 'Не удалось оформить заказ',
          description: apiErrorMessage(e),
          color: 'error',
        });
      }
    } finally {
      submitting.value = false;
    }
  }
</script>