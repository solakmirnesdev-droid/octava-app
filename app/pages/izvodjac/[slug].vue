<script setup>
const route = useRoute();
const { $api } = useNuxtApp();

const { data, error } = await useAsyncData(
  () => `artist-${route.params.slug}`,
  () => $api(`/artists/${route.params.slug}`)
);

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Izvođač nije pronađen.', fatal: true });
}

const artist = computed(() => data.value?.artist);

useSeoMeta({
  title: () => `${artist.value?.name} — akordi | Octava`,
  description: () => `Svi akordi za pjesme izvođača ${artist.value?.name}.`
});
</script>

<template>
  <div v-if="artist">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight">{{ artist.name }}</h1>
      <p class="mt-1 text-sm text-black/40">{{ artist.songs?.length || 0 }} pjesama</p>

      <ul v-if="artist.genres?.length" class="mt-2 flex flex-wrap gap-1.5">
        <li v-for="genre in artist.genres" :key="genre._id">
          <NuxtLink
            :to="`/zanr/${genre.slug}`"
            class="rounded-full border border-black/15 px-2.5 py-0.5 text-xs text-black/60 hover:border-accent hover:text-accent"
          >{{ genre.name }}</NuxtLink>
        </li>
      </ul>
    </header>

    <SongList :songs="artist.songs || []" empty="Još nema pjesama ovog izvođača." />
  </div>
</template>
