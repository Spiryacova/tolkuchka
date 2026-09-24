<template>
  <div class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div class="flex flex-wrap items-center gap-4">
      <USelect
        v-if="showCategoryFilter"
        v-model="category"
        :items="categoryOptions"
        placeholder="Категория"
        class="w-48"
      />
      <div class="flex items-center gap-2">
        <UInput
          v-model="priceMin"
          type="number"
          inputmode="numeric"
          placeholder="Цена от"
          class="w-28"
        />
        <span class="text-muted">—</span>
        <UInput
          v-model="priceMax"
          type="number"
          inputmode="numeric"
          placeholder="до"
          class="w-28"
        />
      </div>
      <UButton color="neutral" variant="ghost" @click="$emit('reset')"> Сбросить </UButton>
    </div>

    <USelect v-model="sort" :items="sortOptions" class="w-56" />
  </div>
</template>

<script setup lang="ts">
  import type { SortKey } from '~/stores/product';

  const { showCategoryFilter = true } = defineProps<{ showCategoryFilter?: boolean }>();
  defineEmits(['reset']);

  const store = useProductStore();

  const category = computed({
    get: () => store.filters.categoryId ?? undefined,
    set: (v) => store.setCategory(v ?? null),
  });
  const categoryOptions = computed(() =>
    store.categories.map((c) => ({ label: c.name, value: c.id })),
  );

  const sortOptions = [
    { label: 'По релевантности', value: 'relevance' },
    { label: 'Сначала дешевле', value: 'priceAsc' },
    { label: 'Сначала дороже', value: 'priceDesc' },
    { label: 'По рейтингу', value: 'rating' },
  ] satisfies { label: string; value: SortKey }[];

  const sort = computed({
    get: () => store.sort,
    set: (value: string) => store.setSort(value as SortKey),
  });

  function priceFromInput(value: string): number | null {
    const parsed = Number(value);
    return value === '' || Number.isNaN(parsed) || parsed < 0 ? null : parsed;
  }

  const priceMin = computed({
    get: () => (store.filters.priceMin === null ? '' : String(store.filters.priceMin)),
    set: (value: string) => store.setPriceRange(priceFromInput(value), store.filters.priceMax),
  });

  const priceMax = computed({
    get: () => (store.filters.priceMax === null ? '' : String(store.filters.priceMax)),
    set: (value: string) => store.setPriceRange(store.filters.priceMin, priceFromInput(value)),
  });
</script>
