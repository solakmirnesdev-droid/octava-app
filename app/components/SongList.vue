<script setup>
const auth = useAuthStore();
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
  <p v-if="!songs.length" class="text-sm text-muted">{{ empty }}</p>

  <ul v-else class="divide-y divide-line-soft">
    <!--
      Two links, not one.

      AI-DECISION: the stars used to sit inside the row's link, which made them look
      like a control that did nothing — people expected to rate from a list and
      found that the whole row just opened the song. They are their own link now,
      pointing at the song's reviews. Nesting one <a> inside another is invalid
      HTML, so the row had to be split rather than layered.
    -->
    <li v-for="song in songs" :key="song._id" class="group flex items-baseline gap-3 py-3">
      <NuxtLink
        :to="localePath(`/pjesma/${song.slug}`)"
        class="flex min-w-0 flex-1 items-baseline gap-3 group-hover:text-accent"
      >
        <span class="min-w-0 truncate font-medium">{{ song.title }}</span>
        <span v-if="showArtist" class="truncate text-sm text-muted">{{ song.artist?.name }}</span>
      </NuxtLink>

      <!-- Signed in, the stars are the vote. Signed out they stay a picture and
           lead to the reviews, where signing in is offered. -->
      <span v-if="auth.isAuthenticated" class="-my-0.5 shrink-0 self-center px-1 py-0.5">
        <RatingStars
          :value="song.rating || 0" :count="song.ratingCount || 0"
          :slug="song.slug" :arrangement-id="song.arrangementId"
          @rated="(r) => { song.rating = r.average; song.ratingCount = r.count; }"
        />
      </span>

      <NuxtLink
        v-else
        :to="localePath(`/pjesma/${song.slug}`) + '#recenzije'"
        class="-my-0.5 shrink-0 self-center rounded px-1 py-0.5 hover:bg-raised"
        :title="song.ratingCount ? $t('song.seeReviews') : $t('song.beFirstToRate')"
      >
        <RatingStars :value="song.rating || 0" :count="song.ratingCount || 0" />
      </NuxtLink>

      <NuxtLink
        :to="localePath(`/pjesma/${song.slug}`)"
        class="w-8 shrink-0 text-right font-mono text-xs text-faint group-hover:text-accent"
      >{{ song.originalKey }}</NuxtLink>
    </li>
  </ul>
</template>
