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
  <!--
    AI-TRAP: do NOT centre this sidebar against the song column. It was tried and
    reverted, and it looks correct on a wide screen — which is exactly what makes
    it tempting.

    The song grid drops to two columns below about 1200px and to one below the
    breakpoint, so its height depends on the viewport, not on the design. Centring
    a 558px card inside a column that grows to 750px and beyond pushes it down by
    half the difference: 93px at 1100px wide, and further on anything narrower or
    zoomed, until the card sits below the fold with an empty panel above it.

    items-start plus lg:sticky is the right pair here. The dead space under a
    short card is cosmetic; a sidebar the reader has to scroll to find is not.
  -->
  <div v-if="artist" class="lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 xl:gap-10 items-start">
    <!-- Modern 2026 Artist Profile Sidebar Card -->
    <aside class="relative mb-8 overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-panel/95 via-panel/85 to-panel/95 p-5 sm:p-6 backdrop-blur-xl shadow-md lg:sticky lg:top-32 lg:mb-0 lg:self-start flex flex-col items-center text-center space-y-4">
      <!-- Ambient hero glow backdrop -->
      <div class="pointer-events-none absolute -top-12 -inset-x-6 h-40 bg-radial from-accent/20 via-accent/5 to-transparent blur-2xl" />

      <!-- Watermark musical background icon -->
      <Icon
        name="material-symbols:graphic-eq-rounded"
        aria-hidden="true"
        class="pointer-events-none absolute -top-8 -right-8 select-none text-[120px] text-ink/5"
      />

      <!-- Avatar with ambient ring & floating country flag -->
      <div class="relative group mt-1">
        <div class="absolute -inset-1.5 rounded-full bg-accent/25 blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
        <img
          v-if="artist.hasImage"
          :src="`${config.public.apiBase}/artists/${artist._id}/image`"
          :alt="artist.name"
          class="relative size-28 sm:size-32 rounded-full object-cover ring-4 ring-surface/90 shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
        >
        <div
          v-else
          class="relative flex size-28 sm:size-32 select-none items-center justify-center rounded-full border border-line-strong bg-surface font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-ink ring-4 ring-surface/90 shadow-2xl transition-all duration-300 group-hover:text-accent group-hover:scale-[1.02]"
        >
          {{ initials(artist.name) }}
        </div>

        <span
          v-if="artist.flag || flagOf(artist.country)"
          class="absolute -bottom-0.5 right-1 flex size-8 items-center justify-center rounded-full border border-line bg-panel/95 shadow-md text-lg select-none ring-2 ring-panel"
          :title="artist.country || ''"
        >
          {{ artist.flag || flagOf(artist.country) }}
        </span>
      </div>

      <!-- Artist Name & Origin Pill -->
      <div class="space-y-1.5">
        <h1 class="text-xl sm:text-2xl font-black tracking-tight text-ink uppercase leading-tight">
          {{ artist.name }}
        </h1>

        <div v-if="artist.origin || artist.country" class="inline-flex items-center gap-1.5 rounded-full border border-line-soft bg-surface/80 px-3 py-0.5 text-xs text-muted shadow-2xs font-medium">
          <Icon name="material-symbols:location-on-rounded" class="text-accent text-xs" />
          <span>{{ artist.origin || artist.country }}</span>
        </div>
      </div>

      <!-- 3-Column Bento Stats Grid -->
      <div class="grid grid-cols-3 gap-2 w-full pt-1">
        <div class="flex flex-col items-center justify-center rounded-2xl border border-line-soft bg-surface/70 p-2.5 shadow-2xs transition-all hover:bg-surface hover:border-line">
          <span class="font-mono text-base font-extrabold text-ink leading-none">{{ artist.songs?.length || 0 }}</span>
          <span class="text-[10px] text-faint uppercase font-bold tracking-wider mt-1">Pjesama</span>
        </div>

        <div class="flex flex-col items-center justify-center rounded-2xl border border-line-soft bg-surface/70 p-2.5 shadow-2xs transition-all hover:bg-surface hover:border-line">
          <span class="font-mono text-base font-extrabold text-warn flex items-center gap-0.5 leading-none">
            <Icon name="material-symbols:star-rounded" class="text-sm" />
            {{ overallRating > 0 ? overallRating.toFixed(1) : '–' }}
          </span>
          <span class="text-[10px] text-faint uppercase font-bold tracking-wider mt-1">Ocjena</span>
        </div>

        <div class="flex flex-col items-center justify-center rounded-2xl border border-line-soft bg-surface/70 p-2.5 shadow-2xs transition-all hover:bg-surface hover:border-line">
          <span class="font-mono text-base font-extrabold text-ink leading-none">{{ formatViews(totalViews) }}</span>
          <span class="text-[10px] text-faint uppercase font-bold tracking-wider mt-1">Pregleda</span>
        </div>
      </div>

      <!-- Save CTA Button -->
      <div class="w-full">
        <AppButton
          v-if="auth.isAuthenticated"
          :variant="favorites.hasArtist(artist._id) ? 'primary' : 'secondary'"
          size="sm"
          class="w-full"
          @click="toggleArtistFavorite"
        >
          <template #icon>
            <Icon
              v-if="favorites.hasArtist(artist._id)"
              name="material-symbols:favorite-rounded"
              class="text-base"
            />
            <Icon
              v-else
              name="material-symbols:favorite-outline-rounded"
              class="text-base"
            />
          </template>
          {{ favorites.hasArtist(artist._id) ? $t('artist.saved') : $t('artist.save') }}
        </AppButton>

        <AppButton
          v-else
          :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
          variant="secondary"
          size="sm"
          icon="material-symbols:favorite-outline-rounded"
          class="w-full"
        >
          {{ $t('artist.save') }}
        </AppButton>
      </div>

      <!-- Genres Tags -->
      <div v-if="artist.genres?.length" class="flex flex-wrap justify-center gap-1.5 w-full">
        <NuxtLink
          v-for="genre in artist.genres" :key="genre._id"
          :to="localePath(`/zanr/${genre.slug}`)"
        >
          <AppBadge variant="default" size="xs" class="hover:border-accent hover:text-accent cursor-pointer transition-colors">
            {{ genre.name }}
          </AppBadge>
        </NuxtLink>
      </div>

      <!-- Signature Keys (Harmonic Signature) -->
      <div v-if="signatureKeys.length" class="w-full border-t border-line-soft/80 pt-3.5 text-left space-y-2">
        <p class="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center justify-between">
          <span class="flex items-center gap-1.5">
            <Icon name="material-symbols:music-note-rounded" class="text-accent text-sm" />
            Najčešći tonaliteti
          </span>
          <span class="text-[10px] text-faint font-mono font-normal">Top {{ signatureKeys.length }}</span>
        </p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="(k, idx) in signatureKeys" :key="k.key"
            class="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-xs font-bold transition-all"
            :class="idx === 0
              ? 'border-accent/40 bg-accent-soft text-accent shadow-2xs'
              : 'border-line-soft bg-surface/90 text-body hover:border-line hover:text-ink'"
          >
            <span>{{ k.key }}</span>
            <span class="text-[10px] font-normal opacity-60 font-sans">({{ k.count }})</span>
          </span>
        </div>
      </div>

      <!-- Details (Active years & Website) -->
      <div v-if="artist.activeFrom || artist.website" class="w-full space-y-2 border-t border-line-soft/80 pt-3 text-xs text-left">
        <div v-if="artist.activeFrom" class="flex items-center justify-between gap-2">
          <span class="text-muted flex items-center gap-1.5">
            <Icon name="material-symbols:history-rounded" class="text-xs text-faint" />
            {{ $t('artist.active') }}
          </span>
          <span class="font-mono font-medium text-ink bg-surface/60 border border-line-soft px-2 py-0.5 rounded-md">
            {{ artist.activeFrom }}<span v-if="artist.activeTo">–{{ artist.activeTo }}</span>
            <span v-else class="text-faint">–</span>
          </span>
        </div>

        <div v-if="artist.website" class="flex items-center justify-between gap-2">
          <span class="text-muted flex items-center gap-1.5">
            <Icon name="material-symbols:language" class="text-xs text-faint" />
            {{ $t('artist.website') }}
          </span>
          <a
            :href="artist.website" target="_blank" rel="noopener nofollow"
            class="truncate text-accent hover:underline font-medium inline-flex items-center gap-1 max-w-[160px]"
          >
            <span class="truncate">{{ artist.website.replace(/^https?:\/\//, '').replace(/\/$/, '') }}</span>
            <Icon name="material-symbols:open-in-new-rounded" class="text-[11px] shrink-0" />
          </a>
        </div>
      </div>

      <!-- Bio quote box -->
      <div v-if="artist.bio" class="w-full rounded-2xl border border-line-soft bg-surface/40 p-3 text-xs leading-relaxed text-body text-left">
        <p class="line-clamp-4 text-faint font-sans">{{ artist.bio }}</p>
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
