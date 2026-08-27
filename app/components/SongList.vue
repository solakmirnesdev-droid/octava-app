<script setup>
import { initials, avatarStyle } from '~/utils/avatar';
import { flagOf } from '~/utils/countries';

const auth = useAuthStore();
const localePath = useLocalePath();
const config = useRuntimeConfig();

defineProps({
  songs: { type: Array, default: () => [] },
  empty: { type: String, default: 'Nema rezultata.' },
  /**
   * Off on an artist's own page, where every row would otherwise repeat the
   * name already standing at the top of the page.
   */
  showArtist: { type: Boolean, default: true }
});

const DIFFICULTY_KEY = { easy: 'difficultyEasy', medium: 'difficultyMedium', hard: 'difficultyHard' };
const DIFFICULTY_CLASS = {
  easy:   'border-ok/25 bg-ok-soft text-ok',
  medium: 'border-warn/25 bg-warn-soft text-warn',
  hard:   'border-danger/25 bg-danger-soft text-danger'
};

function formatNumber(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(num);
}
</script>

<template>
  <p v-if="!songs.length" class="text-sm text-muted">{{ empty }}</p>

  <ul v-else class="space-y-1">
    <li
      v-for="song in songs"
      :key="song._id"
      class="group flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all duration-150 hover:border-line-soft hover:bg-panel/75"
    >
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <!-- Artist Avatar (if showArtist) -->
        <NuxtLink
          v-if="showArtist && song.artist"
          :to="localePath(`/izvodjac/${song.artist.slug}`)"
          class="shrink-0"
          :title="song.artist.name"
        >
          <img
            v-if="song.artist.hasImage || song.artist.imageBytes"
            :src="`${config.public.apiBase}/artists/${song.artist._id}/image`"
            :alt="song.artist.name"
            class="size-8 rounded-full object-cover ring-1 ring-line transition-transform duration-150 group-hover:scale-105"
          >
          <span
            v-else
            :style="avatarStyle(song.artist.name)"
            class="flex size-8 select-none items-center justify-center rounded-full text-[10px] font-semibold ring-1 ring-line-soft transition-transform duration-150 group-hover:scale-105"
          >{{ initials(song.artist.name) }}</span>
        </NuxtLink>

        <!-- Title and Artist Name -->
        <NuxtLink
          :to="localePath(`/pjesma/${song.slug}`)"
          class="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-2.5 group-hover:text-accent transition-colors"
        >
          <span class="truncate font-medium text-ink group-hover:text-accent">{{ song.title }}</span>
          <span v-if="showArtist && song.artist" class="truncate text-xs text-muted">
            <span v-if="song.artist.flag || flagOf(song.artist.country)" class="mr-1">
              {{ song.artist.flag || flagOf(song.artist.country) }}
            </span>{{ song.artist.name }}
          </span>
        </NuxtLink>
      </div>

      <!-- Right side metrics: Rating Stars, Difficulty Badge, Views, Likes/Favorites, Key -->
      <div class="flex shrink-0 items-center gap-3 sm:gap-4">
        <!-- Signed in, the stars are the vote. Signed out they stay a picture and
             lead to the reviews, where signing in is offered. -->
        <span v-if="auth.isAuthenticated" class="-my-0.5 shrink-0 self-center px-1 py-0.5">
          <RatingStars
            :value="song.rating || 0" :count="song.ratingCount || 0"
            :slug="song.slug" :arrangement-id="song.arrangementId"
            :song-title="song.title"
            :artist-name="song.artist?.name"
            :artist-id="song.artist?._id"
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

        <!-- Difficulty Pill (placed right after stars with fixed width for column alignment) -->
        <div class="hidden sm:flex w-16 shrink-0 justify-center">
          <span
            v-if="song.difficulty && DIFFICULTY_KEY[song.difficulty]"
            class="w-full text-center truncate rounded-full border px-1.5 py-0.5 text-[11px] font-medium"
            :class="DIFFICULTY_CLASS[song.difficulty]"
          >
            {{ $t(`song.${DIFFICULTY_KEY[song.difficulty]}`) }}
          </span>
        </div>

        <!-- Views -->
        <span
          class="hidden sm:inline-flex min-w-[3.25rem] items-center justify-end gap-1 font-mono text-xs text-muted"
          :title="`${song.views || 0} ${$t('song.viewsLabel') || 'pregleda'}`"
        >
          <Icon name="material-symbols:visibility-outline-rounded" class="text-xs text-faint" />
          <span>{{ formatNumber(song.views) }}</span>
        </span>

        <!-- Likes / Favorites -->
        <span
          class="hidden sm:inline-flex min-w-[2.75rem] items-center justify-end gap-1 font-mono text-xs text-muted"
          :title="`${song.favoriteCount || 0} ${$t('nav.saved')}`"
        >
          <Icon name="material-symbols:favorite-outline-rounded" class="text-xs text-faint" />
          <span>{{ formatNumber(song.favoriteCount) }}</span>
        </span>

        <!-- Musical Key -->
        <NuxtLink
          :to="localePath(`/pjesma/${song.slug}`)"
          class="w-7 shrink-0 text-right font-mono text-xs text-faint group-hover:text-accent"
        >{{ song.originalKey }}</NuxtLink>
      </div>
    </li>
  </ul>
</template>
