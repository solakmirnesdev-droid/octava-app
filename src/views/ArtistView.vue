<script setup>
import { ref, onMounted } from 'vue';
import client from '../api/client';
import SongList from '../components/SongList.vue';

const props = defineProps({ slug: { type: String, required: true } });
const artist = ref(null);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const { data } = await client.get(`/artists/${props.slug}`);
    artist.value = data.artist;
  } catch (err) {
    error.value = err.response?.status === 404
      ? 'Izvođač nije pronađen.'
      : 'Učitavanje nije uspjelo.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <p v-if="loading" class="text-sm text-black/50">Učitavanje…</p>
  <p v-else-if="error" class="text-sm text-accent">{{ error }}</p>

  <template v-else-if="artist">
    <h1 class="mb-6 text-2xl font-semibold tracking-tight">{{ artist.name }}</h1>
    <SongList :songs="artist.songs" empty="Još nema pjesama ovog izvođača." />
  </template>
</template>
