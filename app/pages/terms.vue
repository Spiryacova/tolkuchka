<template>
  <div class="mx-auto w-full max-w-3xl space-y-8 py-8">
    <section>
      <h1 class="text-2xl font-bold">Условия использования</h1>
      <p class="mt-1 text-sm text-muted">Правила размещения и покупки товаров на Толкучке.</p>
    </section>
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Обязанности продавца</h2>
      <p class="text-sm leading-6">
        Продавец размещает достоверные описания товаров, поддерживает актуальные цены и наличие
        и исполняет заказы в оговорённые сроки. Недостоверные данные ведут к ограничению доступа
        к площадке.
      </p>
    </section>
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Обязанности покупателя</h2>
      <p class="text-sm leading-6">
        Покупатель указывает правдивые данные при оформлении и выкупе заказа: имя, контакты
        и адрес доставки. Площадка не несёт ответственности за ошибки, допущенные при вводе.
      </p>
    </section>
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Возвраты</h2>
      <p class="text-sm leading-6">
        Товар можно вернуть, если он не подошёл и сохранил товарный вид. Продавец обязан
        принять возврат и вернуть оплату согласно правилам сделки.
      </p>
    </section>
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Запрещено</h2>
      <p class="text-sm leading-6">
        Публикация чужих материалов без разрешения, контента, нарушающего закон, а также попытки
        обхода правил площадки и вмешательства в её работу.
      </p>
    </section>
    <p class="text-sm text-muted">Правила могут обновляться — актуальная редакция всегда на этой странице.</p>
  </div>
</template>

<script setup lang="ts">
  useSeoMeta({
    title: 'Условия использования',
    description: 'Правила размещения и покупки товаров на Толкучке.',
    ogTitle: 'Условия использования - Толкучка',
    ogDescription: 'Правила площадки для продавцов и покупателей.',
  });
</script>
