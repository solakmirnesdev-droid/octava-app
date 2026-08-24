<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const email = ref('');
const password = ref('');
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

async function submit() {
  if (await auth.login(email.value, password.value)) {
    router.push(route.query.redirect || { name: 'home' });
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface px-6">
    <form class="w-full max-w-sm" @submit.prevent="submit">
      <RouterLink :to="{ name: 'home' }" class="text-2xl font-semibold tracking-tight">Octava</RouterLink>
      <p class="mt-1 mb-8 text-sm text-black/50">Prijavi se da sačuvaš pjesme.</p>

      <label class="block text-sm font-medium">Email</label>
      <input
        v-model="email" type="email" required autocomplete="username"
        class="mt-1 mb-4 w-full rounded border border-black/15 bg-white px-3 py-2 outline-none focus:border-accent"
      />

      <label class="block text-sm font-medium">Lozinka</label>
      <input
        v-model="password" type="password" required autocomplete="current-password"
        class="mt-1 mb-6 w-full rounded border border-black/15 bg-white px-3 py-2 outline-none focus:border-accent"
      />

      <p v-if="auth.error" class="mb-4 text-sm text-accent">{{ auth.error }}</p>

      <button
        type="submit" :disabled="auth.loading"
        class="w-full rounded bg-ink py-2.5 font-medium text-white hover:bg-accent disabled:opacity-50"
      >
        {{ auth.loading ? 'Prijava…' : 'Prijavi se' }}
      </button>

      <p class="mt-6 text-center text-sm text-black/50">
        Nemaš nalog?
        <RouterLink :to="{ name: 'register' }" class="text-accent hover:underline">Registruj se</RouterLink>
      </p>
    </form>
  </div>
</template>
