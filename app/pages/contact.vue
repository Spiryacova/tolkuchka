<template>
  <div class="mx-auto w-full max-w-3xl space-y-8 py-8">
    <section>
      <h1 class="text-2xl font-bold">Контакты</h1>
      <p class="mt-1 text-sm text-muted">Свяжитесь с нами по вопросам площадки.</p>
    </section>
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Для покупателей и продавцов</h2>
      <p class="text-sm leading-6">
        Помогаем с регистрацией, оформлением заказа и работой кабинета продавца.
      </p>
      <UButton to="mailto:hello@tolkuchka.shop" color="primary" variant="solid">
        Написать на hello@tolkuchka.shop
      </UButton>
      <p class="text-sm text-muted">Отвечаем в течение одного рабочего дня.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
  useSeoMeta({
    title: 'Контакты',
    description: 'Свяжитесь с командой Толкучки: почта и ответы на вопросы о площадке.',
    ogTitle: 'Контакты - Толкучка',
    ogDescription: 'Обратная связь по проекту Толкучка.',
  });
</script>
