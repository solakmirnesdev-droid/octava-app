<script setup>
const localePath = useLocalePath();
const route = useRoute();
const { $api } = useNuxtApp();

const letter = computed(() => route.query.letter || '');
const genre = computed(() => route.query.genre || '');
const page = computed(() => Number(route.query.page) || 1);

const [{ data }, { data: genreData }] = await Promise.all([
  useAsyncData(
    () => `artists-${letter.value}-${genre.value}-${page.value}`,
    () => $api('/artists', {
      params: { letter: letter.value || undefined, genre: genre.value || undefined, page: page.value, limit: 60 }
    }),
    { watch: [letter, genre, page] }
  ),
  useAsyncData('genres', () => $api('/genres'))
]);

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const available = computed(() => new Set(data.value?.letters || []));

useSeoMeta({
  title: 'Izvođači | Octava',
  description: 'Svi izvođači na Octavi — pretraži po slovu ili rubrici.'
});
</script>

<template>
  <h1 class="mb-6 text-2xl font-semibold tracking-tight">{{ $t('page.artists') }}</h1>

  <!-- Letters with no artists stay visible but inert, so the row does not
       reflow every time the filter changes. -->
  <nav class="mb-4 flex flex-wrap gap-1">
    <NuxtLink
      :to="{ query: { ...route.query, letter: undefined, page: undefined } }"
      class="rounded px-2 py-1 text-sm hover:bg-raised"
      :class="!letter ? 'bg-ink text-on-ink hover:bg-ink' : ''"
    >{{ $t('page.allFilter') }}</NuxtLink>

    <template v-for="char in ALPHABET" :key="char">
      <NuxtLink
        v-if="available.has(char)"
        :to="{ query: { ...route.query, letter: char, page: undefined } }"
        class="rounded px-2 py-1 font-mono text-sm hover:bg-raised"
        :class="letter === char ? 'bg-ink text-on-ink hover:bg-ink' : ''"
      >{{ char }}</NuxtLink>
      <span v-else class="cursor-default px-2 py-1 font-mono text-sm text-dim">{{ char }}</span>
    </template>
  </nav>

  <nav class="mb-6 flex flex-wrap gap-1.5 border-b border-line pb-4">
    <NuxtLink
      :to="{ query: { ...route.query, genre: undefined, page: undefined } }"
      class="rounded-full border px-3 py-1 text-xs"
      :class="!genre ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong text-muted hover:border-accent'"
    >{{ $t('page.allRubrics') }}</NuxtLink>

    <NuxtLink
      v-for="g in genreData?.genres || []" :key="g._id"
      :to="{ query: { ...route.query, genre: g.slug, page: undefined } }"
      class="rounded-full border px-3 py-1 text-xs"
      :class="genre === g.slug ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong text-muted hover:border-accent'"
    >{{ g.name }}</NuxtLink>
  </nav>

  <p v-if="!data?.artists?.length" class="text-sm text-muted">
    {{ $t('page.noArtists') }}
  </p>

  <ul v-else class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
    <li v-for="artist in data.artists" :key="artist._id">
      <NuxtLink
        :to="localePath(`/izvodjac/${artist.slug}`)"
        class="block rounded border border-line bg-panel px-4 py-3 hover:border-accent"
      >
        <span class="block font-medium">{{ artist.name }}</span>
        <span class="block text-xs text-muted">{{ artist.songCount || 0 }} pjesama</span>
      </NuxtLink>
    </li>
  </ul>
</template>
