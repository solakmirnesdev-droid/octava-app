<script setup>
import { initials, avatarStyle } from '~/utils/avatar';
import { flagOf } from '~/utils/countries';

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

const auth = useAuthStore();
const favorites = useFavoritesStore();

// Only the signed-in case needs the list; a visitor sees a link to sign in.
if (auth.isAuthenticated) await useAsyncData('favorites-artist', () => favorites.load());

const artist = computed(() => data.value?.artist);
const toast = useToast();

async function toggleArtistFavorite() {
  if (!artist.value) return;
  const wasSaved = favorites.hasArtist(artist.value._id);
  await favorites.toggleArtist(artist.value._id);
  if (!wasSaved) {
    toast.show({
      title: artist.value.name,
      artistName: artist.value.name,
      artistId: artist.value._id,
      hasImage: Boolean(artist.value.hasImage || artist.value.imageBytes),
      message: t('artist.artistSaved'),
      type: 'artist'
    });
  }
}

// Total views across all songs
const totalViews = computed(() => {
  return (artist.value?.songs || []).reduce((acc, s) => acc + (Number(s.views) || 0), 0);
});

// Overall average rating
const overallRating = computed(() => {
  const rated = (artist.value?.songs || []).filter((s) => s.rating && s.ratingCount);
  if (!rated.length) return 0;
  const sum = rated.reduce((acc, s) => acc + s.rating * s.ratingCount, 0);
  const count = rated.reduce((acc, s) => acc + s.ratingCount, 0);
  return count > 0 ? sum / count : 0;
});

