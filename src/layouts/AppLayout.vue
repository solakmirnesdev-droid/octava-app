<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const query = ref('');

function search() {
  if (!query.value.trim()) return;
  router.push({ name: 'search', query: { q: query.value.trim() } });
}
</script>

<template>
  <div class="min-h-screen bg-surface text-ink">
    <header class="sticky top-0 z-10 border-b border-black/10 bg-surface/90 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
        <RouterLink :to="{ name: 'home' }" class="text-lg font-semibold tracking-tight">
          Octava
        </RouterLink>

        <form class="flex-1" @submit.prevent="search">
          <input
            v-model="query"
            type="search"
            placeholder="Traži pjesmu ili izvođača…"
            class="w-full rounded-full border border-black/15 bg-white px-4 py-1.5 text-sm outline-none focus:border-accent"
          />
        </form>

        <nav class="flex items-center gap-4 text-sm">
          <RouterLink v-if="auth.isAuthenticated" :to="{ name: 'favorites' }" class="hover:text-accent">
            Sačuvano
          </RouterLink>
          <RouterLink v-if="!auth.isAuthenticated" :to="{ name: 'login' }" class="hover:text-accent">
            Prijava
          </RouterLink>
          <button v-else class="hover:text-accent" @click="auth.logout()">Odjava</button>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-5 py-8">
      <RouterView />
    </main>

    <footer class="border-t border-black/10 py-8 text-center text-xs text-black/40">
      Octava — akordi za gitaru
    </footer>
  </div>
</template>
