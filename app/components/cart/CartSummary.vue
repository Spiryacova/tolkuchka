<template>
  <UCard class="lg:sticky lg:top-8">
    <div class="space-y-3 sm:space-y-4">
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted">Подытог</span>
        <span class="font-medium">{{ formatPrice(subtotal) }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted">Доставка</span>
        <span class="text-muted">рассчитывается при оформлении</span>
      </div>

      <USeparator />

      <div class="flex items-baseline justify-between">
        <span class="text-lg font-semibold">Итого</span>
        <span class="text-2xl font-semibold">{{ formatPrice(subtotal) }}</span>
      </div>

      <div class="flex flex-col gap-2 pt-2">
        <UButton
          color="primary"
          variant="solid"
          class="w-full"
          to="/checkout"
          :disabled="checkoutDisabled"
        >
          Оформить заказ
        </UButton>
        <UButton color="neutral" variant="ghost" class="w-full" to="/products">
          Продолжить покупки
        </UButton>
        <p v-if="unavailableCount > 0" class="text-center text-xs text-muted">
          Уберите позиции «Нет в наличии», чтобы оформить заказ
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
  import type { CartItem } from '#shared/schemas/cart.schema';

  const props = defineProps<{
    lines: CartItem[];
    unavailableCount: number;
  }>();

  const subtotal = computed(() =>
    props.lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
  );
  const checkoutDisabled = computed(
    () => props.lines.length === 0 || props.unavailableCount > 0,
  );

  const formatPrice = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;
</script>