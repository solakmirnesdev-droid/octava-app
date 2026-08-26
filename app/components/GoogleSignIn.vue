<script setup>
/**
 * Google's own button, rendered by their script.
 *
 * The client id comes from the API rather than from our own config: it already
 * has to match what the backend verifies against, and keeping one copy is the
 * only way that stays true. Nothing renders until the API says it is set up, so
 * the page is unchanged while the keys do not exist.
 */
const emit = defineEmits(['signed-in', 'failed']);

const { $api } = useNuxtApp();
const auth = useAuthStore();
const { locale } = useI18n();

const holder = ref(null);
const enabled = ref(false);

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function loadScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
  if (existing) return new Promise((res, rej) => {
    existing.addEventListener('load', res); existing.addEventListener('error', rej);
  });

  return new Promise((res, rej) => {
    const el = document.createElement('script');
    el.src = SCRIPT_SRC;
    el.async = true;
    el.onload = res;
    el.onerror = rej;
    document.head.appendChild(el);
  });
}

async function handle(response) {
  try {
    const res = await $api('/auth/google', {
      method: 'POST', body: { credential: response.credential }
    });
    await auth.adopt(res);
    emit('signed-in', res);
  } catch {
    emit('failed');
  }
}

onMounted(async () => {
  let status;
  try {
    status = await $api('/auth/google/status');
  } catch {
    return;
  }
  if (!status?.enabled || !status.clientId) return;

  try {
    await loadScript();
  } catch {
    // Blocked, offline, or refused by an extension: the password form is still
    // right there, so this stays silent rather than showing an error for a
    // thing the reader never asked for.
    return;
  }

  window.google.accounts.id.initialize({
    client_id: status.clientId,
    callback: handle,
    // Off deliberately: One Tap appears unprompted over the page and is a
    // surprise on a site nobody signed into yet.
    auto_select: false,
    cancel_on_tap_outside: true
  });

  window.google.accounts.id.renderButton(holder.value, {
    theme: 'outline',
    size: 'large',
    width: 320,
    locale: locale.value === 'bs' ? 'hr' : 'en'
  });

  enabled.value = true;
});
</script>

<template>
  <!-- Height is reserved whether or not it renders, so the form does not jump
       when Google's script finishes loading. -->
  <div class="min-h-[44px]">
    <div ref="holder" :class="enabled ? '' : 'hidden'" />
  </div>
</template>
