<script setup>
definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
// AI-TRAP: needed explicitly. Nuxt auto-imports the composable, not the helper
// it returns — using localePath() in a template without this is a 500, not a
// build error, so it only shows up when somebody opens the page.
const localePath = useLocalePath();
const favorites = useFavoritesStore();
await useAsyncData('favorites', () => favorites.load());

useSeoMeta({ title: t('meta.savedTitle'), robots: 'noindex, nofollow' });
</script>

<template>
  <div class="space-y-8">
    <!-- Hero / Header Card -->
    <section class="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel/95 via-panel/85 to-surface/90 p-6 sm:p-8 backdrop-blur-md shadow-sm">
      <!-- Watermark Background Heart Icon -->
      <Icon
        name="material-symbols:favorite-rounded"
        aria-hidden="true"
        class="pointer-events-none absolute -right-6 -bottom-10 select-none text-[160px] text-accent/5"
      />

      <div class="relative z-10 max-w-3xl">
        <span class="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft px-3 py-0.5 text-xs font-semibold text-accent">
          <Icon name="material-symbols:favorite-rounded" class="text-sm" />
          {{ $t('page.saved') }}
        </span>

        <h1 class="mt-3 text-2xl sm:text-3.5xl font-black tracking-tight text-ink">
          Moja Kolekcija
        </h1>

        <p class="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
          Vaša personalizovana zbirka akorda i omiljenih izvođača spremna za svirku i vježbanje.
        </p>

        <!-- Quick Summary Metrics -->
        <div class="mt-5 flex flex-wrap items-center gap-2.5">
          <div class="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/80 px-3.5 py-1.5 shadow-2xs backdrop-blur-xs">
            <Icon name="material-symbols:music-note-rounded" class="text-accent text-base" />
            <span class="font-mono text-xs font-bold text-ink">{{ favorites.songs.length }}</span>
            <span class="text-xs text-muted">pjesama</span>
          </div>

          <div class="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/80 px-3.5 py-1.5 shadow-2xs backdrop-blur-xs">
            <SingerIcon size="1.1em" class="text-accent" />
            <span class="font-mono text-xs font-bold text-ink">{{ favorites.artists.length }}</span>
            <span class="text-xs text-muted">izvođača</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Saved Artists Section -->
    <section v-if="favorites.artists.length" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <SingerIcon size="1.25em" class="text-accent" />
          <h2 class="text-base font-bold text-ink tracking-tight">{{ $t('page.savedArtists') }}</h2>
        </div>
        <span class="rounded-full border border-line-soft bg-surface px-2.5 py-0.5 font-mono text-xs font-bold text-muted">
          {{ favorites.artists.length }}
        </span>
      </div>

      <div class="flex flex-wrap gap-2.5">
        <NuxtLink
          v-for="a in favorites.artists" :key="a._id"
          :to="localePath(`/izvodjac/${a.slug}`)"
          class="group flex items-center gap-2.5 rounded-2xl border border-line bg-panel/85 p-1.5 pr-4 text-xs sm:text-sm font-semibold text-ink hover:border-accent hover:text-accent hover:shadow-xs transition-all outline-none"
        >
          <UserAvatar :name="a.name" size="sm" class="ring-1 ring-line/50" />
          <span v-if="a.flag" class="text-sm">{{ a.flag }}</span>
          <span>{{ a.name }}</span>
          <span v-if="a.songCount" class="ml-1 rounded-md bg-surface px-1.5 py-0.5 font-mono text-[11px] text-faint group-hover:text-accent">
            {{ a.songCount }}
          </span>
        </NuxtLink>
      </div>
    </section>

    <!-- Saved Songs Section with Filter & View Switcher -->
    <section class="space-y-4">
      <div v-if="favorites.songs.length" class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="material-symbols:queue-music-rounded" class="text-accent text-lg" />
          <h2 class="text-base font-bold text-ink tracking-tight">{{ $t('page.savedSongs') }}</h2>
        </div>
        <span class="rounded-full border border-line-soft bg-surface px-2.5 py-0.5 font-mono text-xs font-bold text-muted">
          {{ favorites.songs.length }}
        </span>
      </div>

      <SongList
        :songs="favorites.songs"
        :empty="$t('page.savedEmpty')"
        allow-view-toggle
        searchable
        sortable
      />
    </section>
  </div>
</template>
