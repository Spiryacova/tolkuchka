<template>
  <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold sm:text-3xl">Каталог товаров</h1>
      <p class="mt-2 text-muted">Найдено: {{ total }}</p>
    </div>

    <CatalogFilters @reset="reset" />

    <ProductGrid :items="items" :loading="pending" @reset="reset" />

    <div class="mt-8 flex justify-center">
      <UPagination
        v-model:page="page"
        :items-per-page="perPage"
        :total="total"
        :sibling-count="2"
        :show-edges="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  const store = useProductStore();
  store.resetFilters();
  store.fetchCategories();

  const { queryKey, items, total, perPage } = storeToRefs(store);
  const { pending, refresh } = await useAsyncData(
    'catalog-index',
    () => store.fetchProducts(),
    { getCachedData: () => undefined, default: () => [] },
  );
  onMounted(() => refresh()); // форс-фетч при каждом монтаже - стор всегда синхронен
  watch(queryKey, () => refresh()); // любая смена фильтра/сортировки/страницы - перезапрос

  const page = computed({
    get: () => store.page,
    set: (v: number) => store.setPage(v),
  });

  function reset() {
    store.resetFilters();
  }

  useSeoMeta({
    title: 'Каталог товаров — Толкучка',
    description:
      'Найдите товары от продавцов: электроника, дом и кухня, одежда, спорт, книги, игрушки.',
    ogTitle: 'Каталог товаров — Толкучка',
    ogDescription: 'Каталог маркетплейса Толкучка.',
  });
</script>
