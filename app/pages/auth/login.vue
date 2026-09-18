<template>
  <div class="py-12 sm:py-16">
    <div class="mx-auto w-full max-w-md">
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-bold">Вход</h1>
        <p class="mt-2 text-sm text-muted">Продолжите с того, на чём остановились</p>
      </div>

      <UCard>
        <AuthLoginForm @submitted="onSubmitted" />
      </UCard>

      <p class="mt-6 text-center text-sm text-muted">
        Нет аккаунта?
        <ULink to="/auth/register" class="font-medium text-primary"> Зарегистрироваться </ULink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { LoginSchema } from '#shared/schemas/auth.schema';

  definePageMeta({
    layout: 'auth',
    auth: { unauthenticatedOnly: true, navigateAuthenticatedTo: '/' },
  });

  useSeoMeta({ title: 'Вход — Толкучка', robots: 'noindex' });

  const route = useRoute();
  const toast = useToast();
  const { signIn } = useAuth();
  const cart = useCartStore();

  // Куда вернуть пользователя после входа: из ?redirect= берём только относительные пути — защита от open redirect (?redirect=https://фишинг-клон-банка.ru)
  function getRedirectTarget() {
    const redirect = route.query.redirect || route.query.callbackUrl;
    if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect;
    }
    return '/';
  }

  async function onSubmitted(data: LoginSchema) {
    // signIn dispatch-ает форму на /api/auth/callback/credentials (с CSRF-токеном),
    // next-auth вызывает наш authorize(), ставит HTTP-only cookie и отвечает.
    // redirect:false — НЕ переходим автоматически, а сами решаем, куда и как показать ошибку.
    const res = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (res?.error) {
      toast.add({
        title: 'Не удалось войти',
        description: 'Неверный email или пароль',
        color: 'error',
      });
    } else {
      await cart.mergeGuestCart();
      toast.add({
        title: 'Вы вошли',
        description: `Добро пожаловать, ${data.email}`,
        color: 'success',
      });
      await navigateTo(getRedirectTarget(), { replace: true });
    }
  }
</script>
