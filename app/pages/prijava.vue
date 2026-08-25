<script setup>
definePageMeta({ layout: false });

const email = ref('');
const password = ref('');
const auth = useAuthStore();
const route = useRoute();

async function submit() {
  if (await auth.login(email.value, password.value)) {
    await navigateTo(route.query.redirect || '/');
  }
}

useSeoMeta({ title: 'Prijava | Octava', robots: 'noindex, nofollow' });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface px-6 text-ink">
    <form class="w-full max-w-sm" @submit.prevent="submit">
      <NuxtLink to="/" class="text-2xl font-semibold tracking-tight">Octava</NuxtLink>
      <p class="mt-1 mb-8 text-sm text-black/50">Prijavi se da sačuvaš pjesme.</p>

      <label for="email" class="mb-1 block text-sm font-medium">Email</label>
      <input
        id="email" v-model="email" type="email" required autocomplete="username"
        autofocus inputmode="email"
        class="mb-4 w-full rounded border border-black/15 bg-white px-3 py-2 outline-none focus:border-accent"
      />

      <PasswordField id="password" v-model="password" />

      <p v-if="auth.error" role="alert" class="mt-4 rounded bg-accent/10 px-3 py-2 text-sm text-accent">
        {{ auth.error }}
      </p>

      <button
        type="submit" :disabled="auth.loading"
        class="mt-6 w-full rounded bg-ink py-2.5 font-medium text-white hover:bg-accent disabled:opacity-50"
      >
        {{ auth.loading ? 'Prijava…' : 'Prijavi se' }}
      </button>

      <p class="mt-6 text-center text-sm text-black/50">
        Nemaš nalog?
        <NuxtLink to="/registracija" class="text-accent hover:underline">Registruj se</NuxtLink>
      </p>
    </form>
  </div>
</template>
