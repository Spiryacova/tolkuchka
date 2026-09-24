<template>
  <div v-if="product" class="mx-auto w-full max-w-lg space-y-6 py-8">
    <div>
      <ULink to="/seller/products" class="text-sm text-muted hover:text-primary">
        ← Мои товары
      </ULink>
      <div class="mt-1 flex flex-wrap items-center gap-3">
        <h1 class="text-2xl font-bold">Редактирование: {{ product.name }}</h1>
        <UBadge v-if="isDirty" color="warning" variant="subtle">Есть несохранённые изменения</UBadge>
      </div>
      <ULink
        v-if="product.isActive"
        :to="`/products/${product.slug}`"
        class="mt-1 text-sm text-muted hover:text-primary"
        target="_blank"
      >
        Открыть в каталоге
      </ULink>
      <p v-else class="mt-1 text-sm text-muted">Товар скрыт из каталога</p>
    </div>

    <UCard>
      <SellerProductForm
        :product="product"
        submit-label="Сохранить"
        :submitting="saving"
        @submit="onSubmit"
        @cancel="onCancel"
        @dirty="isDirty = $event"
      />
    </UCard>

    <UCard v-if="!product.hasOrders">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="font-medium">Удалить товар</p>
          <p class="text-sm text-muted">Действие необратимо. Товар не участвует ни в одном заказе.</p>
        </div>
        <UButton color="error" variant="outline" @click="confirmDelete = true">Удалить</UButton>
      </div>
    </UCard>
    <p v-else class="text-sm text-muted">
      Товар есть в заказах — удаление недоступно. Вместо удаления скройте его в общей форме.
    </p>

    <UModal
      v-model:open="confirmCancel"
      title="Отменить изменения?"
      description="Несохранённые данные будут потеряны."
    >
      <template #footer>
        <div class="flex w-full justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="confirmCancel = false">
            Продолжить редактирование
          </UButton>
          <UButton color="error" variant="solid" @click="onConfirmCancel">
            Выйти без сохранения
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="confirmDelete"
      title="Удалить товар?"
      :description="`«${product.name}» будет удалён без возможности восстановления.`"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="confirmDelete = false">
            Отмена
          </UButton>
          <UButton color="error" variant="solid" :loading="deleting" @click="onDelete">
            Удалить
          </UButton>
        </div>
      </template>
    </UModal>
  </div>

  <div v-else class="mx-auto w-full max-w-lg space-y-4 py-8">
    <USkeleton class="h-9 w-64" />
    <USkeleton class="h-96 rounded-xl" />
  </div>
</template>

<script setup lang="ts">
  import type { ProductCreate, SellerProductDetail } from '#shared/schemas/product.schema';

  const route = useRoute();
  const toast = useToast();
  const requestFetch = useRequestFetch();

  definePageMeta({
    layout: 'dashboard',
    middleware: ['seller'],
    robots: false,
  });

  useSeoMeta({ title: 'Редактирование товара' });

  const { data: product, error } = await useAsyncData(
    'seller-product-' + route.params.id,
    () => requestFetch<SellerProductDetail>(`/api/sellers/products/${route.params.id}`),
  );
  if (error.value) throw createError({ statusCode: 404, statusMessage: 'Товар не найден' });

  const saving = ref(false);
  const deleting = ref(false);
  const isDirty = ref(false);
  const confirmCancel = ref(false);
  const confirmDelete = ref(false);
  const pendingPath = ref<string | null>(null);

  async function onSubmit(payload: ProductCreate) {
    saving.value = true;
    try {
      await requestFetch<SellerProductDetail>(`/api/sellers/products/${product.value!.id}`, {
        method: 'PATCH',
        body: payload,
      });
      isDirty.value = false;
      toast.add({ title: 'Сохранено', description: payload.name, color: 'success' });
      await navigateTo('/seller/products');
    } catch (e) {
      toast.add({ title: 'Не удалось сохранить', description: apiErrorMessage(e), color: 'error' });
    } finally {
      saving.value = false;
    }
  }

  onBeforeRouteLeave((to) => {
    if (!isDirty.value) return true;
    pendingPath.value = to.fullPath;
    confirmCancel.value = true;
    return false;
  });

  function onCancel() {
    if (isDirty.value) {
      pendingPath.value = null;
      confirmCancel.value = true;
    } else {
      navigateTo('/seller/products');
    }
  }

  function onConfirmCancel() {
    confirmCancel.value = false;
    isDirty.value = false;
    const target = pendingPath.value ?? '/seller/products';
    pendingPath.value = null;
    navigateTo(target);
  }

  async function onDelete() {
    deleting.value = true;
    try {
      await requestFetch(`/api/sellers/products/${product.value!.id}`, { method: 'DELETE' });
      isDirty.value = false;
      toast.add({ title: 'Удалено', description: product.value!.name, color: 'success' });
      await navigateTo('/seller/products');
    } catch (e) {
      toast.add({ title: 'Не удалось удалить', description: apiErrorMessage(e), color: 'error' });
      confirmDelete.value = false;
    } finally {
      deleting.value = false;
    }
  }
</script>
