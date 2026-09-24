<template>
  <UCard :ui="{ body: 'p-0' }" class="overflow-hidden">
    <ULink :to="`/products/${product.slug}`" class="block">
      <div class="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800/60">
        <img
          v-if="product.imageUrl"
          :src="product.imageUrl"
          :alt="product.name"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <UIcon
          v-else
          name="i-heroicons-shopping-bag"
          class="absolute inset-0 m-auto h-8 w-8 text-primary/30"
        />
      </div>
      <div class="space-y-2 p-4">
        <UBadge color="neutral" variant="subtle" size="xs">
          {{ product.category.name }}
        </UBadge>
        <p class="line-clamp-2 text-sm font-medium">{{ product.name }}</p>
        <div class="flex items-baseline gap-2">
          <span class="text-lg font-bold">{{ formatPrice(product.price) }}</span>
          <del v-if="product.oldPrice" class="text-sm text-muted">
            {{ formatPrice(product.oldPrice) }}
          </del>
        </div>
        <p v-if="product.rating" class="flex items-center gap-1 text-sm text-muted">
          <span class="hidden items-center gap-1 sm:inline-flex">
            <template v-for="i in stars.full" :key="'f' + i">
              <UIcon name="i-heroicons-star-solid" class="h-4 w-4 shrink-0 text-amber-400" />
            </template>

            <span v-if="stars.partial" class="relative h-4 w-4">
              <UIcon
                name="i-heroicons-star-solid"
                class="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600"
              />
              <span
                class="absolute left-0 top-0 h-full overflow-hidden"
                :style="{ width: `${stars.partialPercent}%` }"
              >
                <UIcon name="i-heroicons-star-solid" class="h-4 w-4 text-amber-400" />
              </span>
            </span>

            <template v-for="i in stars.empty" :key="'e' + i">
              <UIcon
                name="i-heroicons-star-solid"
                class="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600"
              />
            </template>
          </span>
          <UIcon name="i-heroicons-star-solid" class="h-4 w-4 shrink-0 text-amber-400 sm:hidden" />
          {{ product.rating.toFixed(1) }}
        </p>
      </div>
    </ULink>
  </UCard>
</template>

<script setup lang="ts">
  import type { Product } from '#shared/schemas/product.schema';

  const props = defineProps<{ product: Product }>();

  const stars = computed(() => {
    const rating = Math.min(props.product.rating ?? 0, 5);
    const full = Math.floor(rating);
    const fraction = rating - full;
    return {
      full,
      partial: fraction > 0,
      partialPercent: fraction * 100,
      empty: Math.max(0, 5 - full - (fraction > 0 ? 1 : 0)),
    };
  });
  const formatPrice = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;
</script>
