<script setup>
definePageMeta({ middleware: 'auth' });

const favorites = useFavoritesStore();
await useAsyncData('favorites', () => favorites.load());

useSeoMeta({ title: 'Sačuvane pjesme | Octava', robots: 'noindex, nofollow' });
</script>

<template>
  <h1 class="mb-6 text-xl font-semibold tracking-tight">{{ $t('page.savedSongs') }}</h1>
  <SongList :songs="favorites.songs" empty="Još nemaš sačuvanih pjesama." />
</template>
