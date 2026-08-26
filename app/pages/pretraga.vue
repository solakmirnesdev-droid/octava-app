<script setup>
const localePath = useLocalePath();
const route = useRoute();
const { $api } = useNuxtApp();

const query = computed(() => (route.query.q || '').trim());

const { data, status } = await useAsyncData(
  () => `search-${query.value}`,
  () => query.value
    ? $api('/songs/search', { params: { q: query.value } })
        .catch(() => ({ songs: [], artists: [], genres: [] }))
    : Promise.resolve({ songs: [], artists: [], genres: [] }),
  { watch: [query] }
);

// A search for "sevdalinka" should offer the rubric, and one for a performer
// should offer their page — not just songs whose title happens to match.
const hasResults = computed(() =>
  Boolean(data.value?.songs?.length || data.value?.artists?.length || data.value?.genres?.length)
);

useSeoMeta({
  title: () => `Pretraga: ${query.value} | Octava`,
  robots: 'noindex, follow'
});
</script>

<template>
  <h1 class="mb-6 text-xl font-semibold tracking-tight">
    Rezultati za „{{ query }}"
  </h1>

  <p v-if="status === 'pending'" class="text-sm text-black/50">{{ $t('page.searching') }}</p>
  <p v-else-if="!hasResults" class="text-sm text-black/50">{{ $t('page.nothingFound') }}</p>

  <template v-else>
    <section v-if="data.artists?.length" class="mb-8">
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-black/40">{{ $t('page.artists') }}</h2>
      <ul class="flex flex-wrap gap-2">
        <li v-for="artist in data.artists" :key="artist._id">
          <NuxtLink
            :to="localePath(`/izvodjac/${artist.slug}`)"
            class="inline-flex items-baseline gap-2 rounded border border-black/10 bg-white px-3 py-1.5 text-sm hover:border-accent"
          >
            {{ artist.name }}
            <span class="text-xs text-black/40">{{ artist.songCount }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="data.genres?.length" class="mb-8">
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-black/40">{{ $t('page.rubrics') }}</h2>
      <ul class="flex flex-wrap gap-2">
        <li v-for="genre in data.genres" :key="genre._id">
          <NuxtLink
            :to="localePath(`/zanr/${genre.slug}`)"
            class="rounded-full border border-black/15 px-3 py-1 text-xs hover:border-accent"
          >
            {{ genre.name }}
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="data.songs?.length">
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-black/40">{{ $t('page.songs') }}</h2>
      <SongList :songs="data.songs" />
    </section>
  </template>
</template>
