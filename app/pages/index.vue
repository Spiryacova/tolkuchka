<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <section class="py-6">
      <h1 class="text-lg font-semibold sm:text-xl">Толкучка - товары от независимых продавцов</h1>
      <p class="mt-0.5 text-sm text-muted">Покупайте напрямую у частных продавцов — электроника, дом, одежда, книги и не только.</p>
    </section>

    <!-- Промо-карусель (товары со скидками. Добавить позже — рекламные места) -->
    <section class="rounded-xl overflow-hidden border border-default">
      <UCarousel
        :items="promoSlides"
        :ui="{ item: 'basis-full' }"
        loop
        arrows
        dots
        :autoplay="{ delay: 5000, stopOnInteraction: false }"
      >
        <template #default="{ item }">
          <ULink :to="`/products/${item.slug}`" class="relative block h-40 sm:h-80">
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.name"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800/60">
              <UIcon name="i-heroicons-shopping-bag" class="h-10 w-10 text-primary/30" />
            </div>
            <div class="absolute inset-0 bg-linear-to-t from-black/70 to-black/10" />
            <div class="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <UBadge color="error" variant="solid">−{{ discountOf(item) }}%</UBadge>
              <h2 class="mt-2 text-lg font-semibold text-white sm:text-xl">{{ item.name }}</h2>
              <p class="mt-1 text-sm text-white sm:text-base">
                <del class="text-white/70">{{ formatPrice(item.oldPrice!) }}</del>
                <span class="ml-2 font-semibold">{{ formatPrice(item.price) }}</span>
              </p>
            </div>
          </ULink>
        </template>
      </UCarousel>
    </section>

    <section class="py-8">
      <div class="mb-4 flex items-baseline justify-between">
        <h2 class="text-xl font-semibold">Категории</h2>
        <ULink to="/products" class="text-sm text-primary">Все категории →</ULink>
      </div>
      <div v-if="catPending" class="flex gap-3 overflow-hidden">
        <USkeleton v-for="n in 6" :key="n" class="h-24 w-28 flex-none rounded-lg" />
      </div>
      <div v-else class="sm:px-14">
        <UCarousel
          ref="catCarousel"
          :items="categories"
          :ui="{ item: 'basis-1/3 sm:basis-1/4 lg:basis-1/6 py-2' }"
          :arrows="canPrev || canNext"
        >
          <template #default="{ item }">
            <ULink :to="`/categories/${item.slug}`" class="block">
              <UCard :ui="{ root: 'mx-2 h-28', body: 'flex h-full flex-col items-center justify-center gap-1.5 p-3 text-center' }">
                <UIcon :name="categoryIcons[item.slug] ?? 'i-heroicons-squares-2x2'" class="h-7 w-7 text-primary" />
                <span class="truncate text-sm font-medium">{{ item.name }}</span>
              </UCard>
            </ULink>
          </template>
        </UCarousel>
      </div>
    </section>

    <ProductSection title="Популярные товары" :items="popular" :loading="popularPending" />

    <ProductSection title="Со скидкой" :items="discountItems" :loading="dealsPending" />

    <ProductSection title="Новинки" :items="newItemsDedup" :loading="newPending" />

    <!-- Почему Толкучка -->
    <section class="py-12">
      <h2 class="mb-6 text-xl font-semibold">Почему Толкучка</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <UCard v-for="b in benefits" :key="b.title" :ui="{ body: 'space-y-2' }">
          <UIcon :name="b.icon" class="h-8 w-8 text-primary" />
          <h3 class="font-semibold">{{ b.title }}</h3>
          <p class="text-sm text-muted">{{ b.text }}</p>
        </UCard>
      </div>
    </section>

    <!-- Баннер продавца -->
    <section class="pb-16">
      <UCard :ui="{ body: 'flex flex-col items-center gap-3 p-10 text-center' }">
        <h2 class="text-xl font-semibold">Продавайте на Толкучке</h2>
        <p class="max-w-md text-sm text-muted">
          Товары, заказы и статистика — в одном кабинете. Начните с регистрации и первого объявления.
        </p>
        <div class="mt-2 flex gap-3">
          <UButton
            to="/auth/register"
            color="primary"
            variant="solid"
          >
              Стать продавцом
          </UButton>
          <UButton
            to="/products"
            color="neutral"
            variant="ghost"
          >
            Смотреть каталог
          </UButton>
        </div>
      </UCard>
    </section>
  </div>
