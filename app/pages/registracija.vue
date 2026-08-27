<script setup>
const turnstileToken = ref('');
const { t } = useI18n();
const route = useRoute();
const googleError = ref('');
function onGoogle() {
  // Server already set the session cookie; go where the visitor was headed.
  navigateTo(localePath(route.query.redirect || '/'));
}
const localePath = useLocalePath();
definePageMeta({ layout: false });

const username = ref('');
const email = ref('');
const password = ref('');
const country = ref('');
const auth = useAuthStore();

async function submit() {
  if (await auth.register(email.value, password.value, username.value, turnstileToken.value, country.value)) {
    await navigateTo(localePath('/'));
  }
}

useSeoMeta({ title: t('meta.registerTitle'), robots: 'noindex, nofollow' });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface px-6 text-ink">
    <form class="w-full max-w-sm" @submit.prevent="submit">
      <NuxtLink :to="localePath('/')" class="text-2xl font-semibold tracking-tight">Octava</NuxtLink>
      <p class="mt-1 mb-8 text-sm text-muted">{{ $t('auth.createAccount') }}</p>

      <label for="username" class="mb-1 block text-sm font-medium">{{ $t('auth.username') }}</label>
      <input
        id="username" v-model="username" required autocomplete="nickname" autofocus
        class="mb-4 w-full rounded border border-line-strong bg-panel px-3 py-2 outline-none focus:border-accent"
      />

      <label for="email" class="mb-1 block text-sm font-medium">{{ $t('auth.email') }}</label>
      <input
        id="email" v-model="email" type="email" required autocomplete="username" inputmode="email"
        class="mb-4 w-full rounded border border-line-strong bg-panel px-3 py-2 outline-none focus:border-accent"
      />

      <label for="country" class="mb-1 block text-sm font-medium">
        {{ $t('auth.country') }}
        <span class="ml-1 font-normal text-faint">{{ $t('auth.optional') }}</span>
      </label>
      <!-- Optional, and said so. Asking is worth a flag beside their reviews;
           requiring it is a form people abandon at the last field. -->
      <CountrySelect id="country" v-model="country" class="mb-4" />

      <PasswordField
        id="password" v-model="password"
        autocomplete="new-password" :minlength="8" show-strength
      />
      <p class="mt-1 text-xs text-faint">{{ $t('auth.minChars') }}</p>

      <p v-if="auth.error" role="alert" class="mt-4 rounded bg-accent-soft px-3 py-2 text-sm text-accent">
        {{ auth.error }}
      </p>

      <TurnstileWidget v-model="turnstileToken" />


      <button
        type="submit" :disabled="auth.loading"
        class="mt-6 w-full rounded bg-ink py-2.5 font-medium text-on-ink hover:bg-accent disabled:opacity-50"
      >
        {{ auth.loading ? 'Kreiranje…' : 'Registruj se' }}
      </button>

      <p class="mt-6 text-center text-sm text-muted">
        {{ $t('auth.haveAccount') }}
        <NuxtLink :to="localePath('/prijava')" class="text-accent hover:underline">{{ $t('auth.signIn') }}</NuxtLink>
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
