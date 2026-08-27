<script setup>
import { initials, avatarStyle } from '~/utils/avatar';
import { flagOf } from '~/utils/countries';

const localePath = useLocalePath();
const route = useRoute();
const { $api } = useNuxtApp();
const config = useRuntimeConfig();

const letter = computed(() => route.query.letter || '');
const genre = computed(() => route.query.genre || '');
const page = computed(() => Number(route.query.page) || 1);

const [{ data }, { data: genreData }] = await Promise.all([
  useAsyncData(
    () => `artists-${letter.value}-${genre.value}-${page.value}`,
    () => $api('/artists', {
      params: { letter: letter.value || undefined, genre: genre.value || undefined, page: page.value, limit: 60 }
    }),
    { watch: [letter, genre, page] }
  ),
  useAsyncData('genres', () => $api('/genres'))
]);

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const available = computed(() => new Set(data.value?.letters || []));

useSeoMeta({
  title: 'Izvođači | Octava',
  description: 'Svi izvođači na Octavi — pretraži po slovu ili rubrici.'
});
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-ink">{{ $t('page.artists') }}</h1>
      <p class="mt-1 text-sm text-muted">Pregledaj sve izvođače, filtriraj po početnom slovu ili muzičkoj rubrici.</p>
    </header>

    <!-- Letters with no artists stay visible but inert, so the row does not
         reflow every time the filter changes. -->
    <nav class="flex flex-wrap gap-1" aria-label="Alphabet navigation">
      <NuxtLink
        :to="{ query: { ...route.query, letter: undefined, page: undefined } }"
        class="rounded-lg px-2.5 py-1 text-sm transition hover:bg-raised"
        :class="!letter ? 'bg-ink text-on-ink hover:bg-ink font-medium shadow-xs' : 'text-muted hover:text-ink'"
      >{{ $t('page.allFilter') }}</NuxtLink>

      <template v-for="char in ALPHABET" :key="char">
        <NuxtLink
          v-if="available.has(char)"
          :to="{ query: { ...route.query, letter: char, page: undefined } }"
          class="rounded-lg px-2 py-1 font-mono text-sm transition hover:bg-raised"
          :class="letter === char ? 'bg-ink text-on-ink hover:bg-ink font-bold shadow-xs' : 'text-muted hover:text-ink'"
        >{{ char }}</NuxtLink>
        <span v-else class="cursor-default px-2 py-1 font-mono text-sm text-dim">{{ char }}</span>
      </template>
    </nav>

    <nav class="flex flex-wrap gap-1.5 border-b border-line pb-4" aria-label="Genre filters">
      <NuxtLink
        :to="{ query: { ...route.query, genre: undefined, page: undefined } }"
        class="rounded-full border px-3 py-1 text-xs transition"
        :class="!genre ? 'border-accent bg-accent-soft text-accent font-medium' : 'border-line-strong text-muted hover:border-accent hover:text-accent'"
      >{{ $t('page.allRubrics') }}</NuxtLink>

      <NuxtLink
        v-for="g in genreData?.genres || []" :key="g._id"
        :to="{ query: { ...route.query, genre: g.slug, page: undefined } }"
        class="rounded-full border px-3 py-1 text-xs transition"
        :class="genre === g.slug ? 'border-accent bg-accent-soft text-accent font-medium' : 'border-line-strong text-muted hover:border-accent hover:text-accent'"
      >{{ g.name }}</NuxtLink>
    </nav>

    <p v-if="!data?.artists?.length" class="py-8 text-center text-sm text-muted">
      {{ $t('page.noArtists') }}
    </p>

    <!-- Rich Portrait Artist Cards Grid -->
    <ul v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
      <li v-for="artist in data.artists" :key="artist._id">
        <NuxtLink
          :to="localePath(`/izvodjac/${artist.slug}`)"
          class="group relative flex flex-col items-center text-center rounded-2xl border border-line bg-panel/70 p-4 sm:p-5 backdrop-blur-xs transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg hover:bg-panel"
        >
          <!-- Country Flag badge in top right corner -->
          <span
            v-if="artist.flag || flagOf(artist.country)"
            class="absolute top-2.5 right-2.5 text-base sm:text-lg select-none"
            :title="artist.country || ''"
          >
            {{ artist.flag || flagOf(artist.country) }}
          </span>

          <!-- Artist Avatar (Image or Initials) -->
          <div class="relative mt-1 mb-3">
            <img
              v-if="artist.hasImage"
              :src="`${config.public.apiBase}/artists/${artist._id}/image`"
              :alt="artist.name"
              class="size-16 sm:size-20 rounded-full object-cover ring-2 ring-line/70 transition-all duration-200 group-hover:ring-accent group-hover:scale-105 shadow-sm"
            >
            <span
              v-else
              :style="avatarStyle(artist.name)"
              class="flex size-16 sm:size-20 select-none items-center justify-center rounded-full text-base sm:text-lg font-bold ring-2 ring-line/70 transition-all duration-200 group-hover:ring-accent group-hover:scale-105 shadow-sm"
            >
              {{ initials(artist.name) }}
            </span>
          </div>

          <!-- Artist Name -->
          <h2 class="w-full truncate text-sm sm:text-base font-semibold text-ink transition-colors group-hover:text-accent">
            {{ artist.name }}
          </h2>

          <!-- Origin if present -->
          <p v-if="artist.origin" class="w-full truncate text-[11px] text-faint mt-0.5">
            {{ artist.origin }}
          </p>

          <!-- Stats row: Song count & Overall rating -->
          <div class="mt-3 flex items-center justify-center gap-2.5 w-full border-t border-line-soft/80 pt-2.5 text-xs text-muted font-mono">
            <!-- Songs -->
            <span class="inline-flex items-center gap-1" :title="`${artist.songCount || 0} pjesama`">
              <Icon name="material-symbols:music-note-rounded" class="text-xs text-accent" />
              <span>{{ artist.songCount || 0 }}</span>
            </span>

            <span class="text-dim">·</span>

            <!-- Overall Rating -->
            <span
              class="inline-flex items-center gap-1"
              :title="artist.rating ? `${artist.rating.toFixed(1)} / 5 (${artist.ratingCount || 0} ocjena)` : 'Nema ocjena'"
            >
              <Icon name="material-symbols:star-rounded" class="text-xs" :class="artist.rating ? 'text-warn' : 'text-faint'" />
              <span>{{ artist.rating ? artist.rating.toFixed(1) : '—' }}</span>
            </span>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
