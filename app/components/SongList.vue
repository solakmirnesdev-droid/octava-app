<script setup>
const localePath = useLocalePath();

defineProps({
  songs: { type: Array, default: () => [] },
  empty: { type: String, default: 'Nema rezultata.' },
  /**
   * Off on an artist's own page, where every row would otherwise repeat the
   * name already standing at the top of the page.
   */
  showArtist: { type: Boolean, default: true }
});
</script>

<template>
  <p v-if="!songs.length" class="text-sm text-black/50">{{ empty }}</p>

  <ul v-else class="divide-y divide-black/5">
    <li v-for="song in songs" :key="song._id">
      <NuxtLink
        :to="localePath(`/pjesma/${song.slug}`)"
        class="flex items-baseline gap-3 py-3 hover:text-accent"
      >
        <span class="min-w-0 truncate font-medium">{{ song.title }}</span>
        <span v-if="showArtist" class="truncate text-sm text-black/50">{{ song.artist?.name }}</span>

        <RatingStars
          class="ml-auto self-center"
          :value="song.rating || 0"
          :count="song.ratingCount || 0"
        />
        <span class="w-8 shrink-0 text-right font-mono text-xs text-black/40">{{ song.originalKey }}</span>
      </NuxtLink>
    </li>
  </ul>
</template>
