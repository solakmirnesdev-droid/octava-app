<script setup>
import { initials } from '~/utils/avatar';
import { flagOf, countryName } from '~/utils/countries';

const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();
const config = useRuntimeConfig();

const letter = computed(() => route.query.letter || '');
const genre = computed(() => route.query.genre || '');
const country = computed(() => route.query.country || '');
const page = computed(() => Number(route.query.page) || 1);

const searchQuery = ref('');
const openDropdown = ref(null);

const [{ data }, { data: genreData }] = await Promise.all([
  useAsyncData(
    () => `artists-${letter.value}-${genre.value}-${country.value}-${page.value}`,
    () => $api('/artists', {
      params: {
        letter: letter.value || undefined,
        genre: genre.value || undefined,
        country: country.value || undefined,
        page: page.value,
        limit: 60
      }
    }),
    { watch: [letter, genre, country, page] }
  ),
  useAsyncData('genres', () => $api('/genres'))
]);

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const available = computed(() => new Set(data.value?.letters || []));

function setFilter(key, value) {
  router.push({
    query: {
      ...route.query,
      [key]: value || undefined,
      page: undefined
    }
  });
}

function toggleDropdown(name) {
  openDropdown.value = openDropdown.value === name ? null : name;
}

function selectFilter(key, value) {
  setFilter(key, value);
  openDropdown.value = null;
}

function clearAllFilters() {
  searchQuery.value = '';
  openDropdown.value = null;
  router.push({ query: {} });
}

function onClickOutside(e) {
  if (!e.target.closest('[data-dropdown]')) {
    openDropdown.value = null;
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', onClickOutside);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', onClickOutside);
  }
});

const activeFiltersCount = computed(() => {
  let count = 0;
  if (letter.value) count++;
  if (genre.value) count++;
  if (country.value) count++;
  if (searchQuery.value.trim()) count++;
  return count;
});

const filteredArtists = computed(() => {
  const list = data.value?.artists || [];
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter(a =>
    a.name?.toLowerCase().includes(q) ||
    a.origin?.toLowerCase().includes(q)
  );
});

