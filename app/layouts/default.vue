<script setup>
const auth = useAuthStore();
const { $api } = useNuxtApp();

// Fetched once for the whole layout; the rubric row is on every page.
const { data: genreData } = await useAsyncData('layout-genres', () =>
  $api('/genres').catch(() => ({ grouped: {} }))
);
</script>

<template>
  <div class="min-h-screen bg-surface text-ink">
    <header class="sticky top-0 z-10 border-b border-black/10 bg-surface/90 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
        <NuxtLink to="/" class="text-lg font-semibold tracking-tight">Octava</NuxtLink>

        <SearchBox />

        <nav class="flex items-center gap-4 text-sm">
          <NuxtLink to="/izvodjaci" class="hover:text-accent">Izvođači</NuxtLink>
          <NuxtLink v-if="auth.isAuthenticated" to="/sacuvano" class="hover:text-accent">Sačuvano</NuxtLink>
          <NuxtLink v-if="!auth.isAuthenticated" to="/prijava" class="hover:text-accent">Prijava</NuxtLink>
          <button v-else class="hover:text-accent" @click="auth.logout()">Odjava</button>
        </nav>
      </div>

      <div class="border-t border-black/5">
        <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2 text-sm">
          <NuxtLink
            v-for="g in genreData?.grouped?.region || []" :key="g._id"
            :to="`/zanr/${g.slug}`"
            class="font-medium text-black/70 hover:text-accent"
            active-class="text-accent"
          >{{ g.name }}</NuxtLink>

          <span v-if="genreData?.grouped?.region?.length" class="text-black/15">|</span>

          <NuxtLink
            v-for="g in genreData?.grouped?.style || []" :key="g._id"
            :to="`/zanr/${g.slug}`"
            class="text-black/50 hover:text-accent"
            active-class="text-accent"
          >{{ g.name }}</NuxtLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-5 py-8">
      <slot />
    </main>

    <footer class="border-t border-black/10 py-8 text-center text-xs text-black/40">
      Octava — akordi za gitaru
    </footer>
  </div>
</template>
