<template>
  <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold sm:text-3xl">{{ category.name }}</h1>
      <p class="mt-2 text-muted">Найдено товаров: {{ total }}</p>
    </div>

    <CatalogFilters :show-category-filter="false" @reset="reset" />

    <ProductGrid :items="items" :loading="pending" :show-reset="false" />

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
  import type { Category } from '#shared/schemas/product.schema';

  const store = useProductStore();
  const route = useRoute();

  const { data: categoryData, error } = await useAsyncData(
    'category-' + route.params.slug,
    () => $fetch<Category>(`/api/categories/${route.params.slug}`),
  );
  if (error.value) throw createError({ statusCode: 404, statusMessage: 'Категория не найдена' });

  const category = computed(() => categoryData.value!);

  store.applyCategory(category.value.id);

  const { queryKey, items, total, perPage } = storeToRefs(store);
  const { pending, refresh } = await useAsyncData(
    'catalog-category-' + route.params.slug,
    () => store.fetchProducts(),
    { getCachedData: () => undefined, default: () => [] },
  );
  onMounted(() => refresh());
  watch(queryKey, () => refresh());

  watch(
    () => category.value?.id,
    (id) => { if (id) store.applyCategory(id); },
  );

  const page = computed({
    get: () => store.page,
    set: (v: number) => store.setPage(v),
  });

  function reset() {
    store.applyCategory(category.value.id);
  }

  useSeoMeta({
    title: () => (category.value ? `${category.value.name} — Толкучка` : 'Категория — Толкучка'),
    description: () =>
      category.value ? `Товары категории "${category.value.name}" на Толкучке.` : '',
    ogTitle: () =>
      category.value ? `${category.value.name} — Толкучка` : 'Категория — Толкучка',
    ogDescription: () =>
      category.value ? `Товары категории "${category.value.name}" на Толкучке.` : '',
  });
</script>
