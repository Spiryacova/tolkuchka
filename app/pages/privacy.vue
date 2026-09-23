<template>
  <div class="mx-auto w-full max-w-3xl space-y-8 py-8">
    <section>
      <h1 class="text-2xl font-bold">Политика конфиденциальности</h1>
      <p class="mt-1 text-sm text-muted">Как Толкучка хранит и использует ваши данные.</p>
    </section>
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Какие данные храним</h2>
      <p class="text-sm leading-6">
        Профиль (имя, email) и сведения, необходимые для оформления и доставки заказов.
        Пароль хранится только в зашифрованном виде.
      </p>
    </section>
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Зачем используем</h2>
      <p class="text-sm leading-6">
        Для оформления заказов, доступа к личному кабинету и связи по сделке.
        Данные не передаются третьим лицам, кроме случаев, предусмотренных законом.
      </p>
    </section>
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Кто имеет доступ</h2>
      <p class="text-sm leading-6">
        Доступ к данным есть только у вас. Поддержка открывает их лишь при вашем обращении,
        а продавец видит минимум, необходимый для выполнения заказа.
      </p>
    </section>
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Ваши права</h2>
      <p class="text-sm leading-6">
        Вы можете изменить данные в настройках аккаунта или запросить их удаление.
        Напишите: <ULink to="mailto:hello@tolkuchka.shop" class="text-primary">hello@tolkuchka.shop</ULink>
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
  useSeoMeta({
    title: 'Политика конфиденциальности',
    description: 'Как Толкучка хранит и защищает данные покупателей и продавцов.',
    ogTitle: 'Политика конфиденциальности - Толкучка',
    ogDescription: 'Данные защищены: только то, что нужно для заказов.',
  });
</script>
