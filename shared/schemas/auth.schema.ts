import * as z from 'zod';

/**
 * Базовые поля регистрации.
 * Отсюда собираются клиентская и серверная схемы — поля описываются один раз.
 */

const registerBaseSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(50, 'Максимум 50 символов'),
  email: z.email('Некорректный email'),
  password: z
    .string()
    .min(8, 'Пароль должен быть не менее 8 символов')
    .max(50, 'Максимум 50 символов')
    .regex(/[A-Z]/, 'Добавьте заглавную букву (A–Z)')
    .regex(/[a-z]/, 'Добавьте строчную букву (a–z)')
    .regex(/[!@#$%^&*_+\-=[\]{};:'",.<>/?\\|~]/, 'Добавьте спецсимвол (например @)'),
  confirm: z.string().min(1, 'Повторите пароль'),
  role: z.enum(['buyer', 'seller']),
});

// Клиентская форма регистрации (+ будущий сервер): с проверкой совпадения паролей
export const registerSchema = registerBaseSchema.refine((data) => data.password === data.confirm, {
  error: 'Пароли не совпадают',
  path: ['confirm'],
});

// Серверная схема для POST /api/auth/register: без поля подтверждения
export const serverRegisterSchema = registerBaseSchema.omit({ confirm: true });

export type RegisterSchema = z.output<typeof registerSchema>;

// На логине нет проверок сложности: старые пароли остаются валидными, сервер проверит точное совпадение
export const loginSchema = z.object({
  email: z.email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export type LoginSchema = z.output<typeof loginSchema>;
