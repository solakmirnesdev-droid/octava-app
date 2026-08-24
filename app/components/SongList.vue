<script setup>
defineProps({
  songs: { type: Array, default: () => [] },
  empty: { type: String, default: 'Nema rezultata.' }
});
</script>

<template>
  <p v-if="!songs.length" class="text-sm text-black/50">{{ empty }}</p>

  <ul v-else class="divide-y divide-black/5">
    <li v-for="song in songs" :key="song._id">
      <NuxtLink :to="`/pjesma/${song.slug}`" class="flex items-baseline gap-3 py-3 hover:text-accent">
        <span class="font-medium">{{ song.title }}</span>
        <span class="text-sm text-black/50">{{ song.artist?.name }}</span>
        <span class="ml-auto font-mono text-xs text-black/40">{{ song.originalKey }}</span>
      </NuxtLink>
    </li>
  </ul>
</template>
