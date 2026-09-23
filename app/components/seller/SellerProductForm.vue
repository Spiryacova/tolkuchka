<template>
  <UForm
    :state="state"
    :schema="productCreateSchema"
    class="space-y-6"
    @submit="onSubmit"
  >
    <section class="space-y-4">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-muted">Основное</h2>

      <UFormField name="name" label="Название">
        <UInput
          v-model="state.name"
          placeholder="Например, Наушники беспроводные"
          class="w-full"
        />
      </UFormField>

      <UFormField name="categoryId" label="Категория">
        <USelect
          v-model="state.categoryId"
          :items="categoryItems"
          :loading="categoriesPending"
          placeholder="Выберите категорию"
          class="w-full"
        />
      </UFormField>

      <UFormField name="description" label="Описание" description="Необязательно">
        <UTextarea v-model="state.description" :rows="4" class="w-full" />
      </UFormField>
    </section>

    <section class="space-y-4">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-muted">Цены и наличие</h2>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <UFormField name="price" label="Цена, ₽">
          <UInputNumber
            v-model="state.price"
            :min="0"
            :step="1"
            class="w-full"
          />
        </UFormField>

        <UFormField name="oldPrice" label="Старая цена, ₽" help="Для показа скидки">
          <UInputNumber
            v-model="state.oldPrice"
            :min="0"
            :step="1"
            class="w-full"
          />
        </UFormField>

        <UFormField name="stock" label="Остаток, шт.">
          <UInputNumber
            v-model="state.stock"
            :min="0"
            :step="1"
            class="w-full"
          />
        </UFormField>
      </div>
    </section>

    <section class="space-y-4">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-muted">Изображения</h2>

      <UFormField :description="`Ссылки до ${MAX_PRODUCT_IMAGES} штук; первое — главное`">
        <div class="w-full space-y-2">
          <div
            v-for="(image, index) in state.images"
            :key="index"
            class="flex items-start gap-2"
          >
            <UFormField :name="`images.${index}`" class="flex-1">
              <UInput
                v-model="state.images[index]"
                placeholder="https://… или /images/products/…"
                class="w-full"
              />
            </UFormField>
            <img
              v-if="image"
              :src="image"
              alt=""
              class="h-9 w-9 shrink-0 rounded-md object-cover"
              @error="($event.target as HTMLImageElement).style.visibility = 'hidden'"
            />
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              aria-label="Убрать изображение"
              @click="removeImage(index)"
            />
          </div>

          <UButton
            v-if="state.images.length < MAX_PRODUCT_IMAGES"
            color="neutral"
            variant="subtle"
            icon="i-heroicons-plus"
            size="sm"
            @click="addImage"
          >
            Добавить изображение
          </UButton>
          <p v-else class="text-xs text-muted">Достигнут лимит в {{ MAX_PRODUCT_IMAGES }} изображений</p>
        </div>
      </UFormField>
    </section>

    <section class="space-y-4">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-muted">Публикация</h2>

      <UFormField
        name="isActive"
        label="Показывать в каталоге"
        description="Товар будет виден покупателям в каталоге"
      >
        <USwitch v-model="state.isActive" />
      </UFormField>
    </section>

    <div class="flex items-center gap-3 pt-2">
      <UButton type="submit" :loading="submitting">{{ submitLabel }}</UButton>
      <UButton color="neutral" variant="ghost" @click="emit('cancel')">Отмена</UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';
  import { MAX_PRODUCT_IMAGES, productCreateSchema, type ProductCreate, type SellerProductDetail, type Category } from '#shared/schemas/product.schema';

  const props = withDefaults(defineProps<{
    product?: SellerProductDetail | null;
    submitLabel?: string;
    submitting?: boolean;
  }>(), {
    product: null,
    submitLabel: 'Сохранить',
    submitting: false,
  });

  const emit = defineEmits<{
    submit: [payload: ProductCreate];
    cancel: [];
    dirty: [value: boolean];
  }>();

  const requestFetch = useRequestFetch();

  const { data: categories, pending: categoriesPending } = await useAsyncData(
    'seller-product-categories',
    () => requestFetch<Category[]>('/api/categories'),
    { default: () => [] as Category[] },
  );

  const categoryItems = computed(() => (categories.value ?? []).map((c) => ({ label: c.name, value: c.id })));

  interface ProductFormState {
    name: string;
    categoryId: string;
    description: string;
    price: number | undefined;
    oldPrice: number | undefined;
    stock: number;
    images: string[];
    isActive: boolean;
  }

  const state = reactive<ProductFormState>({
    name: props.product?.name ?? '',
    categoryId: props.product?.categoryId ?? '',
    description: props.product?.description ?? '',
    price: props.product?.price ?? undefined,
    oldPrice: props.product?.oldPrice ?? undefined,
    stock: props.product?.stock ?? 0,
    images: props.product?.images.length ? [...props.product.images] : [''],
    isActive: props.product?.isActive ?? true,
  });

  const snapshot = ref(JSON.stringify(state));
  const isDirty = computed(() => JSON.stringify(state) !== snapshot.value);

  watch(isDirty, (value) => emit('dirty', value));

  function addImage() {
    if (state.images.length >= MAX_PRODUCT_IMAGES) return;
    state.images.push('');
  }

  function removeImage(index: number) {
    state.images.splice(index, 1);
  }

  function onSubmit(event: FormSubmitEvent<ProductCreate>) {
    emit('submit', {
      ...event.data,
      images: event.data.images.map((url) => url.trim()).filter(Boolean),
      description: event.data.description?.trim() || undefined,
      oldPrice: event.data.oldPrice ?? null,
    });
  }

  function beforeUnload(event: BeforeUnloadEvent) {
    if (!isDirty.value) return;
    event.preventDefault();
  }

  onMounted(() => window.addEventListener('beforeunload', beforeUnload));
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));
</script>
