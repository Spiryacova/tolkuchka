export default defineNuxtRouteMiddleware(async (to) => {
  const { status, getSession } = useAuth();
  // Блокируем переход, пока сессия не резолвнулась: иначе авторизованный
  // пользователь при клиентской навигации успел бы улететь на логин.
  if (status.value === 'loading') {
    await getSession();
  }
  if (status.value === 'unauthenticated') {
    return navigateTo({ path: '/auth/login', query: { redirect: to.fullPath } });
  }
});