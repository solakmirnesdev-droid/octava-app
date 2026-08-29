<script setup>
const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();

const searchInput = ref(route.query.q || '');
const query = computed(() => (route.query.q || '').trim());

watch(() => route.query.q, (newQ) => {
  searchInput.value = newQ || '';
});

function onSearchSubmit() {
  const q = searchInput.value.trim();
  router.push(localePath({ path: '/pretraga', query: q ? { q } : {} }));
}

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
  title: () => query.value ? `Pretraga: ${query.value} | Octava` : 'Pretraga | Octava',
  robots: 'noindex, follow'
});
</script>

<template>
  <div class="space-y-6">
    <!-- Search Bar Hero -->
    <section class="rounded-3xl border border-line bg-gradient-to-b from-panel/95 via-panel/85 to-surface/90 p-5 sm:p-7 backdrop-blur-xl shadow-xs space-y-4">
      <div class="flex items-center gap-2.5">
        <span class="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent shadow-xs">
          <Icon name="material-symbols:search-rounded" class="text-xl" />
        </span>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-ink">
          {{ query ? `Rezultati za „${query}“` : 'Pretraga baze' }}
        </h1>
      </div>

      <form class="relative max-w-xl" @submit.prevent="onSearchSubmit">
        <Icon
          name="material-symbols:search-rounded"
          aria-hidden="true"
          class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-faint"
        />
        <input
          v-model="searchInput"
          type="search"
          autocomplete="off"
          placeholder="Pretraži pjesme, izvođače ili žanrove..."
          class="w-full rounded-2xl border border-line-soft bg-surface/90 py-3 pl-10.5 pr-10 text-base sm:text-sm text-ink placeholder:text-faint outline-none transition focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20 shadow-2xs"
        />
        <button
          v-if="searchInput"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-faint hover:text-ink hover:bg-line transition cursor-pointer"
          @click="searchInput = ''; onSearchSubmit()"
        >
          <Icon name="material-symbols:close-rounded" class="text-sm" />
        </button>
      </form>
    </section>

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
  </div>
</template>
