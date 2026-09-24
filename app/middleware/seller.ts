export default defineNuxtRouteMiddleware(() => {
  const { status, data } = useAuth();
  if (status.value === 'unauthenticated') return navigateTo('/auth/login');

  if (status.value === 'loading') return;

  if (status.value === 'authenticated') {
    const role = data.value?.user?.role;
    const allowed = role === 'seller' || role === 'admin';
    if (!allowed) return navigateTo('/seller'); // todo: buyer → лендинг продавца (спринт 3, сейчас 404-заглушка)
  }
});
