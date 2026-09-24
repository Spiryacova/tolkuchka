<template>
  <div class="mx-auto w-full max-w-lg space-y-6 py-8">
    <div>
      <ULink to="/seller/products" class="text-sm text-muted hover:text-primary">
        ← Мои товары
      </ULink>
      <h1 class="mt-1 text-2xl font-bold">Новый товар</h1>
      <p class="mt-1 text-sm text-muted">Товар появится в каталоге сразу после сохранения</p>
    </div>

    <UCard>
      <SellerProductForm
        submit-label="Создать товар"
        :submitting="saving"
        @submit="onSubmit"
        @cancel="onCancel"
        @dirty="isDirty = $event"
      />
    </UCard>

    <UModal
      v-model:open="confirmCancel"
      title="Отменить создание?"
      description="Несохранённые данные будут потеряны."
    >
      <template #footer>
        <div class="flex w-full justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            @click="confirmCancel = false"
          >
            Продолжить редактирование
          </UButton>
          <UButton
            color="error"
            variant="solid"
            @click="onConfirmCancel"
          >
            Выйти без сохранения
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
  import type { ProductCreate, SellerProductDetail } from '#shared/schemas/product.schema';

  definePageMeta({
    layout: 'dashboard',
    middleware: ['seller'],
    robots: false,
  });

  useSeoMeta({ title: 'Новый товар' });

  const toast = useToast();
  const saving = ref(false);
  const isDirty = ref(false);
  const confirmCancel = ref(false);
  const pendingPath = ref<string | null>(null);

  async function onSubmit(payload: ProductCreate) {
    saving.value = true;
    try {
      await $fetch<SellerProductDetail>('/api/sellers/products', { method: 'POST', body: payload });
      isDirty.value = false;
      toast.add({ title: 'Товар создан', description: payload.name, color: 'success' });
      await navigateTo('/seller/products');
    } catch (e) {
      toast.add({ title: 'Не удалось создать товар', description: apiErrorMessage(e), color: 'error' });
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
</script>
