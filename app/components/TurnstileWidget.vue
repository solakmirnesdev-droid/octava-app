<script setup>
/**
 * Cloudflare's CAPTCHA widget.
 *
 * Renders nothing when no site key is configured, and the form must still work
 * in that state — the server skips verification for exactly the same reason.
 * A widget that blocks submission before the keys exist would take the site
 * down rather than protect it.
 */
const model = defineModel({ type: String, default: '' });

const config = useRuntimeConfig();
const { locale } = useI18n();

const holder = ref(null);
const siteKey = config.public.turnstileSiteKey;

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let widgetId = null;

function loadScript() {
  if (window.turnstile) return Promise.resolve();
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

onMounted(async () => {
  if (!siteKey) return;
  try {
    await loadScript();
  } catch {
    return;
  }

  widgetId = window.turnstile.render(holder.value, {
    sitekey: siteKey,
    language: locale.value === 'bs' ? 'hr' : 'en',
    callback: (token) => { model.value = token; },
    // A token is single-use and expires; clearing it here means the form asks
    // again rather than submitting one the server will reject.
    'expired-callback': () => { model.value = ''; },
    'error-callback': () => { model.value = ''; }
  });
});

onBeforeUnmount(() => {
  if (widgetId !== null && window.turnstile) window.turnstile.remove(widgetId);
});

/** Lets a failed submit ask for a fresh token instead of reusing a spent one. */
defineExpose({
  reset() {
    if (widgetId !== null && window.turnstile) {
      window.turnstile.reset(widgetId);
      model.value = '';
    }
  }
});
</script>

<template>
  <div v-if="siteKey" ref="holder" class="mt-3" />
</template>
