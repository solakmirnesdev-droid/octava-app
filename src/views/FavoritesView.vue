<script setup>
import { onMounted } from 'vue';
import { useFavoritesStore } from '../stores/favorites';
import SongList from '../components/SongList.vue';

const favorites = useFavoritesStore();
onMounted(() => favorites.load());
</script>

<template>
  <h1 class="mb-6 text-xl font-semibold tracking-tight">Sačuvane pjesme</h1>
  <SongList :songs="favorites.songs" empty="Još nemaš sačuvanih pjesama." />
</template>
