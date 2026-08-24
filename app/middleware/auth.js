/** Routes that only make sense signed in. Runs on server and client alike. */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  if (!auth.isAuthenticated) {
    return navigateTo({ path: '/prijava', query: { redirect: to.fullPath } });
  }
});
