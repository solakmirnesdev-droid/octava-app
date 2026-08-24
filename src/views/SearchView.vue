<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import client from '../api/client';
import SongList from '../components/SongList.vue';

const route = useRoute();
const songs = ref([]);
const loading = ref(false);
const error = ref(null);

async function run(q) {
  if (!q) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await client.get('/songs/search', { params: { q } });
    songs.value = data.songs || [];
  } catch {
    error.value = 'Pretraga trenutno nije dostupna.';
    songs.value = [];
  } finally {
    loading.value = false;
  }
}

watch(() => route.query.q, run, { immediate: true });
</script>

<template>
  <h1 class="mb-6 text-xl font-semibold tracking-tight">
    Rezultati za „{{ route.query.q }}"
  </h1>

  <p v-if="loading" class="text-sm text-black/50">Traženje…</p>
  <p v-else-if="error" class="text-sm text-accent">{{ error }}</p>
  <SongList v-else :songs="songs" empty="Ništa nije pronađeno." />
</template>
