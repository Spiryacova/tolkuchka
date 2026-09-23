<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Мои товары</h1>
        <p v-if="data" class="mt-1 text-sm text-muted">
          Всего товаров: {{ data.totalProducts }}
        </p>
      </div>
      <UButton
        to="/seller/products/new"
        icon="i-heroicons-plus"
        color="primary"
        variant="solid"
      >
        Добавить товар
      </UButton>
    </div>

    <template v-if="error">
      <UAlert
        color="error"
        variant="subtle"
        :title="apiErrorMessage(error)"
        description="Повторите попытку или обновите страницу"
      >
        <template #actions>
          <UButton
            color="error"
            variant="solid"
            icon="i-heroicons-arrow-path"
            @click="() => refresh()"
          >
            Попробовать снова
          </UButton>
        </template>
      </UAlert>
    </template>

    <template v-else>
      <div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <UTabs v-model="tab" :items="tabs" />
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Поиск по названию"
          aria-label="Поиск по названию"
          class="sm:w-64"
        />
      </div>

      <template v-if="data && data.total > 0">
        <UCard :ui="{ body: 'p-0' }">
          <UTable :data="data.items" :columns="columns" :loading="pending">
            <template #loading>
              <USkeleton class="h-10 w-full" />
            </template>
            <template #image-cell="{ row }">
              <img
                v-if="row.original.image"
                :src="row.original.image"
                :alt="row.original.name"
                class="h-10 w-10 rounded-lg object-cover"
              />
              <div v-else class="flex h-10 w-10 items-center justify-center rounded-lg bg-subtle text-dimmed">
                <Icon name="i-heroicons-photo" class="h-5 w-5" />
              </div>
            </template>
            <template #name-cell="{ row }">
              <ULink :to="`/seller/products/${row.original.id}/edit`" class="font-medium hover:text-primary">
                {{ row.original.name }}
              </ULink>
            </template>
            <template #categoryName-cell="{ row }">
              <span class="text-sm text-muted">{{ row.original.categoryName }}</span>
            </template>
            <template #price-cell="{ row }">
              <span class="font-medium">{{ formatPrice(row.original.price) }}</span>
            </template>
            <template #stock-cell="{ row }">
              <span :class="row.original.stock === 0 ? 'text-error' : ''">{{ row.original.stock }}</span>
            </template>
            <template #isActive-cell="{ row }">
              <UBadge v-if="!row.original.isActive" color="neutral" variant="subtle">Скрыт</UBadge>
              <UBadge v-else-if="row.original.stock === 0" color="error" variant="subtle">Закончился</UBadge>
              <UBadge v-else color="success" variant="subtle">Активен</UBadge>
            </template>
            <template #actions-cell="{ row }">
              <div class="flex justify-end">
                <UDropdownMenu :items="actionItems(row.original)" :content="{ align: 'end' }">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-ellipsis-horizontal"
                    aria-label="Действия"
                  />
                </UDropdownMenu>
              </div>
            </template>
          </UTable>
        </UCard>

        <div v-if="data.total > perPage" class="mt-6 flex justify-center">
          <UPagination
            v-model:page="page"
            :items-per-page="perPage"
            :total="data.total"
            :sibling-count="2"
            :show-edges="true"
          />
        </div>
      </template>

      <template v-else-if="hasAnyProducts">
        <UCard>
          <UEmpty
            icon="i-heroicons-magnifying-glass"
            title="Ничего не найдено"
            description="Попробуйте изменить запрос или сбросить фильтр."
          >
            <template #actions>
              <UButton
                color="neutral"
                variant="subtle"
                @click="resetFilters"
              >
                Сбросить фильтр
              </UButton>
            </template>
          </UEmpty>
        </UCard>
      </template>

      <template v-else>
        <UCard>
          <UEmpty
            icon="i-heroicons-squares-plus"
            title="Товаров пока нет"
            description="Добавьте первый товар, чтобы он появился в каталоге."
          >
            <template #actions>
              <UButton to="/seller/products/new" icon="i-heroicons-plus" color="primary">
                Добавить первый товар
              </UButton>
            </template>
          </UEmpty>
        </UCard>
      </template>
    </template>

    <UModal
      v-model:open="confirmDelete"
      title="Удалить товар?"
      :description="toDelete ? `«${toDelete.name}» будет удалён без возможности восстановления.` : ''"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            @click="confirmDelete = false"
          >
            Отмена
          </UButton>
          <UButton
            color="error"
            variant="solid"
            :loading="deleting"
            @click="onDelete"
          >
            Удалить
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
  import type { ColumnDef } from '@tanstack/vue-table';
  import type { SellerProduct, SellerProductFilter, SellerProductListResponse } from '#shared/schemas/product.schema';

  definePageMeta({
    layout: 'dashboard',
    middleware: ['seller'],
    robots: false,
  });

  useSeoMeta({ title: 'Мои товары' });

  const requestFetch = useRequestFetch();
  const toast = useToast();

  const perPage = 10;
  const tab = ref<SellerProductFilter>('all');
  const page = ref(1);
  const search = ref('');
  const appliedSearch = ref('');

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  watch(search, (value) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      appliedSearch.value = value.trim();
      page.value = 1;
    }, 350);
  });
  onBeforeUnmount(() => clearTimeout(debounceTimer));

  const emptyResponse: SellerProductListResponse = {
    items: [],
    page: 1,
    perPage,
    total: 0,
    counts: { all: 0, active: 0, hidden: 0 },
    totalProducts: 0,
  };

  const { data, error, pending, refresh } = await useAsyncData(
    'seller-products',
    () =>
      requestFetch<SellerProductListResponse>('/api/sellers/products', {
        query: {
          page: page.value,
          perPage,
          status: tab.value,
          ...(appliedSearch.value ? { q: appliedSearch.value } : {}),
        },
      }),
    { watch: [appliedSearch, tab, page], default: () => emptyResponse },
  );

  watch(tab, () => {
    page.value = 1;
  });

  const tabs = computed(() => {
    const counts = data.value?.counts ?? emptyResponse.counts;
    return [
      { label: `Все (${counts.all})`, value: 'all' },
      { label: `Активные (${counts.active})`, value: 'active' },
      { label: `Скрытые (${counts.hidden})`, value: 'hidden' },
    ];
  });

  const hasAnyProducts = computed(() => (data.value?.totalProducts ?? 0) > 0);

  function resetFilters() {
    search.value = '';
    appliedSearch.value = '';
    tab.value = 'all';
    page.value = 1;
  }

  const columns: ColumnDef<SellerProduct>[] = [
    { accessorKey: 'image', header: '' },
    { accessorKey: 'name', header: 'Название' },
    { accessorKey: 'categoryName', header: 'Категория' },
    { accessorKey: 'price', header: 'Цена', meta: { class: { th: 'text-right', td: 'text-right' } } },
    { accessorKey: 'stock', header: 'Остаток', meta: { class: { th: 'text-right', td: 'text-right' } } },
    { accessorKey: 'isActive', header: 'Статус' },
    { id: 'actions', header: '' },
  ];

  const toDelete = ref<SellerProduct | null>(null);
  const confirmDelete = ref(false);
  const deleting = ref(false);
  const togglingId = ref<string | null>(null);

  function actionItems(product: SellerProduct) {
    return [
      [{
        label: 'Редактировать',
        icon: 'i-heroicons-pencil-square',
        onSelect: () => navigateTo(`/seller/products/${product.id}/edit`),
      }],
      [{
        label: product.isActive ? 'Скрыть' : 'Показать',
        icon: product.isActive ? 'i-heroicons-eye-slash' : 'i-heroicons-eye',
        disabled: togglingId.value === product.id,
        onSelect: () => toggleActive(product),
      }],
      [{
        label: 'Удалить',
        icon: 'i-heroicons-trash',
        color: 'error' as const,
        disabled: product.hasOrders,
        description: product.hasOrders ? 'Есть заказы — скройте товар' : undefined,
        onSelect: () => openDelete(product),
      }],
    ];
  }

  async function toggleActive(product: SellerProduct) {
    if (togglingId.value === product.id) return;
    togglingId.value = product.id;
    try {
      await $fetch(`/api/sellers/products/${product.id}`, {
        method: 'PATCH',
        body: { isActive: !product.isActive },
      });
      toast.add({
        title: product.isActive ? 'Товар скрыт' : 'Товар показан',
        description: product.name,
        color: 'success',
      });
      await refresh();
    } catch (e) {
      toast.add({ title: 'Не удалось изменить статус', description: apiErrorMessage(e), color: 'error' });
    } finally {
      togglingId.value = null;
    }
  }

  function openDelete(product: SellerProduct) {
    if (product.hasOrders) return;
    toDelete.value = product;
    confirmDelete.value = true;
  }

  async function onDelete() {
    if (!toDelete.value) return;
    deleting.value = true;
    try {
      await $fetch(`/api/sellers/products/${toDelete.value.id}`, { method: 'DELETE' });
      toast.add({ title: 'Товар удалён', description: toDelete.value.name, color: 'success' });
      confirmDelete.value = false;
      toDelete.value = null;
      await refresh();
    } catch (e) {
      toast.add({ title: 'Не удалось удалить', description: apiErrorMessage(e), color: 'error' });
    } finally {
      deleting.value = false;
    }
  }
</script>
