<script setup>
const { t } = useI18n();
const googleError = ref('');
function onGoogle() {
  // Server already set the session cookie; go where the visitor was headed.
  navigateTo(localePath(route.query.redirect || '/'));
}
const localePath = useLocalePath();
definePageMeta({ layout: false });

const email = ref('');
const password = ref('');
const auth = useAuthStore();
const route = useRoute();

async function submit() {
  if (await auth.login(email.value, password.value)) {
    await navigateTo(localePath(route.query.redirect || '/'));
  }
}

useSeoMeta({ title: t('meta.loginTitle'), robots: 'noindex, nofollow' });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface px-6 text-ink">
    <form class="w-full max-w-sm" @submit.prevent="submit">
      <NuxtLink :to="localePath('/')" class="text-2xl font-semibold tracking-tight">Octava</NuxtLink>
      <p class="mt-1 mb-8 text-sm text-muted">{{ $t('auth.signInLead') }}</p>

      <label for="email" class="mb-1 block text-sm font-medium">{{ $t('auth.email') }}</label>
      <input
        id="email" v-model="email" type="email" required autocomplete="username"
        autofocus inputmode="email"
        class="mb-4 w-full rounded border border-line-strong bg-panel px-3 py-2 outline-none focus:border-accent"
      />

      <PasswordField id="password" v-model="password" />

      <p class="mt-2 text-right">
        <NuxtLink :to="localePath('/zaboravljena-lozinka')" class="text-xs text-faint hover:text-accent">
          {{ $t('auth.forgot') }}
        </NuxtLink>
      </p>

      <p v-if="auth.error" role="alert" class="mt-4 rounded bg-accent-soft px-3 py-2 text-sm text-accent">
        {{ auth.error }}
      </p>

      <button
        type="submit" :disabled="auth.loading"
        class="mt-6 w-full rounded bg-ink py-2.5 font-medium text-on-ink hover:bg-accent disabled:opacity-50"
      >
        {{ auth.loading ? 'Prijava…' : 'Prijavi se' }}
      </button>

      <p class="mt-6 text-center text-sm text-muted">
        {{ $t('auth.noAccount') }}
        <NuxtLink :to="localePath('/registracija')" class="text-accent hover:underline">{{ $t('auth.register') }}</NuxtLink>
      </p>
    </form>
    <!-- Under the password form, not above it: most people here already
         have an account of one kind, and the form is what they came for. -->
    <div class="mt-5">
      <div class="mb-3 flex items-center gap-3 text-xs text-faint">
        <span class="h-px flex-1 bg-sunken" />{{ $t('auth.or') }}<span class="h-px flex-1 bg-sunken" />
      </div>
      <GoogleSignIn @signed-in="onGoogle" @failed="googleError = $t('auth.googleFailed')" />
      <p v-if="googleError" class="mt-2 text-sm text-danger">{{ googleError }}</p>
    </div>

  </div>
</template>
