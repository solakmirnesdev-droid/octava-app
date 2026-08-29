import { defineStore } from 'pinia';
import { writeToken, clearToken } from '~/utils/native';

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
      // The API has always returned this beside the cookie; only a native
      // build has anywhere to put it. writeToken is a no-op on the web.
      writeToken(data.token);
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

  const register = (email, password, username, turnstileToken, country = '') =>
    submit('/auth/register', { email, password, username, turnstileToken, country }, 'Registracija nije uspjela.');

  async function fetchMe() {
    const { $api } = useNuxtApp();
    try {
      const data = await $api('/auth/me');
      user.value = data.user;
    } catch {
      user.value = null;
    }
  }

  /**
   * Signs out, and says so.
   *
   * AI-NOTE: the notice is set before navigating, so it is already in place
   * when the home page paints. Without it the only visible change was a header
   * losing two links, which people read as a page reload rather than as having
   * been signed out.
   */
  async function logout(message = 'Odjavljen si.') {
    const { $api } = useNuxtApp();
    try {
      await $api('/auth/logout', { method: 'POST' });
    } finally {
      user.value = null;
      // AI-TRAP: the web logout works because the server clears the httpOnly
      // cookie. A native build holds its own copy, which that response cannot
      // touch — without this the app stays signed in after signing out.
      clearToken();
      useNotice().say(message);
      await navigateTo('/');
    }
  }

  /* ------------------------------------------------------------------ profil */

  /** Shared shape for the profile calls: they all hand back the updated user. */
  async function patch(path, body, fallbackMessage, method = 'PATCH') {
    const { $api } = useNuxtApp();
    loading.value = true;
    error.value = null;
    try {
      const data = await $api(path, { method, body });
      if (data?.user) user.value = data.user;
      return true;
    } catch (err) {
      error.value = err.data?.message || fallbackMessage;
      return false;
    } finally {
      loading.value = false;
    }
  }

  const updateProfile = (fields) =>
    patch('/me', fields, 'Spašavanje nije uspjelo.');

  const changeEmail = (email, password) =>
    patch('/me/email', { email, password }, 'Promjena adrese nije uspjela.');

  const changePassword = (currentPassword, newPassword) =>
    patch('/me/password', { currentPassword, newPassword }, 'Promjena lozinke nije uspjela.');

  /**
   * Uploads a portrait as raw bytes.
   *
   * AI-TRAP: the body is a Blob and the Content-Type says image/webp, so this
   * cannot go through the JSON helpers above — $api would stringify the blob
   * into "[object Blob]" and the server would reject it as not being WebP,
   * which reads like a broken file rather than a broken request.
   */
  async function uploadAvatar(blob) {
    const { $api } = useNuxtApp();
    loading.value = true;
    error.value = null;
    try {
      await $api('/me/avatar', {
        method: 'POST',
        body: blob,
        headers: { 'Content-Type': 'image/webp' }
      });
      await fetchMe();
      return true;
    } catch (err) {
      error.value = err.data?.message || 'Slanje slike nije uspjelo.';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAvatar() {
    const ok = await patch('/me/avatar', undefined, 'Uklanjanje slike nije uspjelo.', 'DELETE');
    if (ok) await fetchMe();
    return ok;
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
    if (data?.token) writeToken(data.token);
  }

  return {
    user, loading, error, isAuthenticated,
    login, register, fetchMe, logout, adopt,
    updateProfile, changeEmail, changePassword, uploadAvatar, deleteAvatar
  };
});
