<template>
  <div v-if="product" class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div class="mb-6">
      <UBreadcrumb :items="breadcrumbs" />
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <ProductGallery :images="product.images ?? []" :alt="product.name" />

      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-semibold sm:text-3xl">{{ product.name }}</h1>
          <UBadge color="neutral" variant="subtle" class="mt-2">{{ product.category.name }}</UBadge>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <span class="text-2xl font-semibold">{{ formatPrice(product.price) }}</span>
          <del v-if="product.oldPrice" class="text-muted">{{ formatPrice(product.oldPrice) }}</del>
          <UBadge v-if="product.stock === 0" color="error" variant="subtle">Нет в наличии</UBadge>
          <UBadge v-else-if="product.stock! < 5" color="warning" variant="subtle">
            Осталось {{ product.stock }}
          </UBadge>
          <UBadge v-else color="success" variant="subtle">В наличии</UBadge>
        </div>

        <div v-if="product.rating" class="flex items-center gap-1 text-sm text-muted">
          <UIcon v-for="i in stars.full" :key="'f' + i" name="i-heroicons-star-solid" class="h-4 w-4 text-amber-400" />
          <span v-if="stars.partial" class="relative h-4 w-4">
            <UIcon name="i-heroicons-star-solid" class="h-4 w-4 text-gray-300 dark:text-gray-600" />
            <span class="absolute left-0 top-0 h-full overflow-hidden" :style="{ width: `${stars.partialPercent}%` }">
              <UIcon name="i-heroicons-star-solid" class="h-4 w-4 text-amber-400" />
            </span>
          </span>
          <UIcon v-for="i in stars.empty" :key="'e' + i" name="i-heroicons-star-solid" class="h-4 w-4 text-gray-300 dark:text-gray-600" />
          {{ product.rating.toFixed(1) }}
        </div>

        <div v-if="product.stock! > 0" class="flex items-center gap-3">
          <UInputNumber
            v-model="quantity"
            :min="1"
            :max="product.stock!"
            class="w-28"
          />
          <UButton color="primary" variant="solid" @click="addToCart">
            В корзину
          </UButton>
        </div>

        <p class="max-w-prose text-muted">{{ product.description }}</p>

        <UCard :ui="{ body: 'flex items-center gap-4' }">
          <UAvatar :alt="product.seller?.name" />
          <div>
            <p class="font-medium">{{ product.seller?.name }}</p>
          </div>
          <ULink class="ml-auto text-sm text-primary" :to="`/sellers/${product.seller?.slug}`">
            Товары продавца
          </ULink>
        </UCard>

        <UAccordion :items="deliveryItems" color="neutral" variant="soft" />
      </div>
    </div>

    <section v-if="related.length > 0" class="mt-16">
      <h2 class="mb-6 text-xl font-semibold">Похожие товары</h2>
      <div class="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        <ProductCard v-for="item in related" :key="item.id" :product="item" />
      </div>
    </section>
  </div>

  <div v-else class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <USkeleton class="aspect-[3/4] rounded-lg" />
      <div class="space-y-4">
        <USkeleton class="h-8 w-2/3" />
        <USkeleton class="h-6 w-24" />
        <USkeleton class="h-6 w-32" />
        <USkeleton class="h-10 w-full max-w-xs" />
        <USkeleton class="h-20 w-full" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Product } from '#shared/schemas/product.schema';
  import type { CatalogResponse } from '#shared/schemas/catalog.schema';

  const route = useRoute();

  const { data: product, error } = await useAsyncData(
    'product-' + route.params.slug,
    () => $fetch<Product>(`/api/products/${route.params.slug}`),
  );
  if (error.value) throw createError({ statusCode: 404, statusMessage: 'Товар не найден' });

  const { data: relatedData } = await useAsyncData(
    'related-' + route.params.slug,
    () => $fetch<CatalogResponse>('/api/products', {
      query: { categoryId: product.value!.category.id, perPage: 5 },
    }),
    { watch: [() => product.value?.category.id] },
  );

  const breadcrumbs = computed(() => [
    { label: 'Каталог', to: '/products' },
    { label: product.value!.category.name, to: `/categories/${product.value!.category.slug}` },
    { label: product.value!.name },
  ]);

  const related = computed(
    () => relatedData.value?.products.filter((p) => p.id !== product.value!.id).slice(0, 4) ?? [],
  );

  const quantity = ref(1);
  const toast = useToast();

  function addToCart() {
    // Заглушка: реальное поведение корзины — бэклог (task 29–30)
    toast.add({
      title: 'Добавлено в корзину',
      description: product.value!.name,
      color: 'success',
      actions: [{ label: 'Перейти в корзину', onClick: () => navigateTo('/cart') }],
    });
  }

  const stars = computed(() => {
    const rating = Math.min(product.value!.rating ?? 0, 5);
    const full = Math.floor(rating);
    const fraction = rating - full;
    return {
      full,
      partial: fraction > 0,
      partialPercent: fraction * 100,
      empty: Math.max(0, 5 - full - (fraction > 0 ? 1 : 0)),
    };
  });

  const formatPrice = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

  const deliveryItems = [
    { label: 'Доставка', content: 'Доставка к вашему городу за 2–5 дней. Способы и сроки рассчитываются при оформлении.' },
    { label: 'Возврат', content: 'Возврат товара в течение 14 дней при сохранении товарного вида.' },
    { label: 'Оплата', content: 'Онлайн-оплата банковской картой или при получении.' },
  ];

  useSeoMeta({
    title: () => `${product.value!.name} — Толкучка`,
    description: () => product.value!.description,
    ogType: () => `website`,
    ogTitle: () => product.value!.name,
    ogDescription: () => product.value!.description,
    ogImage: () => product.value!.imageUrl ?? product.value!.images?.[0] ?? undefined,
  });
</script>