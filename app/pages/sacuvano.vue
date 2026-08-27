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
  <h1 class="mb-6 text-xl font-semibold tracking-tight">{{ $t('page.saved') }}</h1>

  <!-- Artists first and compact: it is the shorter list and the one that leads
       somewhere else, so putting it under a long list of songs would bury it. -->
  <section v-if="favorites.artists.length" class="mb-8">
    <h2 class="mb-3 text-sm font-medium text-muted">
      {{ $t('page.savedArtists') }}
      <span class="ml-1 font-mono text-xs text-faint">{{ favorites.artists.length }}</span>
    </h2>

    <ul class="flex flex-wrap gap-2">
      <li v-for="a in favorites.artists" :key="a._id">
        <NuxtLink
          :to="localePath(`/izvodjac/${a.slug}`)"
          class="flex items-center gap-2 rounded-full border border-line bg-panel py-1 pl-1 pr-3 text-sm hover:border-accent hover:text-accent"
        >
          <UserAvatar :name="a.name" size="sm" />
          <span v-if="a.flag">{{ a.flag }}</span>
          <span>{{ a.name }}</span>
          <span class="font-mono text-xs text-faint">{{ a.songCount }}</span>
        </NuxtLink>
      </li>
    </ul>
  </section>

  <section>
    <h2 v-if="favorites.artists.length" class="mb-3 text-sm font-medium text-muted">
      {{ $t('page.savedSongs') }}
      <span class="ml-1 font-mono text-xs text-faint">{{ favorites.songs.length }}</span>
    </h2>

    <SongList :songs="favorites.songs" :empty="$t('page.savedEmpty')" />
  </section>
</template>
