<template>
  <UCard :ui="{ body: 'p-0' }" class="overflow-hidden">
    <div class="flex gap-4 p-4 sm:p-6" :class="{ 'opacity-60': unavailable }">
      <ULink :to="`/products/${line.product.slug}`" class="shrink-0">
        <div
          class="relative aspect-square w-20 overflow-hidden rounded-lg bg-gray-100 sm:w-24 dark:bg-gray-800/60"
        >
          <img
            v-if="line.product.imageUrl"
            :src="line.product.imageUrl"
            :alt="line.product.name"
            class="absolute inset-0 h-full w-full object-cover"
          />
          <UIcon
            v-else
            name="i-heroicons-shopping-bag"
            class="absolute inset-0 m-auto h-6 w-6 text-primary/30"
          />
        </div>
      </ULink>

      <div class="flex min-w-0 flex-1 flex-col">
        <div class="flex items-start justify-between gap-3">
          <ULink
            :to="`/products/${line.product.slug}`"
            class="line-clamp-2 text-sm font-medium"
          >
            {{ line.product.name }}
          </ULink>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-trash"
            size="sm"
            aria-label="Удалить из корзины"
            class="-mr-2 -mt-1 shrink-0"
            @click="emit('remove')"
          />
        </div>

        <div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{{ formatPrice(line.product.price) }} / шт</span>
          <UBadge v-if="unavailable" color="error" variant="subtle" size="xs">
            Нет в наличии
          </UBadge>
          <UBadge
            v-else-if="(line.product.stock ?? 0) > 0 && (line.product.stock ?? 0) <= 5"
            color="warning"
            variant="subtle"
            size="xs"
          >
            осталось {{ line.product.stock }} шт.
          </UBadge>
        </div>

        <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
          <UInputNumber
            :model-value="line.quantity"
            :min="1"
            :max="unavailable ? 1 : line.product.stock ?? 0"
            :disabled="unavailable"
            class="w-28"
            @update:model-value="onQtyChange"
          />
          <span class="text-base font-semibold">{{ formatLineTotal }}</span>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
  import type { CartItem } from '#shared/schemas/cart.schema';

  const props = defineProps<{ line: CartItem }>();
  const emit = defineEmits<{
    'update-qty': [value: number];
    remove: [];
  }>();

  const unavailable = computed(() => (props.line.product.stock ?? 0) === 0);

  const formatPrice = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;
  const formatLineTotal = computed(() =>
    formatPrice(props.line.product.price * props.line.quantity),
  );

  function onQtyChange(value: unknown) {
    const next = typeof value === 'number' ? value : Number(value ?? 1);
    emit('update-qty', Number.isFinite(next) && next >= 1 ? next : 1);
  }
</script>