useSeoMeta({
  title: 'Izvođači | Octava',
  description: 'Svi izvođači na Octavi — pretraži po slovu ili rubrici.'
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <span class="flex size-8 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <SingerIcon size="1.3em" />
          </span>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-ink">{{ $t('page.artists') }}</h1>
        </div>
        <p class="mt-1 text-xs sm:text-sm text-muted">
          Pregledaj i filtriraj izvođače domaće i regionalne muzike.
        </p>
      </div>

      <!-- Quick Total Metric Badge -->
      <div class="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-line bg-panel/70 px-3 py-1.5 backdrop-blur-xs shadow-2xs font-mono text-xs text-muted">
        <Icon name="material-symbols:group-rounded" class="text-sm text-accent" />
        <span>{{ filteredArtists.length }} {{ filteredArtists.length === 1 ? 'izvođač' : 'izvođača' }}</span>
      </div>
    </header>

    <!-- Modern Studio Filter Hub (Card Container) with elevated z-index -->
    <div class="relative z-30 rounded-2xl border border-line bg-panel/85 p-3.5 sm:p-4 backdrop-blur-md shadow-xs space-y-3.5">
      <!-- 1. Top Controls Bar: Search Input + Custom Studio Dropdowns + Reset -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <!-- Live Instant Search Box -->
        <div class="relative flex-1 min-w-[200px]">
          <Icon
            name="material-symbols:search-rounded"
            class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-muted"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Brza pretraga po imenu ili gradu..."
            class="w-full rounded-xl border border-line bg-surface/90 hover:bg-surface pl-10 pr-9 py-2 text-xs sm:text-sm font-medium text-ink placeholder:text-faint focus:border-accent focus:bg-surface focus:outline-none transition-all shadow-2xs"
          >
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full bg-raised hover:bg-line text-muted hover:text-ink transition-colors"
            title="Očisti pretragu"
            @click="searchQuery = ''"
          >
            <Icon name="material-symbols:close-rounded" class="text-xs" />
          </button>
        </div>

        <!-- Custom Styled Genre Dropdown -->
        <div
          class="relative flex-1 sm:max-w-[200px]"
          :class="openDropdown === 'genre' ? 'z-50' : 'z-10'"
          data-dropdown
        >
          <button
            type="button"
            class="flex items-center justify-between gap-2 w-full rounded-xl border border-line bg-surface/90 hover:bg-surface px-3 py-2 text-xs sm:text-sm font-semibold text-ink focus:border-accent focus:outline-none transition-all cursor-pointer shadow-2xs text-left"
            :class="genre ? '!border-accent/40 !bg-accent-soft text-accent' : ''"
            @click="toggleDropdown('genre')"
          >
            <div class="flex items-center gap-2 truncate min-w-0">
              <Icon name="material-symbols:category-rounded" class="text-base text-accent shrink-0" />
              <span class="truncate">{{ genreData?.genres?.find(g => g.slug === genre)?.name || $t('page.allRubrics') }}</span>
            </div>
            <Icon
              name="material-symbols:keyboard-arrow-down-rounded"
              class="text-base text-muted shrink-0 transition-transform duration-200"
              :class="openDropdown === 'genre' ? 'rotate-180 text-accent' : ''"
            />
          </button>

          <!-- Dropdown Popover Menu -->
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-1 scale-95"
          >
            <div
              v-show="openDropdown === 'genre'"
              class="absolute left-0 top-full mt-1.5 w-56 sm:w-60 z-50 rounded-2xl border border-line bg-panel/98 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 max-h-64 overflow-y-auto space-y-0.5"
            >
              <button
                type="button"
                class="flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-semibold transition-colors text-left"
                :class="!genre ? 'bg-accent-soft text-accent font-bold' : 'text-body hover:bg-surface hover:text-ink'"
                @click="selectFilter('genre', '')"
              >
                <span>{{ $t('page.allRubrics') }}</span>
                <Icon v-if="!genre" name="material-symbols:check-rounded" class="text-sm text-accent" />
              </button>

              <button
                v-for="g in genreData?.genres || []" :key="g._id"
                type="button"
                class="flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-semibold transition-colors text-left"
                :class="genre === g.slug ? 'bg-accent-soft text-accent font-bold' : 'text-body hover:bg-surface hover:text-ink'"
                @click="selectFilter('genre', g.slug)"
              >
                <span class="truncate">{{ g.name }}</span>
                <Icon v-if="genre === g.slug" name="material-symbols:check-rounded" class="text-sm text-accent" />
              </button>
            </div>
          </Transition>
        </div>

        <!-- Custom Styled Country Dropdown -->
        <div
          v-if="(data?.countries || []).length"
          class="relative flex-1 sm:max-w-[220px]"
          :class="openDropdown === 'country' ? 'z-50' : 'z-10'"
          data-dropdown
        >
          <button
            type="button"
            class="flex items-center justify-between gap-2 w-full rounded-xl border border-line bg-surface/90 hover:bg-surface px-3 py-2 text-xs sm:text-sm font-semibold text-ink focus:border-accent focus:outline-none transition-all cursor-pointer shadow-2xs text-left"
            :class="country ? '!border-accent/40 !bg-accent-soft text-accent' : ''"
            @click="toggleDropdown('country')"
          >
            <div class="flex items-center gap-2 truncate min-w-0">
              <Icon name="material-symbols:public-rounded" class="text-base text-accent shrink-0" />
              <span class="truncate">
                {{ country ? (flagOf(country) ? flagOf(country) + ' ' : '') + countryName(country, $i18n.locale) : $t('page.allCountries') }}
              </span>
            </div>
            <Icon
              name="material-symbols:keyboard-arrow-down-rounded"
              class="text-base text-muted shrink-0 transition-transform duration-200"
              :class="openDropdown === 'country' ? 'rotate-180 text-accent' : ''"
            />
          </button>

          <!-- Dropdown Popover Menu -->
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-1 scale-95"
          >
            <div
              v-show="openDropdown === 'country'"
              class="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-64 sm:w-72 z-50 rounded-2xl border border-line bg-panel/98 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 max-h-72 overflow-y-auto space-y-0.5"
            >
              <button
                type="button"
                class="flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-semibold transition-colors text-left"
                :class="!country ? 'bg-accent-soft text-accent font-bold' : 'text-body hover:bg-surface hover:text-ink'"
                @click="selectFilter('country', '')"
              >
                <span>{{ $t('page.allCountries') }}</span>
                <Icon v-if="!country" name="material-symbols:check-rounded" class="text-sm text-accent" />
              </button>

              <button
                v-for="c in data?.countries || []" :key="c.code"
                type="button"
                class="flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-semibold transition-colors text-left"
                :class="country === c.code ? 'bg-accent-soft text-accent font-bold' : 'text-body hover:bg-surface hover:text-ink'"
                @click="selectFilter('country', c.code)"
              >
                <span class="flex items-center gap-1.5 truncate">
                  <span v-if="flagOf(c.code)" class="select-none text-sm">{{ flagOf(c.code) }}</span>
                  <span class="truncate">{{ countryName(c.code, $i18n.locale) }}</span>
                </span>
                <div class="flex items-center gap-1.5 shrink-0 ml-2">
                  <span class="font-mono text-[11px] opacity-60 rounded bg-raised px-1.5 py-0.5">{{ c.count }}</span>
                  <Icon v-if="country === c.code" name="material-symbols:check-rounded" class="text-sm text-accent" />
                </div>
              </button>
            </div>
          </Transition>
        </div>

        <!-- Reset All Filters Button -->
        <button
          v-if="activeFiltersCount > 0"
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-accent/30 bg-accent-soft hover:bg-accent hover:text-on-accent text-accent px-3 py-2 text-xs font-bold transition-all shadow-2xs shrink-0"
          @click="clearAllFilters"
        >
          <Icon name="material-symbols:restart-alt-rounded" class="text-sm" />
          <span>Poništi ({{ activeFiltersCount }})</span>
        </button>
      </div>

      <!-- 2. Bottom Row: Sleek Alphabetical Quick-Jump Scrubber Bar -->
      <div class="border-t border-line-soft/80 pt-3">
        <nav
          class="flex items-center gap-1 overflow-x-auto pb-1 text-xs [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Alphabet navigation"
        >
          <button
            type="button"
            class="shrink-0 rounded-lg px-2.5 py-1 font-semibold transition-all shadow-2xs outline-none"
            :class="!letter
              ? 'bg-accent text-on-accent font-bold shadow-xs'
              : 'border border-transparent text-muted hover:border-line hover:bg-surface hover:text-ink'"
            @click="setFilter('letter', '')"
          >
            {{ $t('page.allFilter') }}
          </button>

          <template v-for="char in ALPHABET" :key="char">
            <button
              v-if="available.has(char)"
              type="button"
              class="shrink-0 size-7 font-mono font-bold rounded-lg flex items-center justify-center transition-all shadow-2xs outline-none"
              :class="letter === char
                ? 'bg-accent text-on-accent shadow-xs scale-105'
                : 'border border-transparent text-muted hover:border-line hover:bg-surface hover:text-ink'"
              @click="setFilter('letter', char)"
            >
              {{ char }}
            </button>
            <span
              v-else
              class="shrink-0 size-7 font-mono text-dim flex items-center justify-center select-none opacity-40 text-xs"
            >
              {{ char }}
            </span>
          </template>
        </nav>
      </div>
    </div>

    <!-- Active Filter Tags / Chips -->
    <div v-if="activeFiltersCount > 0" class="flex flex-wrap items-center gap-2 text-xs">
      <span class="text-faint font-semibold">Aktivni filteri:</span>

      <span v-if="searchQuery" class="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-0.5 text-accent font-semibold">
        <span>Tekst: "{{ searchQuery }}"</span>
        <button type="button" class="hover:opacity-75" @click="searchQuery = ''">✕</button>
      </span>

      <span v-if="letter" class="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-0.5 text-accent font-semibold">
        <span>Slovo: {{ letter }}</span>
        <button type="button" class="hover:opacity-75" @click="setFilter('letter', '')">✕</button>
      </span>

      <span v-if="genre" class="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-0.5 text-accent font-semibold">
        <span>Žanr: {{ genreData?.genres?.find(g => g.slug === genre)?.name || genre }}</span>
        <button type="button" class="hover:opacity-75" @click="setFilter('genre', '')">✕</button>
      </span>

      <span v-if="country" class="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-0.5 text-accent font-semibold">
        <span>Država: {{ countryName(country, $i18n.locale) }}</span>
        <button type="button" class="hover:opacity-75" @click="setFilter('country', '')">✕</button>
      </span>
    </div>

    <!-- No results state -->
    <div v-if="!filteredArtists.length" class="rounded-2xl border border-line bg-panel/50 py-12 text-center">
      <Icon name="material-symbols:search-off-rounded" class="mx-auto text-4xl text-faint mb-2" />
      <p class="text-sm font-semibold text-ink">{{ $t('page.noArtists') }}</p>
      <p class="text-xs text-muted mt-1">Pokušaj prilagoditi filtere ili očistiti pretragu.</p>
      <button
        v-if="activeFiltersCount > 0"
        type="button"
        class="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-on-accent shadow-sm"
        @click="clearAllFilters"
      >
        Poništi sve filtere
      </button>
    </div>

    <!-- Rich Portrait Artist Cards Grid -->
    <ul v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
      <li v-for="artist in filteredArtists" :key="artist._id">
        <NuxtLink
          :to="localePath(`/izvodjac/${artist.slug}`)"
          class="group relative flex flex-col items-center text-center rounded-2xl border border-line bg-panel/70 p-4 sm:p-5 backdrop-blur-xs transition-all duration-200 hover:border-accent hover:bg-panel hover:shadow-md"
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
              class="size-16 sm:size-20 rounded-full object-cover ring-2 ring-line/70 transition-colors group-hover:ring-accent shadow-sm"
            >
            <div
              v-else
              class="flex size-16 sm:size-20 select-none items-center justify-center rounded-full border border-line bg-surface/90 font-mono text-xl sm:text-2xl font-bold tracking-tight text-ink ring-2 ring-line-soft transition-all group-hover:border-accent group-hover:bg-panel group-hover:text-accent group-hover:ring-accent/40 shadow-xs"
            >
              {{ initials(artist.name) }}
            </div>
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
