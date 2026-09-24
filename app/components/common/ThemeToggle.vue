<template>
  <UButton
    color="neutral"
    variant="ghost"
    size="sm"
    aria-label="Переключить тему"
    @click="toggleTheme"
  >
    <template #leading>
      <UIcon name="i-heroicons-moon" class="hidden dark:inline-block size-4" />
      <UIcon name="i-heroicons-sun" class="dark:hidden size-4" />
    </template>
  </UButton>
</template>

<script setup lang="ts">
  const colorMode = useColorMode();

  const isDark = computed(() => colorMode.value === 'dark');

  function toggleTheme() {
    colorMode.preference = isDark.value ? 'light' : 'dark';
  }
</script>
