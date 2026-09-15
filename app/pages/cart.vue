<template>
  <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <template v-if="isLoading">
      <USkeleton class="mb-8 h-9 w-40" />
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div class="flex flex-col gap-4">
          <USkeleton v-for="i in 2" :key="i" class="h-32 rounded-lg" />
        </div>
        <USkeleton class="h-64 rounded-lg" />
      </div>
    </template>

    <template v-else-if="lines.length === 0">
      <UEmpty
        icon="i-heroicons-shopping-cart"
        title="Корзина пуста"
        description="Вы ещё ничего не добавили — самое время подобрать товар на Толкучке"
        :actions="[
          { label: 'Перейти в каталог', color: 'primary', variant: 'solid', to: '/products' },
        ]"
        class="mx-auto max-w-md"
      />
    </template>

    <template v-else>
      <header class="mb-8 flex items-baseline justify-between gap-4">
        <h1 class="text-2xl font-semibold sm:text-3xl">Корзина</h1>
        <span class="text-sm text-muted">{{ totalQty }} шт.</span>
      </header>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div class="flex flex-col gap-4">
          <CartItem
            v-for="line in lines"
            :key="line.id"
            :line="line"
            @update-qty="onUpdateQty(line.id, $event)"
            @remove="onRemove(line)"
          />
        </div>

        <CartSummary :lines="available" :unavailable-count="unavailable.length" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { CartItem } from '#shared/schemas/cart.schema';

  const cart = useCartStore();
  const { items, isLoading } = storeToRefs(cart);
  const { status } = useAuth();

  onMounted(() => cart.load());
  watch(() => status.value, () => cart.load());

  const lines = computed(() => items.value);

  const available = computed(() =>
    lines.value.filter((line) => (line.product.stock ?? 0) > 0),
  );
  const unavailable = computed(() =>
    lines.value.filter((line) => (line.product.stock ?? 0) === 0),
  );
  const totalQty = computed(() =>
    available.value.reduce((sum, line) => sum + line.quantity, 0),
  );

  const toast = useToast();

  async function onUpdateQty(id: string, qty: number) {
    const line = lines.value.find((item) => item.id === id);
    const max = line?.product.stock ?? qty;
    const next = Math.min(Math.max(1, qty), max);
    await cart.updateQty(id, next);
  }

  async function onRemove(line: CartItem) {
    await cart.remove(line.id);
    toast.add({
      title: 'Товар удалён',
      color: 'warning',
      actions: [
        {
          label: 'Вернуть',
          onClick: () => cart.addToCart(line.product.id, line.quantity),
        },
      ],
    });
  }

  useSeoMeta({
    title: 'Корзина — Толкучка',
    description: 'Выбранные товары на Толкучке',
    robots: 'noindex',
  });
</script>