</template>

<script setup lang="ts">
  import type { Category, Product } from '#shared/schemas/product.schema';
  import type { CatalogResponse } from '#shared/schemas/catalog.schema';
  import type { EmblaCarouselType } from 'embla-carousel';

  const { data: dealsData, pending: dealsPending } = await useAsyncData('home-deals', () =>
    $fetch<CatalogResponse>('/api/products/promo'),
  );

  const { data: popularData, pending: popularPending } = await useAsyncData('home-popular', () =>
    $fetch<CatalogResponse>('/api/products', { query: { perPage: 8, sort: 'rating' } }),
  );

  const { data: newData, pending: newPending } = await useAsyncData('home-new', () =>
    $fetch<CatalogResponse>('/api/products', { query: { perPage: 8 } }),
  );

  const { data: categories, pending: catPending } = await useAsyncData('home-categories', () =>
    $fetch<Category[]>('/api/categories'),
  );

  const popular = computed<Product[]>(() => popularData.value?.products ?? []);
  const popularIds = computed(() => new Set(popular.value.map((p) => p.id)));
  
  const deals = computed<Product[]>(() => dealsData.value?.products ?? []);
  const promoSlides = computed<Product[]>(() => deals.value.slice(0, 3));
  const discountItems = computed<Product[]>(() =>
    deals.value.slice(3).filter((p) => !popularIds.value.has(p.id)).slice(0, 8),
  );

  const newItems = computed<Product[]>(() => newData.value?.products ?? []);
  const shownIds = computed(() =>
    new Set([...popular.value, ...discountItems.value].map((p) => p.id)),
  );
  const newItemsDedup = computed<Product[]>(() =>
    newItems.value.filter((p) => !shownIds.value.has(p.id)),
  );

  const catCarousel = ref<{ emblaApi?: EmblaCarouselType } | undefined>();
  const canPrev = ref(true);
  const canNext = ref(true);

  watch(
    () => catCarousel.value?.emblaApi,
    (api) => {
      if (!api) return;
      const sync = () => {
        canPrev.value = api.canScrollPrev();
        canNext.value = api.canScrollNext();
      };
      sync();
      api.on('select', sync).on('reInit', sync);
      return () => {
        api.off('select', sync).off('reInit', sync);
      };
    },
    { immediate: true },
  );

  const discountOf = (p: Product) => (p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);

  const categoryIcons: Record<string, string> = {
    electronics: 'i-heroicons-computer-desktop',
    home: 'i-heroicons-home',
    clothing: 'i-heroicons-tag',
    sport: 'i-heroicons-fire',
    books: 'i-heroicons-book-open',
    toys: 'i-heroicons-gift',
  };

  const benefits = [
    { icon: 'i-heroicons-truck', title: 'Доставка по всей стране', text: 'Продавцы отправляют заказы в любой город, статус виден в личном кабинете.' },
    { icon: 'i-heroicons-shield-check', title: 'Прямые продавцы', text: 'Покупаете напрямую у частных продавцов — без посредников и витрин магазинов.' },
    { icon: 'i-heroicons-arrow-path', title: 'Возврат товаров', text: 'Если товар не подошёл — возврат при сохранённом товарном виде.' },
  ];

  useSeoMeta({
    title: 'Толкучка - покупайте и продавайте у частных продавцов',
    description:
      'Мультивендорная площадка: электроника, дом и кухня, одежда, спорт, книги, игрушки от независимых продавцов.',
    ogTitle: 'Толкучка - покупайте и продавайте у частных продавцов',
    ogDescription: 'Найдите нужные товары или начните продавать на Толкучке.',
  });
</script>

