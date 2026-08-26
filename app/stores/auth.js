import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
  // Populated during SSR from the session cookie, so the first paint already
  // knows whether the visitor is signed in.
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => Boolean(user.value));

  async function submit(path, body, fallbackMessage) {
    const { $api } = useNuxtApp();
    loading.value = true;
    error.value = null;
    try {
      const data = await $api(path, { method: 'POST', body });
      user.value = data.user;
      return true;
    } catch (err) {
      // A 429 carries its own wait-and-retry message; anything else falls back.
      error.value = err.data?.message || fallbackMessage;
      return false;
    } finally {
      loading.value = false;
    }
  }

  const login = (email, password) =>
    submit('/auth/login', { email, password }, 'Prijava nije uspjela.');

  const register = (email, password, username, turnstileToken) =>
    submit('/auth/register', { email, password, username, turnstileToken }, 'Registracija nije uspjela.');

  async function fetchMe() {
    const { $api } = useNuxtApp();
    try {
      const data = await $api('/auth/me');
      user.value = data.user;
    } catch {
      user.value = null;
    }
  }

  async function logout() {
    const { $api } = useNuxtApp();
    try {
      await $api('/auth/logout', { method: 'POST' });
    } finally {
      user.value = null;
      await navigateTo('/');
    }
  }

  /**
   * Takes a session the server already established.
   *
   * Google signs in through its own endpoint, which sets the same cookie and
   * returns the same user shape. Refetching /auth/me afterwards would be a
   * round trip to learn what we were just handed.
   */
  function adopt(data) {
    user.value = data?.user || null;
    error.value = null;
  }

  return { user, loading, error, isAuthenticated, login, register, fetchMe, logout, adopt };
});
