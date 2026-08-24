<script setup>
import { ref, onMounted } from 'vue';
import client from '../api/client';
import ChordSheet from '../components/ChordSheet.vue';
import TransposeControls from '../components/TransposeControls.vue';
import { useAuthStore } from '../stores/auth';
import { useFavoritesStore } from '../stores/favorites';

const props = defineProps({ slug: { type: String, required: true } });

const song = ref(null);
const loading = ref(true);
const error = ref(null);
const semitones = ref(0);

const auth = useAuthStore();
const favorites = useFavoritesStore();

onMounted(async () => {
  try {
    const { data } = await client.get(`/songs/${props.slug}`);
    song.value = data.song;
  } catch (err) {
    error.value = err.response?.status === 404
      ? 'Pjesma nije pronađena.'
      : 'Učitavanje nije uspjelo.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <p v-if="loading" class="text-sm text-black/50">Učitavanje…</p>
  <p v-else-if="error" class="text-sm text-accent">{{ error }}</p>

  <article v-else>
    <header class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight">{{ song.title }}</h1>
      <RouterLink
        :to="{ name: 'artist', params: { slug: song.artist?.slug } }"
        class="text-black/60 hover:text-accent"
      >
        {{ song.artist?.name }}
      </RouterLink>
    </header>

    <div class="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-black/10 py-3">
      <TransposeControls v-model:semitones="semitones" :original-key="song.originalKey" />

      <span v-if="song.capo" class="text-sm text-black/60">
        Kapodaster: <strong>{{ song.capo }}.</strong> prag
      </span>

      <button
        v-if="auth.isAuthenticated"
        class="ml-auto text-sm hover:text-accent"
        @click="favorites.toggle(song._id)"
      >
        {{ favorites.has(song._id) ? '♥ Sačuvano' : '♡ Sačuvaj' }}
      </button>
    </div>

    <ChordSheet :content="song.content" :semitones="semitones" />
  </article>
</template>
