<template>
  <UApp>
    <section class="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p class="text-sm text-dimmed">{{ error.status }}</p>
      <h1 class="text-2xl font-bold">Что-то пошло не так</h1>
      <p class="max-w-md text-sm text-muted">
        Попробуйте обновить страницу — если не поможет, вернитесь на главную.
      </p>
      <div class="mt-4 flex gap-2">
        <UButton @click="handleReload">Обновить страницу</UButton>
        <UButton color="neutral" variant="ghost" @click="clearError({ redirect: '/' })">
          На главную
        </UButton>
      </div>
    </section>
  </UApp>
</template>

<script setup lang="ts">
  import type { NuxtError } from '#app';

  const props = defineProps<{ error: NuxtError }>();

  console.error('[app:error]', props.error);

  useSeoMeta({
    title: 'Ошибка',
    robots: 'noindex',
  });

  function handleReload() {
    clearError();
    window.location.reload();
  }
</script>
