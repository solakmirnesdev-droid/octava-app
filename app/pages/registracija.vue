<script setup>
definePageMeta({ layout: false });

const username = ref('');
const email = ref('');
const password = ref('');
const auth = useAuthStore();

async function submit() {
  if (await auth.register(email.value, password.value, username.value)) {
    await navigateTo('/');
  }
}

useSeoMeta({ title: 'Registracija | Octava', robots: 'noindex, nofollow' });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface px-6 text-ink">
    <form class="w-full max-w-sm" @submit.prevent="submit">
      <NuxtLink to="/" class="text-2xl font-semibold tracking-tight">Octava</NuxtLink>
      <p class="mt-1 mb-8 text-sm text-black/50">Napravi nalog.</p>

      <label class="block text-sm font-medium" for="username">Korisničko ime</label>
      <input
        id="username" v-model="username" required autocomplete="nickname"
        class="mt-1 mb-4 w-full rounded border border-black/15 bg-white px-3 py-2 outline-none focus:border-accent"
      />

      <label class="block text-sm font-medium" for="email">Email</label>
      <input
        id="email" v-model="email" type="email" required autocomplete="username"
        class="mt-1 mb-4 w-full rounded border border-black/15 bg-white px-3 py-2 outline-none focus:border-accent"
      />

      <label class="block text-sm font-medium" for="password">Lozinka</label>
      <input
        id="password" v-model="password" type="password" required minlength="8" autocomplete="new-password"
        class="mt-1 mb-1 w-full rounded border border-black/15 bg-white px-3 py-2 outline-none focus:border-accent"
      />
      <p class="mb-6 text-xs text-black/40">Najmanje 8 znakova.</p>

      <p v-if="auth.error" class="mb-4 text-sm text-accent">{{ auth.error }}</p>

      <button
        type="submit" :disabled="auth.loading"
        class="w-full rounded bg-ink py-2.5 font-medium text-white hover:bg-accent disabled:opacity-50"
      >
        {{ auth.loading ? 'Kreiranje…' : 'Registruj se' }}
      </button>

      <p class="mt-6 text-center text-sm text-black/50">
        Već imaš nalog?
        <NuxtLink to="/prijava" class="text-accent hover:underline">Prijavi se</NuxtLink>
      </p>
    </form>
  </div>
</template>
