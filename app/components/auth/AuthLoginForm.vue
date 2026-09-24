<template>
  <UForm :schema="loginSchema" :state="state" class="space-y-6" @submit="onSubmit">
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
        autocomplete="current-password"
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

    <UButton type="submit" color="primary" variant="solid" size="lg" block> Войти </UButton>
  </UForm>
</template>

<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';
  import { loginSchema, type LoginSchema } from '#shared/schemas/auth.schema';

  const emit = defineEmits<{ submitted: [data: LoginSchema] }>();

  const state = reactive<LoginSchema>({ email: '', password: '' });
  const showPassword = ref(false);

  function onSubmit(event: FormSubmitEvent<LoginSchema>) {
    emit('submitted', event.data);
  }
</script>
