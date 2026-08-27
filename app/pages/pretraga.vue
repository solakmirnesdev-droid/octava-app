<script setup>
const localePath = useLocalePath();
const route = useRoute();
const { $api } = useNuxtApp();

const query = computed(() => (route.query.q || '').trim());

const { data, status } = await useAsyncData(
  () => `search-${query.value}`,
  () => query.value
    ? $api('/songs/search', { params: { q: query.value } })
        .catch(() => ({ songs: [], artists: [], genres: [], suggestion: null }))
    : Promise.resolve({ songs: [], artists: [], genres: [], suggestion: null }),
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

  <p v-if="status === 'pending'" class="text-sm text-muted">{{ $t('page.searching') }}</p>
  <p v-else-if="!hasResults" class="text-sm text-muted">{{ $t('page.nothingFound') }}</p>

  <!--
    The API sets `suggestion` only when nothing matched the query as typed, so
    what is on screen is already the corrected search. Saying "did you mean" here
    would be asking a question the page has answered for itself — this states
    what happened instead, and leaves the reader the original as a way back.
  -->
  <i18n-t
    v-if="data?.suggestion" keypath="page.searchCorrected" tag="p"
    class="mb-6 rounded border border-line bg-panel px-3 py-2 text-sm text-muted" scope="global"
  >
    <template #typed><span class="text-faint">{{ query }}</span></template>
    <template #suggestion><strong class="font-medium text-ink">{{ data.suggestion }}</strong></template>
  </i18n-t>

  <template v-else>
    <section v-if="data.artists?.length" class="mb-8">
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-faint">{{ $t('page.artists') }}</h2>
      <ul class="flex flex-wrap gap-2">
        <li v-for="artist in data.artists" :key="artist._id">
          <NuxtLink
            :to="localePath(`/izvodjac/${artist.slug}`)"
            class="inline-flex items-baseline gap-2 rounded border border-line bg-panel px-3 py-1.5 text-sm hover:border-accent"
          >
            {{ artist.name }}
            <span class="text-xs text-faint">{{ artist.songCount }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="data.genres?.length" class="mb-8">
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-faint">{{ $t('page.rubrics') }}</h2>
      <ul class="flex flex-wrap gap-2">
        <li v-for="genre in data.genres" :key="genre._id">
          <NuxtLink
            :to="localePath(`/zanr/${genre.slug}`)"
            class="rounded-full border border-line-strong px-3 py-1 text-xs hover:border-accent"
          >
            {{ genre.name }}
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="data.songs?.length">
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-faint">{{ $t('page.songs') }}</h2>
      <SongList :songs="data.songs" />
    </section>
  </template>
</template>
