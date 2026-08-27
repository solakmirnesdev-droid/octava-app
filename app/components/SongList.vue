<script setup>
import { initials } from '~/utils/avatar';
import { safeFlag } from '~/utils/countries';

const auth = useAuthStore();
const localePath = useLocalePath();
const config = useRuntimeConfig();

const props = defineProps({
  songs: { type: Array, default: () => [] },
  empty: { type: String, default: 'Nema rezultata.' },
  /**
   * Off on an artist's own page, where every row would otherwise repeat the
   * name already standing at the top of the page.
   */
  showArtist: { type: Boolean, default: true },
  defaultView: { type: String, default: 'grid' },
  allowViewToggle: { type: Boolean, default: false },
  searchable: { type: Boolean, default: false },
  sortable: { type: Boolean, default: false }
});

const currentView = ref(props.defaultView);
watch(() => props.defaultView, (v) => { if (v) currentView.value = v; });
const searchQuery = ref('');
const sortBy = ref('default');

const DIFFICULTY_KEY = { easy: 'difficultyEasy', medium: 'difficultyMedium', hard: 'difficultyHard' };
const DIFFICULTY_CLASS = {
  easy:   'border-ok/30 bg-ok-soft text-ok',
  medium: 'border-warn/30 bg-warn-soft text-warn',
  hard:   'border-danger/30 bg-danger-soft text-danger'
};
const DIFFICULTY_DOT = {
  easy:   'bg-ok',
  medium: 'bg-warn',
  hard:   'bg-danger'
};

function formatNumber(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(num);
}

const filteredSongs = computed(() => {
  let list = props.songs || [];
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((s) => {
      const titleMatch = s.title?.toLowerCase().includes(q);
      const artistMatch = s.artist?.name?.toLowerCase().includes(q);
      const keyMatch = s.originalKey?.toLowerCase() === q || s.originalKey?.toLowerCase().includes(q);
      const diffMatch = s.difficulty?.toLowerCase().includes(q);
      return titleMatch || artistMatch || keyMatch || diffMatch;
    });
  }

  if (sortBy.value === 'popular') {
    list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
  } else if (sortBy.value === 'rating') {
    list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortBy.value === 'title') {
    list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  return list;
});
</script>