// Signature keys (most common original keys for this artist)
const signatureKeys = computed(() => {
  const counts = {};
  for (const s of artist.value?.songs || []) {
    if (s.originalKey) {
      counts[s.originalKey] = (counts[s.originalKey] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
});

function formatViews(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(num);
}

useSeoMeta({
  title: () => `${artist.value?.name} — akordi | Octava`,
  description: () => `Svi akordi za pjesme izvođača ${artist.value?.name}.`
});
</script>

<template>
  <div v-if="artist" class="lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 xl:gap-10 items-start">
    <!-- Modern 2026 Artist Profile Sidebar -->
    <aside class="relative mb-8 overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-panel/95 via-panel/80 to-panel/95 p-6 sm:p-7 backdrop-blur-md shadow-sm lg:sticky lg:top-24 lg:mb-0 lg:self-start flex flex-col items-center text-center">
      <!-- Watermark musical background icon -->
      <Icon
        name="material-symbols:graphic-eq-rounded"
        aria-hidden="true"
        class="pointer-events-none absolute -top-8 -right-8 select-none text-[130px] text-ink/5"
      />

      <!-- Avatar with ambient ring & floating country flag -->
      <div class="relative mb-4 group">
        <div class="absolute -inset-1 rounded-full bg-accent/20 blur-md"></div>
        <img
          v-if="artist.hasImage"
          :src="`${config.public.apiBase}/artists/${artist._id}/image`"
          :alt="artist.name"
          class="relative size-28 sm:size-32 rounded-full object-cover ring-2 ring-line-strong shadow-xl"
        >
        <div
          v-else
          class="relative flex size-28 sm:size-32 select-none items-center justify-center rounded-full border border-line-strong bg-surface font-mono text-4xl font-extrabold tracking-tight text-ink ring-2 ring-line-soft shadow-xl transition-all group-hover:text-accent group-hover:border-accent/40"
        >
          {{ initials(artist.name) }}
        </div>

        <span
          v-if="artist.flag || flagOf(artist.country)"
          class="absolute -bottom-1 right-1 flex size-8 items-center justify-center rounded-full border border-line bg-panel shadow-md text-lg select-none"
          :title="artist.country || ''"
        >
          {{ artist.flag || flagOf(artist.country) }}
        </span>
      </div>

      <!-- Artist Name -->
      <h1 class="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-ink leading-tight">
        {{ artist.name }}
      </h1>

      <!-- Origin pill -->
      <div v-if="artist.origin || artist.country" class="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs text-muted">
        <Icon name="material-symbols:location-on-rounded" class="text-accent text-xs" />
        <span>{{ artist.origin || artist.country }}</span>
      </div>

      <!-- 3-Column Metrics Ribbon -->
      <div class="mt-4 grid grid-cols-3 gap-1 w-full rounded-2xl border border-line-soft bg-surface/60 p-2.5 text-center">
        <div class="flex flex-col items-center">
          <span class="font-mono text-sm font-bold text-ink">{{ artist.songs?.length || 0 }}</span>
          <span class="text-[10px] text-faint uppercase font-medium mt-0.5">Pjesama</span>
        </div>
        <div class="flex flex-col items-center border-x border-line-soft">
          <span class="font-mono text-sm font-bold text-warn flex items-center gap-0.5">
            <Icon name="material-symbols:star-rounded" class="text-xs" />
            {{ overallRating > 0 ? overallRating.toFixed(1) : '–' }}
          </span>
          <span class="text-[10px] text-faint uppercase font-medium mt-0.5">Ocjena</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="font-mono text-sm font-bold text-ink">{{ formatViews(totalViews) }}</span>
          <span class="text-[10px] text-faint uppercase font-medium mt-0.5">Pregleda</span>
        </div>
      </div>

      <!-- Save Button -->
      <!-- AI-TRAP: both icon names are written out as literals and toggled
           with v-show, never bound as one expression. @nuxt/icon builds its
           client bundle by scanning source for literal names; a computed
           name renders a correctly sized SVG with no paths in it. -->
      <button
        v-if="auth.isAuthenticated"
        class="mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-semibold transition-all shadow-xs"
        :class="favorites.hasArtist(artist._id)
          ? 'border border-accent bg-accent text-on-accent hover:opacity-90'
          : 'border border-line-strong bg-surface hover:bg-raised text-ink hover:border-accent hover:text-accent'"
        @click="toggleArtistFavorite"
      >
        <Icon v-show="favorites.hasArtist(artist._id)" name="material-symbols:favorite-rounded" class="text-sm" />
        <Icon v-show="!favorites.hasArtist(artist._id)" name="material-symbols:favorite-outline-rounded" class="text-sm" />
        <span>{{ favorites.hasArtist(artist._id) ? $t('artist.saved') : $t('artist.save') }}</span>
      </button>

      <NuxtLink
        v-else
        :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
        class="mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-semibold border border-line-strong bg-surface hover:bg-raised text-ink hover:border-accent hover:text-accent transition-colors shadow-xs"
      >
        <Icon name="material-symbols:favorite-outline-rounded" class="text-sm" />
        <span>{{ $t('artist.save') }}</span>
      </NuxtLink>

      <!-- Genres -->
      <div v-if="artist.genres?.length" class="mt-4 flex flex-wrap justify-center gap-1.5 w-full">
        <NuxtLink
          v-for="genre in artist.genres" :key="genre._id"
          :to="localePath(`/zanr/${genre.slug}`)"
          class="rounded-lg border border-line bg-surface/50 px-2.5 py-1 text-xs text-muted hover:border-accent hover:text-accent hover:bg-surface transition-colors font-medium"
        >
          {{ genre.name }}
        </NuxtLink>
      </div>

      <!-- Signature Keys -->
      <div v-if="signatureKeys.length" class="mt-4 w-full border-t border-line-soft/80 pt-3.5 text-left">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-faint mb-2 flex items-center gap-1.5">
          <Icon name="material-symbols:music-note-rounded" class="text-accent text-xs" />
          Najčešći tonaliteti
        </p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="k in signatureKeys" :key="k.key"
            class="inline-flex items-center gap-1 rounded-md border border-line bg-surface/90 px-2 py-0.5 font-mono text-xs font-bold text-accent shadow-2xs"
          >
            {{ k.key }}
            <span class="text-[10px] text-faint font-normal">({{ k.count }})</span>
          </span>
        </div>
      </div>

      <!-- Details (Active years & Website) -->
      <div v-if="artist.activeFrom || artist.website" class="mt-4 w-full space-y-2 border-t border-line-soft/80 pt-3 text-xs text-left">
        <div v-if="artist.activeFrom" class="flex items-center justify-between gap-2">
          <span class="text-faint flex items-center gap-1.5">
            <Icon name="material-symbols:history-rounded" class="text-xs text-dim" />
            {{ $t('artist.active') }}
          </span>
          <span class="font-mono font-medium text-muted">
            {{ artist.activeFrom }}<span v-if="artist.activeTo">–{{ artist.activeTo }}</span>
            <span v-else class="text-faint">–</span>
          </span>
        </div>

        <div v-if="artist.website" class="flex items-center justify-between gap-2">
          <span class="text-faint flex items-center gap-1.5">
            <Icon name="material-symbols:language" class="text-xs text-dim" />
            {{ $t('artist.website') }}
          </span>
          <a
            :href="artist.website" target="_blank" rel="noopener nofollow"
            class="truncate text-accent hover:underline font-medium"
          >
            {{ artist.website.replace(/^https?:\/\//, '') }}
          </a>
        </div>
      </div>

      <!-- Bio quote box -->
      <div v-if="artist.bio" class="mt-4 w-full rounded-xl border border-line-soft bg-surface/40 p-3 text-xs leading-relaxed text-muted text-left">
        <p class="line-clamp-4 text-faint">{{ artist.bio }}</p>
      </div>
    </aside>

    <!-- Main Content: SongList with Search, Filters and Grid/List view -->
    <div class="min-w-0 flex-1">
      <SongList
        :songs="artist.songs || []"
        :show-artist="false"
        :empty="$t('page.noArtistSongs')"
        :searchable="true"
        :sortable="true"
        default-view="grid"
      />
    </div>
  </div>
</template>
