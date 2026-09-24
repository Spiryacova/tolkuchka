<template>
  <div>
    <div v-if="loading" class="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      <UCard v-for="n in 8" :key="n" :ui="{ body: 'p-0' }" class="overflow-hidden">
        <USkeleton class="aspect-[3/4] rounded-none" />
        <div class="space-y-2 p-4">
          <USkeleton class="h-4 w-16" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-2/3" />
          <USkeleton class="h-6 w-24" />
        </div>
      </UCard>
    </div>

    <div v-else-if="items.length === 0" class="py-16">
      <UEmpty
        icon="i-heroicons-magnifying-glass"
        title="Ничего не найдено"
        description="Попробуйте изменить фильтры или поисковый запрос"
      >
        <template v-if="showReset" #actions>
          <UButton color="primary" @click="emit('reset')">Сбросить фильтры</UButton>
        </template>
      </UEmpty>
    </div>

    <div v-else class="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      <ProductCard v-for="product in items" :key="product.id" :product="product" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Product } from '#shared/schemas/product.schema';

  defineProps<{ items: Product[]; loading: boolean; showReset?: boolean }>();
  const emit = defineEmits<{ reset: [] }>();
</script>
