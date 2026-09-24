<template>
  <section class="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
    <UIcon name="i-heroicons-question-mark-circle" class="size-12 text-dimmed" />
    <h1 class="text-2xl font-bold">Страница не найдена</h1>
    <p class="max-w-md text-sm text-muted">
      Похоже, такого адреса нет — ссылка устарела или в ней опечатка.
    </p>
    <div class="mt-4 flex gap-2">
      <UButton to="/products">Перейти в каталог</UButton>
      <UButton color="neutral" variant="ghost" to="/">На главную</UButton>
    </div>
  </section>
</template>

<script setup lang="ts">
  // Catch-all иначе отвечает 200 — поисковики помечают такие страницы как soft-404.
  // Статус ставим только на сервере: на клиенте заголовки уже отправлены.
  if (import.meta.server) {
    const event = useRequestEvent();
    if (event) setResponseStatus(event, 404);
  }

  useSeoMeta({
    title: 'Страница не найдена',
    robots: 'noindex',
  });
</script>
