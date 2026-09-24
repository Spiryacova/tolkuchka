<template>
  <div class="mx-auto w-full max-w-lg space-y-12 py-8">
    <template v-if="status === 'authenticated'">
      <section>
        <h1 class="text-2xl font-bold">Настройки</h1>
        <p class="mt-1 text-sm text-muted">Профиль и безопасность аккаунта</p>
      </section>

      <section class="space-y-6">
        <h2 class="text-lg font-semibold">Профиль</h2>

        <div class="flex items-center gap-4">
          <UAvatar
            :src="isValidAvatar ? profileState.avatarUrl : undefined"
            :alt="profileState.name"
            size="xl"
          />
          <p class="text-sm text-muted">Аватар подхватит ссылку ниже; пока её нет — инициалы.</p>
        </div>

        <UForm
          :state="profileState"
          :schema="updateProfileSchema"
          class="space-y-4"
          @submit="onProfileSubmit"
        >
          <UFormField name="name" label="Имя">
            <UInput v-model="profileState.name" class="w-full" />
          </UFormField>
          <!-- TODO: URL-поле вместо загрузки файла. Когда появится /api/upload,
        заменить UInput на компонент-аплоадер — он запишет сюда тот же URL -->
          <UFormField name="avatarUrl" label="Ссылка на аватар">
            <UInput v-model="profileState.avatarUrl" placeholder="https://…" class="w-full" />
          </UFormField>

          <UFormField label="Email" description="Смена email пока недоступна">
            <UInput :model-value="user?.email ?? ''" disabled class="w-full" />
          </UFormField>

          <UButton type="submit" :loading="savingProfile" :disabled="!isProfileDirty">
            Сохранить
          </UButton>
        </UForm>
      </section>

      <section class="space-y-4">
        <h2 class="text-lg font-semibold">Смена пароля</h2>

        <UForm
          :state="passwordState"
          :schema="updatePasswordSchema"
          class="space-y-4"
          @submit="onPasswordSubmit"
        >
          <UFormField name="oldPassword" label="Текущий пароль">
            <UInput v-model="passwordState.oldPassword" type="password" class="w-full" />
          </UFormField>
          <UFormField name="newPassword" label="Новый пароль">
            <UInput v-model="passwordState.newPassword" type="password" class="w-full" />
          </UFormField>
          <UFormField name="confirm" label="Повторите новый пароль">
            <UInput v-model="passwordState.confirm" type="password" class="w-full" />
          </UFormField>

          <UButton type="submit" :loading="savingPassword" :disabled="!isPasswordFilled">
            Сохранить
          </UButton>
        </UForm>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold">Роль</h2>
        <div class="flex items-center gap-3">
          <UBadge :color="user?.role === 'seller' ? 'primary' : 'neutral'">
            {{ user?.role === 'seller' ? 'Продавец' : 'Покупатель' }}
          </UBadge>
          <UButton v-if="user?.role === 'buyer'" to="/seller" size="sm" variant="subtle">
            Стать продавцом
          </UButton>
        </div>
      </section>
    </template>
    <div v-else class="space-y-12">
      <!-- скелетон заголовка -->
      <div class="space-y-2">
        <USkeleton class="h-8 w-40" />
        <USkeleton class="h-4 w-64" />
      </div>
      <!-- скелетон формы -->
      <div class="space-y-4">
        <USkeleton class="h-6 w-24" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-32" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';
  import {
    updatePasswordSchema,
    updateProfileSchema,
    type UpdatePasswordSchema,
    type UpdateProfileSchema,
  } from '#shared/schemas/user.schema';
  import type { Session } from 'next-auth';

  interface PatchProfileResponse {
    user: Pick<Session['user'], 'id' | 'name' | 'avatarUrl'>;
  }

  definePageMeta({
    middleware: ['sidebase-auth'],
    auth: true,
  });

  useSeoMeta({
    title: 'Настройки аккаунта',
    robots: 'noindex',
  });

  const { data: session, status } = useAuth();
  const authData = useState<Session | null | undefined>('auth:data');
  const user = computed(() => session.value?.user);

  const toast = useToast();

  const profileState = reactive<UpdateProfileSchema>({
    name: user.value?.name ?? '',
    avatarUrl: user.value?.avatarUrl ?? '',
  });

  const profileSnapshot = ref<UpdateProfileSchema>({ ...profileState });
  const isProfileDirty = computed(
    () =>
      profileState.name !== profileSnapshot.value.name ||
      profileState.avatarUrl !== profileSnapshot.value.avatarUrl,
  );
  const isValidAvatar = computed(() => {
    const url = profileState.avatarUrl.trim();
    return url.startsWith('http://') || url.startsWith('https://');
  });
  const savingProfile = ref(false);

  async function onProfileSubmit(event: FormSubmitEvent<UpdateProfileSchema>) {
    savingProfile.value = true;
    try {
      const res = await $fetch<PatchProfileResponse>('/api/user', {
        method: 'PATCH',
        body: event.data,
      });
      // Перезаписываем глобальную сессию новыми данными из ответа — шапка перерисуется
      if (res?.user && authData.value?.user) {
        authData.value = {
          ...authData.value,
          user: {
            ...authData.value.user,
            name: res.user.name ?? '',
            avatarUrl: res.user.avatarUrl ?? undefined,
          },
        };
      }

      toast.add({
        title: 'Успешно',
        description: 'Данные сохранены',
        color: 'success',
      });
      profileSnapshot.value = { ...profileState };
    } catch (e) {
      console.error(e);
      toast.add({
        title: 'Ошибка',
        description: 'Не удалось сохранить',
        color: 'error',
      });
    } finally {
      savingProfile.value = false;
    }
  }

  const passwordState = reactive<UpdatePasswordSchema>({
    oldPassword: '',
    newPassword: '',
    confirm: '',
  });

  const isPasswordFilled = computed(
    () => passwordState.oldPassword && passwordState.newPassword && passwordState.confirm,
  );
  const savingPassword = ref(false);

  async function onPasswordSubmit(event: FormSubmitEvent<UpdatePasswordSchema>) {
    savingPassword.value = true;
    try {
      await $fetch('/api/user/password', { method: 'PATCH', body: event.data });
      toast.add({
        title: 'Успешно',
        description: 'Пароль изменён',
        color: 'success',
      });
      Object.assign(passwordState, { oldPassword: '', newPassword: '', confirm: '' });
    } catch (e) {
      console.error(e);
      toast.add({
        title: 'Ошибка',
        description: 'Не удалось изменить пароль',
        color: 'error',
      });
    } finally {
      savingPassword.value = false;
    }
  }
</script>
