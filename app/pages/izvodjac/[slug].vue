<script setup>
const config = useRuntimeConfig();
const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const { $api } = useNuxtApp();

const { data, error } = await useAsyncData(
  () => `artist-${route.params.slug}`,
  () => $api(`/artists/${route.params.slug}`)
);

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: t('meta.artistNotFound'), fatal: true });
}

const artist = computed(() => data.value?.artist);

useSeoMeta({
  title: () => `${artist.value?.name} — akordi | Octava`,
  description: () => `Svi akordi za pjesme izvođača ${artist.value?.name}.`
});
</script>

<template>
  <div v-if="artist" class="lg:grid lg:grid-cols-[236px_1fr] lg:gap-10">
    <!-- The profile stays put while the list scrolls: on an artist with fifty
         songs the name and picture would otherwise leave the screen at once. -->
    <aside class="mb-8 lg:sticky lg:top-24 lg:mb-0 lg:self-start">
      <div class="flex items-center gap-4 lg:block">
        <img
          v-if="artist.hasImage"
          :src="`${config.public.apiBase}/artists/${artist._id}/image`"
          :alt="artist.name"
          class="size-20 shrink-0 rounded-full object-cover ring-1 ring-black/10 lg:size-32"
        >
        <div
          v-else
          class="flex size-20 shrink-0 items-center justify-center rounded-full bg-black/5 text-black/20 lg:size-32"
        >
          <Icon name="material-symbols:artist-rounded" class="text-3xl lg:text-5xl" />
        </div>

        <div class="lg:mt-4">
          <h1 class="text-2xl font-semibold tracking-tight">
            <span v-if="artist.flag" class="mr-1.5">{{ artist.flag }}</span>{{ artist.name }}
          </h1>
          <p class="mt-1 text-sm text-black/40">
            {{ $t('common.songCount', { n: artist.songs?.length || 0 }, artist.songs?.length || 0) }}
          </p>
        </div>
      </div>

      <ul v-if="artist.genres?.length" class="mt-4 flex flex-wrap gap-1.5">
        <li v-for="genre in artist.genres" :key="genre._id">
          <NuxtLink
            :to="localePath(`/zanr/${genre.slug}`)"
            class="rounded-full border border-black/15 px-2.5 py-0.5 text-xs text-black/60 hover:border-accent hover:text-accent"
          >{{ genre.name }}</NuxtLink>
        </li>
      </ul>

      <p v-if="artist.bio" class="mt-4 text-sm leading-relaxed text-black/60">{{ artist.bio }}</p>
    </aside>

    <!-- showArtist off: the name is already at the top of this page. -->
    <SongList
      :songs="artist.songs || []"
      :show-artist="false"
      :empty="$t('page.noArtistSongs')"
    />
  </div>
</template>
