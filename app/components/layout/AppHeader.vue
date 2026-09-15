<template>
  <UHeader
    title="Толкучка"
    to="/products"
    :toggle="false"
    :ui="{
      left: 'lg:flex-none',
      right: 'lg:flex-none',
      center: 'flex-1',
    }"
  >
    <template #left>
      <div class="flex items-center gap-2">
        <ULink to="/products" class="flex items-center gap-2 text-lg font-bold">
          <UIcon name="i-heroicons-shopping-bag" class="text-primary" />
          <span>Толкучка</span>
        </ULink>
        <UDropdownMenu :items="categoryItems">
          <UButton color="neutral" variant="soft">
            <span class="inline-flex items-center gap-1.5">
              <UIcon name="i-heroicons-squares-2x2" />
              <span class="hidden sm:inline">Каталог</span>
              <UIcon name="i-heroicons-chevron-down-16" class="hidden sm:inline" />
            </span>
          </UButton>
        </UDropdownMenu>
      </div>
    </template>

    <div class="flex min-w-0 flex-1 items-center justify-center px-4">
      <AppSearch />
    </div>

    <template #right>
      <div class="flex items-center gap-2">
        <template v-if="status === 'authenticated'">
          <UDropdownMenu :items="accountItems">
            <UButton color="neutral" variant="ghost" class="gap-1.5">
              <UAvatar
                :src="user?.avatarUrl ?? undefined"
                :alt="user?.name ?? 'Пользователь'"
                size="sm"
              />
              <span class="hidden sm:inline">{{ user?.name }}</span>
              <UIcon name="i-heroicons-chevron-down-16" class="hidden sm:inline" />
            </UButton>
          </UDropdownMenu>
        </template>
        <template v-else>
          <UButton to="/auth/login" color="neutral" variant="ghost" size="sm">
            <span class="hidden sm:inline">Войти</span>
            <UIcon name="i-heroicons-user" class="sm:hidden" />
          </UButton>
        </template>
        <UButton
          v-if="user?.role === 'buyer'"
          to="/seller"
          color="primary"
          variant="solid"
          size="sm"
          class="hidden sm:inline-flex"
        >
          Стать продавцом
        </UButton>
        <ThemeToggle />
      </div>
    </template>

    <template #bottom>
      <div class="border-t border-default px-4 py-2 sm:px-6 lg:hidden">
        <div class="flex items-center gap-2">
          <AppSearch />
        </div>
      </div>
    </template>
  </UHeader>
</template>

<script setup lang="ts">
  const store = useProductStore();
  const { data: session, status, signOut } = useAuth();
  const user = computed(() => session.value?.user);

  const accountItems = computed(() => [
    {
      label: 'Настройки',
      icon: 'i-heroicons-cog-6-tooth',
      to: '/account/settings',
    },
    {
      label: 'Выйти',
      icon: 'i-heroicons-arrow-right-start-on-rectangle',
      onSelect: () => signOut(),
    },
  ]);

  const categoryItems = computed(() =>
    store.categories.map((c) => ({ label: c.name, to: `/categories/${c.slug}` })),
  );

  await store.fetchCategories();
</script>
