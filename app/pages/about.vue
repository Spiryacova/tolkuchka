<template>
  <div class="mx-auto w-full max-w-3xl space-y-8 py-8">
    <section>
      <h1 class="text-2xl font-bold">О Толкучке</h1>
      <p class="mt-1 text-sm text-muted">Мультивендорная площадка для частных продавцов и покупателей.</p>
    </section>
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Что это</h2>
      <p class="text-sm leading-6">
        Толкучка - мультивендорная площадка: частные продавцы размещают объявления,
        а покупатели находят и выкупают товары напрямую, без посредников и витрин магазинов.
      </p>
    </section>
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Как работает</h2>
      <ul class="list-disc space-y-1 pl-5 text-sm leading-6">
        <li>Продавец публикует товары и получает заявки — без наценок и посредников.</li>
        <li>Покупатель сравнивает цены продавцов и покупает напрямую — дешевле, чем в магазинах.</li>
        <li>Товары, заказы и статистика — в одном личном кабинете продавца.</li>
      </ul>
    </section>
    <section class="flex flex-col items-center gap-3 rounded-xl border border-default p-8 text-center">
      <h2 class="text-lg font-semibold">Продавайте на Толкучке</h2>
      <p class="max-w-md text-sm text-muted">
        Разместите первый товар и получайте заказы напрямую от покупателей.
      </p>
      <div class="mt-1 flex gap-3">
        <UButton to="/auth/register" color="primary" variant="solid">Стать продавцом</UButton>
        <UButton to="/products" color="neutral" variant="ghost">Смотреть каталог</UButton>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  useSeoMeta({
    title: 'О Толкучке - мультивендорная площадка',
    description: 'Толкучка - онлайн-площадка: покупка и продажа товаров напрямую у частных продавцов.',
    ogTitle: 'О Толкучке',
    ogDescription: 'Покупайте и продавайте без посредников.',
  });
</script>
