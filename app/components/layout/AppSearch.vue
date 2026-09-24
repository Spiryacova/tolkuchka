<template>
  <UInput
    :model-value="q"
    icon="i-heroicons-magnifying-glass"
    placeholder="Поиск по каталогу"
    class="min-w-0 flex-1"
    @update:model-value="store.setQuery($event)"
    @keydown.enter="navigateTo('/products')"
  />
</template>

<script setup lang="ts">
  const store = useProductStore();

  const q = computed({
    get: () => store.filters.q,
    set: (v: string) => store.setQuery(v),
  });
</script>
