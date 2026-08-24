import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import client from '../api/client';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('octava_token') || null);
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => Boolean(token.value));

  function persist(data) {
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('octava_token', data.token);
  }

  async function submit(path, body, fallbackMessage) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await client.post(path, body);
      persist(data);
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || fallbackMessage;
      return false;
    } finally {
      loading.value = false;
    }
  }

  const login = (email, password) =>
    submit('/auth/login', { email, password }, 'Prijava nije uspjela.');

  const register = (email, password, username) =>
    submit('/auth/register', { email, password, username }, 'Registracija nije uspjela.');

  async function fetchMe() {
    if (!token.value) return;
    try {
      const { data } = await client.get('/auth/me');
      user.value = data.user;
    } catch {
      logout();
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('octava_token');
  }

  return { token, user, loading, error, isAuthenticated, login, register, fetchMe, logout };
});
