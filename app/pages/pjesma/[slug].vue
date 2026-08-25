<script setup>
const route = useRoute();
const { $api } = useNuxtApp();
const config = useRuntimeConfig();

const auth = useAuthStore();
const favorites = useFavoritesStore();

// Fetched during SSR, so the chords are in the initial HTML. This is the whole
// reason the app renders on the server: search traffic lands directly here.
const { data, error } = await useAsyncData(
  () => `song-${route.params.slug}`,
  () => $api(`/songs/${route.params.slug}`)
);

if (error.value) {
  const status = error.value.statusCode || error.value.status;
  // Log the underlying failure; a generic 500 page hides why it broke.
  if (status !== 404) console.error('[song fetch]', error.value);

  throw createError({
    statusCode: status === 404 ? 404 : 500,
    statusMessage: status === 404 ? 'Pjesma nije pronađena.' : 'Greška pri učitavanju.',
    fatal: true
  });
}

const song = computed(() => data.value?.song);

// Transposition is deliberately component state, not a URL parameter: every
// key would otherwise be a separate crawlable URL with near-identical content.
const semitones = ref(0);
const { fontSize } = useSheetFontSize();
const showChords = ref(false);

const title = computed(() =>
  song.value ? `${song.value.title} — ${song.value.artist?.name} | Akordi za gitaru` : 'Octava'
);
const description = computed(() =>
  song.value
    ? `Akordi za pjesmu ${song.value.title} (${song.value.artist?.name}). Originalni tonalitet ${song.value.originalKey}. Transponuj u bilo koji tonalitet.`
    : ''
);

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'article'
});

useHead({
  link: [{ rel: 'canonical', href: () => `${config.public.siteUrl}/pjesma/${route.params.slug}` }]
});
</script>

<template>
  <article v-if="song">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight">{{ song.title }}</h1>
      <NuxtLink :to="`/izvodjac/${song.artist?.slug}`" class="text-black/60 hover:text-accent">
        {{ song.artist?.name }}
      </NuxtLink>

      <ul v-if="song.genres?.length" class="mt-2 flex flex-wrap gap-1.5">
        <li v-for="genre in song.genres" :key="genre._id">
          <NuxtLink
            :to="`/zanr/${genre.slug}`"
            class="rounded-full border border-black/15 px-2.5 py-0.5 text-xs text-black/60 hover:border-accent hover:text-accent"
          >{{ genre.name }}</NuxtLink>
        </li>
      </ul>
    </header>

    <div class="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-black/10 py-3">
      <TransposeControls v-model:semitones="semitones" :original-key="song.originalKey" />

      <FontSizeControl />

      <AutoScrollControl />

      <button
        class="rounded border px-2.5 py-1.5 transition"
        :class="showChords
          ? 'border-accent bg-accent text-white'
          : 'border-black/15 bg-white text-black/60 hover:border-accent hover:text-accent'"
        :aria-pressed="showChords"
        title="Prikaži sve akorde iz pjesme"
        @click="showChords = !showChords"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <line x1="9" y1="4" x2="9" y2="20" />
          <line x1="15" y1="4" x2="15" y2="20" />
          <line x1="4" y1="10" x2="20" y2="10" />
          <line x1="4" y1="15" x2="20" y2="15" />
        </svg>
        <span class="sr-only">Prikaži sve akorde</span>
      </button>

      <span v-if="song.capo" class="text-sm text-black/60">
        Kapodaster: <strong>{{ song.capo }}.</strong> prag
      </span>

      <button
        v-if="auth.isAuthenticated"
        class="ml-auto text-sm hover:text-accent"
        @click="favorites.toggle(song._id)"
      >
        {{ favorites.has(song._id) ? '♥ Sačuvano' : '♡ Sačuvaj' }}
      </button>
      <NuxtLink v-else to="/prijava" class="ml-auto text-sm text-black/40 hover:text-accent">
        ♡ Sačuvaj
      </NuxtLink>
    </div>

    <ChordGrid
      v-if="showChords"
      class="mb-8"
      :content="song.content"
      :semitones="semitones"
      :original-key="song.originalKey"
    />

    <ChordSheet
      :content="song.content"
      :semitones="semitones"
      :original-key="song.originalKey"
      :font-size="fontSize"
    />
  </article>
</template>
