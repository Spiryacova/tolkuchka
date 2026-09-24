<template>
  <div class="flex min-h-screen flex-col bg-page text-content">
    <header class="flex justify-center py-8">
      <ULink to="/" class="flex items-center gap-2 text-lg font-bold">
        <UIcon name="i-heroicons-shopping-bag" class="text-primary" />
        <span>Толкучка</span>
      </ULink>
    </header>

    <main class="mx-auto w-full max-w-md flex-1 px-4">
      <slot />
    </main>

    <footer class="py-6">
      <nav class="flex justify-center gap-6 text-sm text-dimmed">
        <ULink to="/privacy">Приватность</ULink>
        <ULink to="/terms">Условия</ULink>
        <ULink to="/contact">Контакты</ULink>
      </nav>
    </footer>
  </div>
</template>
