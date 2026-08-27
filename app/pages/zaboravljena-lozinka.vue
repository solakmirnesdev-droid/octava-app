<script setup>
const turnstileToken = ref('');
const { t } = useI18n();
const localePath = useLocalePath();
definePageMeta({ layout: false });

const { $api } = useNuxtApp();
const email = ref('');
const sending = ref(false);
const sent = ref(false);

async function submit() {
  sending.value = true;
  try {
    await $api('/auth/forgot', { method: 'POST', body: { email: email.value, turnstileToken: turnstileToken.value } });
  } catch {
    // The server answers the same either way; a network failure must not
    // become the one signal that distinguishes a real account from a missing
    // one, so the view says the same thing regardless.
  } finally {
    sending.value = false;
    sent.value = true;
  }
}

useSeoMeta({ title: t('meta.forgotTitle'), robots: 'noindex, nofollow' });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface px-6 text-ink">
    <div class="w-full max-w-sm">
      <NuxtLink :to="localePath('/')" class="text-2xl font-semibold tracking-tight">Octava</NuxtLink>

      <template v-if="!sent">
        <p class="mt-1 mb-8 text-sm text-muted">
          {{ $t('auth.resetLead') }}
        </p>

        <form @submit.prevent="submit">
          <label for="email" class="mb-1 block text-sm font-medium">{{ $t('auth.email') }}</label>
          <input
            id="email" v-model="email" type="email" required autocomplete="username"
            autofocus inputmode="email"
            class="mb-6 w-full rounded border border-line-strong bg-panel px-3 py-2 outline-none focus:border-accent"
          />

          <TurnstileWidget v-model="turnstileToken" />


          <button
            type="submit" :disabled="sending"
            class="w-full rounded bg-ink py-2.5 font-medium text-on-ink hover:bg-accent disabled:opacity-50"
          >
            {{ sending ? 'Šaljem…' : 'Pošalji link' }}
          </button>
        </form>
      </template>

      <div v-else class="mt-6 rounded border border-line bg-panel p-5">
        <!-- i18n-t rather than a plain key: the address stays inside its own
                 <strong>, and the sentence can put it wherever the language needs. -->
            <i18n-t keypath="auth.resetSent" tag="p" class="text-sm text-body" scope="global">
              <template #email><strong>{{ email }}</strong></template>
            </i18n-t>
        <p class="mt-2 text-xs text-faint">
          {{ $t('auth.resetValid') }}
        </p>
      </div>

      <p class="mt-6 text-center text-sm text-muted">
        <NuxtLink :to="localePath('/prijava')" class="text-accent hover:underline">{{ $t('auth.backToSignIn') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