<template>
  <div v-if="!songs.length" class="py-8 text-center text-sm text-muted">
    {{ empty }}
  </div>

  <div v-else class="space-y-4">
    <!-- Top Search & Controls Toolbar (Only rendered when explicitly enabled) -->
    <div v-if="searchable || sortable || allowViewToggle" class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <!-- Search Input -->
      <div v-if="searchable && songs.length > 2" class="relative min-w-0 flex-1 max-w-sm">
        <Icon
          name="material-symbols:search-rounded"
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-faint"
        />
        <input
          v-model="searchQuery"
          type="search"
          :placeholder="$t('common.searchPlaceholder')"
          class="w-full rounded-xl border border-line bg-panel/80 py-1.5 pl-9 pr-8 text-xs sm:text-sm outline-none transition focus:border-accent focus:bg-panel text-ink placeholder:text-dim"
        >
        <button
          v-if="searchQuery"
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-faint hover:text-ink transition-colors"
          @click="searchQuery = ''"
        >
          <Icon name="material-symbols:close-rounded" />
        </button>
      </div>

      <!-- Sort and View mode group -->
      <div class="flex items-center gap-2 ml-auto">
        <!-- Sort Pills -->
        <div v-if="sortable" class="inline-flex items-center rounded-xl border border-line bg-panel/80 p-0.5 text-xs">
          <button
            type="button"
            class="rounded-lg px-2.5 py-1 transition-colors"
            :class="sortBy === 'default' ? 'bg-panel font-bold text-accent shadow-xs' : 'text-muted hover:text-ink'"
            @click="sortBy = 'default'"
          >
            {{ $t('common.sortPopular') }}
          </button>
          <button
            type="button"
            class="rounded-lg px-2.5 py-1 transition-colors"
            :class="sortBy === 'rating' ? 'bg-panel font-bold text-accent shadow-xs' : 'text-muted hover:text-ink'"
            @click="sortBy = 'rating'"
          >
            {{ $t('common.sortRating') }}
          </button>
          <button
            type="button"
            class="rounded-lg px-2.5 py-1 transition-colors"
            :class="sortBy === 'title' ? 'bg-panel font-bold text-accent shadow-xs' : 'text-muted hover:text-ink'"
            @click="sortBy = 'title'"
          >
            {{ $t('common.sortTitle') }}
          </button>
        </div>

        <!-- View Switcher (Grid / List) -->
        <div v-if="allowViewToggle" class="inline-flex items-center rounded-xl border border-line bg-panel/80 p-0.5 text-xs">
          <button
            type="button"
            class="flex items-center gap-1 rounded-lg px-2 py-1 transition-colors"
            :class="currentView === 'grid' ? 'bg-panel font-semibold text-accent shadow-xs' : 'text-muted hover:text-ink'"
            :aria-label="$t('common.viewGrid')"
            @click="currentView = 'grid'"
          >
            <Icon name="material-symbols:grid-view-rounded" class="text-sm" />
            <span class="hidden md:inline">{{ $t('common.viewGrid') }}</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1 rounded-lg px-2 py-1 transition-colors"
            :class="currentView === 'list' ? 'bg-panel font-semibold text-accent shadow-xs' : 'text-muted hover:text-ink'"
            :aria-label="$t('common.viewList')"
            @click="currentView = 'list'"
          >
            <Icon name="material-symbols:view-list-rounded" class="text-sm" />
            <span class="hidden md:inline">{{ $t('common.viewList') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty Search State -->
    <div
      v-if="searchQuery && !filteredSongs.length"
      class="rounded-2xl border border-line bg-panel/50 p-8 text-center"
    >
      <Icon name="material-symbols:search-off-rounded" class="mx-auto mb-2 text-2xl text-faint" />
      <p class="text-sm text-muted">Nema pjesama koje odgovaraju pojmu "{{ searchQuery }}".</p>
      <button
        type="button"
        class="mt-3 inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-accent hover:bg-panel transition-colors"
        @click="searchQuery = ''"
      >
        Prikaži sve pjesme
      </button>
    </div>

    <!-- 2026 Modern Grid View of Songs -->
    <ul
      v-else-if="currentView === 'grid'"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3.5"
    >
      <li
        v-for="song in filteredSongs"
        :key="song._id"
        class="group relative flex flex-col justify-between rounded-2xl border border-line bg-gradient-to-b from-panel/90 via-panel/60 to-surface/80 p-4 transition-all duration-200 hover:border-accent hover:bg-panel hover:shadow-lg hover:shadow-accent/5 backdrop-blur-xs overflow-hidden"
      >
        <!-- Top Ambient Glow -->
        <div class="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-accent/5 blur-xl transition-all duration-300 group-hover:bg-accent/15" />

        <!-- Top header row: Artist info or difficulty + Musical Key badge -->
        <div class="relative z-10 flex items-center justify-between gap-2">
          <!-- Artist info if showArtist is true -->
          <div v-if="showArtist && song.artist" class="flex min-w-0 items-center gap-2">
            <NuxtLink
              :to="localePath(`/izvodjac/${song.artist.slug}`)"
              class="shrink-0"
              :title="song.artist.name"
            >
              <img
                v-if="song.artist.hasImage || song.artist.imageBytes"
                :src="`${config.public.apiBase}/artists/${song.artist._id}/image`"
                :alt="song.artist.name"
                class="size-6 rounded-full object-cover ring-1 ring-line/80 group-hover:ring-accent"
              >
              <span
                v-else
                class="flex size-6 select-none items-center justify-center rounded-full border border-line bg-surface/90 font-mono text-[9px] font-bold text-muted ring-1 ring-line-soft transition-colors group-hover:border-accent group-hover:text-accent"
              >
                {{ initials(song.artist.name) }}
              </span>
            </NuxtLink>
            <NuxtLink
              :to="localePath(`/izvodjac/${song.artist.slug}`)"
              class="truncate text-xs font-medium text-muted hover:text-accent transition-colors"
            >
              <span v-if="safeFlag(song.artist.flag, song.artist.country)" class="mr-1">
                {{ safeFlag(song.artist.flag, song.artist.country) }}
              </span>{{ song.artist.name }}
            </NuxtLink>
          </div>

          <!-- Difficulty Badge if showArtist is false -->
          <div v-else class="flex items-center">
            <span
              v-if="song.difficulty && DIFFICULTY_KEY[song.difficulty]"
              class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              :class="DIFFICULTY_CLASS[song.difficulty]"
            >
              <span class="size-1.5 rounded-full" :class="DIFFICULTY_DOT[song.difficulty]" />
              {{ $t(`song.${DIFFICULTY_KEY[song.difficulty]}`) }}
            </span>
          </div>

          <!-- Right side badges: Key & Difficulty -->
          <div class="flex shrink-0 items-center gap-1.5 ml-auto">
            <span
              v-if="showArtist && song.difficulty && DIFFICULTY_KEY[song.difficulty]"
              class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              :class="DIFFICULTY_CLASS[song.difficulty]"
            >
              <span class="size-1 rounded-full" :class="DIFFICULTY_DOT[song.difficulty]" />
              {{ $t(`song.${DIFFICULTY_KEY[song.difficulty]}`) }}
            </span>

            <NuxtLink
              v-if="song.originalKey"
              :to="localePath(`/pjesma/${song.slug}`)"
              class="inline-flex items-center rounded-lg border border-accent/25 bg-accent-soft px-2 py-0.5 font-mono text-[11px] font-extrabold text-accent transition-all hover:bg-accent hover:text-on-accent shadow-2xs"
              :title="`${$t('song.key')}: ${song.originalKey}`"
            >
              {{ song.originalKey }}
            </NuxtLink>
          </div>
        </div>

        <!-- Card Body: Song Title -->
        <NuxtLink
          :to="localePath(`/pjesma/${song.slug}`)"
          class="relative z-10 my-3 block min-w-0"
        >
          <h3 class="text-[15px] sm:text-base font-bold text-ink group-hover:text-accent transition-colors line-clamp-2 tracking-tight leading-snug">
            {{ song.title }}
          </h3>
        </NuxtLink>

        <!-- Bottom row: Rating & Stats (Views & Favorites) -->
        <div class="relative z-10 flex items-center justify-between gap-2 border-t border-line-soft/80 pt-2.5">
          <!-- Rating Stars -->
          <div class="flex items-center gap-1.5">
            <span v-if="auth.isAuthenticated" class="-my-0.5 shrink-0 self-center">
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
              class="-my-0.5 shrink-0 self-center rounded px-0.5 transition-colors hover:text-accent"
              :title="song.ratingCount ? $t('song.seeReviews') : $t('song.beFirstToRate')"
            >
              <RatingStars :value="song.rating || 0" :count="song.ratingCount || 0" />
            </NuxtLink>
          </div>

          <!-- Stats (Views & Favorites) -->
          <div class="flex shrink-0 items-center gap-2.5 font-mono text-[11px] text-faint">
            <span
              class="inline-flex items-center gap-1"
              :title="`${song.views || 0} ${$t('song.viewsLabel') || 'pregleda'}`"
            >
              <Icon name="material-symbols:visibility-outline-rounded" class="text-xs" />
              <span>{{ formatNumber(song.views) }}</span>
            </span>

            <span
              v-if="song.favoriteCount"
              class="inline-flex items-center gap-1 text-accent"
              :title="`${song.favoriteCount} ${$t('nav.saved')}`"
            >
              <Icon name="material-symbols:favorite-rounded" class="text-xs" />
              <span>{{ formatNumber(song.favoriteCount) }}</span>
            </span>
          </div>
        </div>
      </li>
    </ul>

    <!-- Tabular List View -->
    <ul v-else class="space-y-1">
      <li
        v-for="song in filteredSongs"
        :key="song._id"
        class="group flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-line-soft hover:bg-panel/75"
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
              class="size-8 rounded-full object-cover ring-1 ring-line transition-colors group-hover:ring-accent"
            >
            <span
              v-else
              class="flex size-8 select-none items-center justify-center rounded-full border border-line bg-surface/90 font-mono text-xs font-bold text-muted ring-1 ring-line-soft transition-colors group-hover:border-accent group-hover:text-accent"
            >
              {{ initials(song.artist.name) }}
            </span>
          </NuxtLink>

          <!-- Title and Artist Name -->
          <NuxtLink
            :to="localePath(`/pjesma/${song.slug}`)"
            class="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-2.5 group-hover:text-accent transition-colors"
          >
            <span class="truncate font-medium text-ink group-hover:text-accent">{{ song.title }}</span>
            <span v-if="showArtist && song.artist" class="truncate text-xs text-muted">
              <span v-if="safeFlag(song.artist.flag, song.artist.country)" class="mr-1">
                {{ safeFlag(song.artist.flag, song.artist.country) }}
              </span>{{ song.artist.name }}
            </span>
          </NuxtLink>
        </div>

        <!-- Right side metrics: Rating Stars, Difficulty Badge, Views, Likes/Favorites, Key -->
        <div class="flex shrink-0 items-center gap-3 sm:gap-4">
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

          <!-- Difficulty Pill -->
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

          <!-- Musical Key Pill -->
          <div class="w-12 shrink-0 text-right">
            <NuxtLink
              v-if="song.originalKey"
              :to="localePath(`/pjesma/${song.slug}`)"
              class="inline-block rounded-md border border-accent/25 bg-accent-soft px-2 py-0.5 font-mono text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-on-accent"
              :title="`${$t('song.key')}: ${song.originalKey}`"
            >
              {{ song.originalKey }}
            </NuxtLink>
            <span v-else class="font-mono text-xs text-dim">—</span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
