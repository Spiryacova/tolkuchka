<template>
  <div class="py-12 sm:py-16">
    <div class="mx-auto w-full max-w-md">
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-bold">Создайте аккаунт</h1>
        <p class="mt-2 text-sm text-muted">Бесплатно, займёт минуту</p>
      </div>

      <UCard>
        <UForm :schema="registerSchema" :state="state" class="space-y-6" @submit="onSubmit">
          <UFormField label="Как вас зовут?" name="name">
            <UInput
              v-model="state.name"
              placeholder="Иван Иванов"
              autocomplete="name"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Email" name="email">
            <UInput
              v-model="state.email"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Пароль" name="password">
            <UInput
              v-model="state.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  aria-label="Показать пароль"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormField>

          <UFormField label="Подтвердите пароль" name="confirm">
            <UInput
              v-model="state.confirm"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Я регистрируюсь как">
            <URadioGroup v-model="state.role" :items="roleItems" class="w-full" />
            <p v-if="isSeller" class="mt-2 text-sm text-muted">
              Вы сможете размещать товары и управлять магазином. Ваши данные защищены, без скрытых
              комиссий.
            </p>
          </UFormField>

          <div class="space-y-3">
            <UButton type="submit" color="primary" variant="solid" size="lg" block>
              {{ ctaLabel }}
            </UButton>
            <p class="text-center text-xs text-muted">
              Регистрация бесплатна. Ваши данные защищены.
            </p>
          </div>
        </UForm>
      </UCard>

      <p class="mt-6 text-center text-sm text-muted">
        Уже есть аккаунт?
        <ULink to="/auth/login" class="font-medium text-primary"> Войти </ULink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';
  import { registerSchema, type RegisterSchema } from '#shared/schemas/auth.schema';
  import type { PublicUser } from '#shared/schemas/user.schema';

  definePageMeta({
    layout: 'auth',
    auth: { unauthenticatedOnly: true, navigateAuthenticatedTo: '/' },
  });

  useSeoMeta({ title: 'Регистрация — Толкучка', robots: 'noindex' });

  const route = useRoute();
  const { signIn } = useAuth();
  const cart = useCartStore();

  const state = reactive<RegisterSchema>({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: route.query.role === 'seller' ? 'seller' : 'buyer',
  });

  const toast = useToast();
  async function onSubmit(event: FormSubmitEvent<RegisterSchema>) {
    const { confirm: _confirm, ...payload } = event.data;
    try {
      // 1 Создаём пользователя.
      const { user } = await $fetch<{ user: PublicUser }>('/api/auth/register', {
        method: 'POST',
        body: payload,
      });

      // 2 Входим только что созданным пользователем — теперь сессию выдаёт next-auth.
      const res = await signIn('credentials', {
        email: payload.email,
        password: payload.password,
        redirect: false,
      });
      if (res?.error) throw new Error(res.error);

      await cart.mergeGuestCart();

      toast.add({
        title: 'Успешно',
        description: 'Регистрация прошла успешно',
        color: 'success',
      });
      await navigateTo(user.role === 'seller' ? '/dashboard' : '/', { replace: true });
    } catch (error) {
      toast.add({
        title: 'Не удалось зарегистрироваться',
        description: apiErrorMessage(error),
        color: 'error',
      });
      console.error(error);
    }
  }

  const showPassword = ref(false);
  const isSeller = computed(() => state.role === 'seller');

  const ctaLabel = computed(() => (isSeller.value ? 'Стать продавцом' : 'Создать аккаунт'));

  const roleItems = [
    { label: 'Покупатель', value: 'buyer' },
    { label: 'Продавец', value: 'seller' },
  ];
</script>
