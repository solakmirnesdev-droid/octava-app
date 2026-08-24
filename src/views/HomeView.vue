<script setup>
import { ref, onMounted } from 'vue';
import client from '../api/client';
import SongList from '../components/SongList.vue';

const popular = ref([]);
const recent = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const [p, r] = await Promise.all([
      client.get('/songs', { params: { sort: 'popular', limit: 10 } }),
      client.get('/songs', { params: { sort: 'recent', limit: 10 } })
    ]);
    popular.value = p.data.songs || [];
    recent.value = r.data.songs || [];
  } catch {
    error.value = 'Trenutno ne možemo učitati pjesme.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="mb-12">
    <h1 class="text-3xl font-semibold tracking-tight">Akordi za gitaru</h1>
    <p class="mt-2 text-black/60">Domaća i regionalna muzika, sa akordima iznad teksta.</p>
  </section>

  <p v-if="loading" class="text-sm text-black/50">Učitavanje…</p>
  <p v-else-if="error" class="text-sm text-accent">{{ error }}</p>

  <template v-else>
    <section class="mb-10">
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-black/40">Najtraženije</h2>
      <SongList :songs="popular" empty="Još nema objavljenih pjesama." />
    </section>

    <section>
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-black/40">Nedavno dodano</h2>
      <SongList :songs="recent" empty="Još nema objavljenih pjesama." />
    </section>
  </template>
</template>
