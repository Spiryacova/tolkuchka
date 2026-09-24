import * as z from 'zod';

/**
 * Схемы настроек аккаунта.
 * Правила пароля и лимиты имени временно дублируют auth.schema.ts:
 * после мержа feature/auth-login вынесем их в общий экспорт.
 */

// TODO: Временная копия правил пароля из registerBaseSchema
const passwordRules = z
  .string()
  .min(8, 'Пароль должен быть не менее 8 символов')
  .max(50, 'Максимум 50 символов')
  .regex(/[A-Z]/, 'Добавьте заглавную букву (A–Z)')
  .regex(/[a-z]/, 'Добавьте строчную букву (a–z)')
  .regex(/[!@#$%^&*_+\-=[\]{};:'",.<>/?\\|~]/, 'Добавьте спецсимвол (например @)');

// Профиль: email намеренно отсутствует — его смены не будет без email-инфраструктуры
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(50, 'Максимум 50 символов'),
  avatarUrl: z.union([z.literal(''), z.url('Некорректная ссылка на изображение')]),
});

export type UpdateProfileSchema = z.output<typeof updateProfileSchema>;

export const updatePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: passwordRules,
    confirm: z.string().min(1, 'Повторите новый пароль'),
  })
  .refine((data) => data.newPassword === data.confirm, {
    error: 'Пароли не совпадают',
    path: ['confirm'],
  });

export type UpdatePasswordSchema = z.output<typeof updatePasswordSchema>;

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  role: z.enum(['buyer', 'seller', 'admin']),
});

export type PublicUser = z.output<typeof publicUserSchema>;
