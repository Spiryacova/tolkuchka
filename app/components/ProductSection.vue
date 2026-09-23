<template>
  <section class="pb-12">
    <div class="mb-6 flex items-baseline justify-between">
      <h2 class="text-xl font-semibold">{{ title }}</h2>
      <ULink to="/products" class="text-sm text-primary">Все товары →</ULink>
    </div>
    <ProductGrid :items="items" :loading="loading" :show-reset="false" />
  </section>
</template>

<script setup lang="ts">
  import type { Product } from '#shared/schemas/product.schema';

  defineProps<{
    title: string;
    items: Product[];
    loading: boolean;
  }>();
</script>
