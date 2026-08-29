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

/*
 * Who is under each letter, shown on hover.
 *
 * AI-DECISION: fetched once on the first hover, not per letter. The whole index
 * is 137 names and about 13 KB — a request per hover would put a network round
 * trip behind a mouse movement, which is the one place a delay cannot be hidden.
 * Not fetched with the page either: most visitors never touch the strip at all.
 */
const letterIndex = ref(null);
const openLetter = ref('');
const panelAt = ref({ left: 0, top: 0 });
let closeTimer = null;

/*
 * AI-TRAP: only where a pointer can really hover. Touch browsers fake hover on
 * the first tap, so without this the first tap on a letter opens a panel instead
 * of filtering — the control stops doing its job on a phone.
 */
const canHover = ref(false);
onMounted(() => {
  canHover.value = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;
});

async function loadIndex() {
  if (letterIndex.value) return;
  try {
    letterIndex.value = (await $api('/artists/index')).letters || {};
  } catch {
    letterIndex.value = {};   // the strip still filters; only the preview is lost
  }
}

const namesFor = computed(() => letterIndex.value?.[openLetter.value] || []);

async function previewLetter(char, event) {
  if (!canHover.value) return;
  window.clearTimeout(closeTimer);
  const target = event.currentTarget;
  await loadIndex();
  if (!letterIndex.value?.[char]?.length || !target) return;

  // Fixed, positioned from the button: the strip scrolls sideways and a panel
  // inside it would be clipped by that overflow.
  const r = target.getBoundingClientRect();
  const half = 130;
  panelAt.value = {
    left: Math.min(Math.max(r.left + r.width / 2, half + 8), window.innerWidth - half - 8),
    top: r.bottom + 8
  };
  openLetter.value = char;
}

/** A moment's grace, so moving the pointer into the panel does not close it. */
function scheduleClose() {
  window.clearTimeout(closeTimer);
  closeTimer = window.setTimeout(() => { openLetter.value = ''; }, 140);
}
function cancelClose() { window.clearTimeout(closeTimer); }

onBeforeUnmount(() => window.clearTimeout(closeTimer));
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
    <div class="relative z-30 rounded-3xl border border-line bg-gradient-to-b from-panel/95 via-panel/85 to-surface/90 p-4 sm:p-5 backdrop-blur-xl shadow-xs ring-1 ring-white/5 space-y-4">
      <!-- 1. Top Controls Bar: Search Input + Custom Studio Dropdowns + Reset -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        <!-- Search Input with Clear Button -->
        <div class="relative flex-1 sm:max-w-[280px]">
          <Icon
            name="material-symbols:search-rounded"
            class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-muted"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Pretraži po imenu ili gradu..."
            class="w-full rounded-xl border border-line-soft bg-surface/90 py-2 pl-10 pr-9 text-xs sm:text-sm text-ink placeholder:text-faint outline-none transition focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20 shadow-2xs"
          >
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full bg-raised hover:bg-line text-muted hover:text-ink transition-colors cursor-pointer"
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
            class="flex items-center justify-between gap-2 w-full rounded-xl border border-line-soft bg-surface/90 hover:bg-surface px-3 py-2 text-xs sm:text-sm font-semibold text-ink focus:border-accent focus:outline-none transition-all cursor-pointer shadow-2xs text-left"
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
              class="absolute left-0 top-full mt-1.5 w-56 sm:w-60 z-50 popover-surface max-h-64 overflow-y-auto space-y-0.5"
            >
              <button
                type="button"
                class="flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-semibold transition-colors text-left cursor-pointer"
                :class="!genre ? 'bg-accent-soft text-accent font-bold' : 'text-body hover:bg-surface hover:text-ink'"
                @click="selectFilter('genre', '')"
              >
                <span>{{ $t('page.allRubrics') }}</span>
                <Icon v-if="!genre" name="material-symbols:check-rounded" class="text-sm text-accent" />
              </button>

              <button
                v-for="g in genreData?.genres || []" :key="g._id"
                type="button"
                class="flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-semibold transition-colors text-left cursor-pointer"
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
            class="flex items-center justify-between gap-2 w-full rounded-xl border border-line-soft bg-surface/90 hover:bg-surface px-3 py-2 text-xs sm:text-sm font-semibold text-ink focus:border-accent focus:outline-none transition-all cursor-pointer shadow-2xs text-left"
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
              class="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-64 sm:w-72 z-50 popover-surface max-h-72 overflow-y-auto space-y-0.5"
            >
              <button
                type="button"
                class="flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-semibold transition-colors text-left cursor-pointer"
                :class="!country ? 'bg-accent-soft text-accent font-bold' : 'text-body hover:bg-surface hover:text-ink'"
                @click="selectFilter('country', '')"
              >
                <span>{{ $t('page.allCountries') }}</span>
                <Icon v-if="!country" name="material-symbols:check-rounded" class="text-sm text-accent" />
              </button>

              <button
                v-for="c in data?.countries || []" :key="c.code"
                type="button"
                class="flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-semibold transition-colors text-left cursor-pointer"
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
          class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-accent/30 bg-accent-soft hover:bg-accent hover:text-on-accent text-accent px-3 py-2 text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
          @click="clearAllFilters"
        >
          <Icon name="material-symbols:restart-alt-rounded" class="text-sm" />
          <span>Poništi ({{ activeFiltersCount }})</span>
        </button>
      </div>

      <!-- 2. Bottom Row: Sleek Alphabetical Quick-Jump Scrubber Bar -->
      <div class="border-t border-line-soft pt-3">
        <div class="rounded-2xl border border-line-soft bg-surface/80 p-1 backdrop-blur-xs">
          <nav
            class="flex items-center gap-1 overflow-x-auto text-xs [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)]"
            aria-label="Alphabet navigation"
          >
            <button
              type="button"
              class="shrink-0 rounded-xl px-3 py-1.5 font-bold transition-all shadow-2xs outline-none cursor-pointer text-xs"
              :class="!letter
                ? 'bg-accent text-on-accent shadow-xs shadow-accent/25'
                : 'border border-transparent text-muted hover:border-line hover:bg-panel hover:text-ink'"
              @click="setFilter('letter', '')"
            >
              {{ $t('page.allFilter') }}
            </button>

            <template v-for="char in ALPHABET" :key="char">
              <button
                v-if="available.has(char)"
                type="button"
                class="shrink-0 size-8 font-mono font-bold rounded-xl flex items-center justify-center transition-all shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                :class="letter === char
                  ? 'bg-accent text-on-accent shadow-xs shadow-accent/25 scale-105'
                  : 'border border-transparent text-muted hover:border-line hover:bg-panel hover:text-accent'"
                :aria-expanded="openLetter === char"
                @click="setFilter('letter', char)"
                @mouseenter="previewLetter(char, $event)"
                @mouseleave="scheduleClose"
                @focus="previewLetter(char, $event)"
                @blur="scheduleClose"
                @keydown.escape="openLetter = ''"
              >
                {{ char }}
              </button>
              <span
                v-else
                class="shrink-0 size-8 font-mono text-dim flex items-center justify-center select-none opacity-30 text-xs"
              >
                {{ char }}
              </span>
            </template>
          </nav>
        </div>

        <!-- Popover Letter Preview -->
        <Teleport to="body">
          <div
            v-if="openLetter && namesFor.length"
            class="fixed z-50 -translate-x-1/2 rounded-2xl border border-line bg-panel/95 p-2.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10"
            :style="{ left: panelAt.left + 'px', top: panelAt.top + 'px', width: '260px' }"
            @mouseenter="cancelClose"
            @mouseleave="scheduleClose"
          >
            <p class="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-accent border-b border-line-soft">
              {{ openLetter }} · {{ namesFor.length }} izvođača
            </p>
            <ul class="max-h-64 overflow-y-auto mt-1 space-y-0.5">
              <li v-for="a in namesFor" :key="a.slug">
                <NuxtLink
                  :to="localePath(`/izvodjac/${a.slug}`)"
                  class="block truncate rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-accent"
                >{{ a.name }}</NuxtLink>
              </li>
            </ul>
          </div>
        </Teleport>
      </div>
    </div>

    <!-- Active Filter Tags / Chips -->
    <div v-if="activeFiltersCount > 0" class="flex flex-wrap items-center gap-2 text-xs">
      <span class="text-faint font-semibold">Aktivni filteri:</span>

      <AppBadge v-if="searchQuery" variant="accent" size="sm">
        <span>Tekst: "{{ searchQuery }}"</span>
        <button type="button" class="hover:opacity-75 cursor-pointer ml-1" @click="searchQuery = ''">✕</button>
      </AppBadge>

      <AppBadge v-if="letter" variant="accent" size="sm">
        <span>Slovo: {{ letter }}</span>
        <button type="button" class="hover:opacity-75 cursor-pointer ml-1" @click="setFilter('letter', '')">✕</button>
      </AppBadge>

      <AppBadge v-if="genre" variant="accent" size="sm">
        <span>Žanr: {{ genreData?.genres?.find(g => g.slug === genre)?.name || genre }}</span>
        <button type="button" class="hover:opacity-75 cursor-pointer ml-1" @click="setFilter('genre', '')">✕</button>
      </AppBadge>

      <AppBadge v-if="country" variant="accent" size="sm">
        <span>Država: {{ countryName(country, $i18n.locale) }}</span>
        <button type="button" class="hover:opacity-75 cursor-pointer ml-1" @click="setFilter('country', '')">✕</button>
      </AppBadge>
    </div>

    <!-- No results state -->
    <div v-if="!filteredArtists.length" class="rounded-3xl border border-line bg-panel/75 py-12 text-center backdrop-blur-md space-y-3">
      <Icon name="material-symbols:search-off-rounded" class="mx-auto text-4xl text-faint mb-2" />
      <p class="text-sm font-semibold text-ink">{{ $t('page.noArtists') }}</p>
      <p class="text-xs text-muted">Pokušaj prilagoditi filtere ili očistiti pretragu.</p>
      <AppButton
        v-if="activeFiltersCount > 0"
        variant="primary"
        size="sm"
        icon="material-symbols:restart-alt-rounded"
        class="mt-2"
        @click="clearAllFilters"
      >
        {{ $t('common.resetFilters') }}
      </AppButton>
    </div>

    <!-- Rich Portrait Artist Cards Grid -->
    <ul v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
      <li v-for="artist in filteredArtists" :key="artist._id">
        <NuxtLink
          :to="localePath(`/izvodjac/${artist.slug}`)"
          class="group relative flex flex-col items-center text-center rounded-3xl border border-line bg-gradient-to-b from-panel/95 via-panel/85 to-surface/90 p-4 sm:p-5 backdrop-blur-md shadow-xs transition-all duration-200 hover:border-accent/60 hover:bg-panel hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-0.5 overflow-hidden"
        >
          <!-- Ambient subtle corner glow on hover -->
          <div class="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-accent/5 blur-xl group-hover:bg-accent/15 transition-colors" />

          <!-- Country Flag badge in top right corner -->
          <span
            v-if="artist.flag || flagOf(artist.country)"
            class="absolute top-3 right-3 flex items-center justify-center rounded-lg border border-line-soft bg-surface/80 px-1.5 py-0.5 text-xs shadow-2xs select-none backdrop-blur-xs"
            :title="artist.country ? countryName(artist.country, $i18n.locale) : ''"
          >
            <span>{{ artist.flag || flagOf(artist.country) }}</span>
          </span>

          <!-- Artist Avatar (Photo or Stylized Brand Monogram) -->
          <div class="relative mt-1 mb-3">
            <div class="relative size-20 sm:size-22 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-b from-line-strong via-line to-transparent group-hover:from-accent group-hover:via-accent/40 group-hover:to-accent/10 transition-all duration-300 shadow-sm">
              <img
                v-if="artist.hasImage"
                :src="`${config.public.apiBase}/artists/${artist._id}/image`"
                :alt="artist.name"
                loading="lazy"
                class="size-full rounded-[14px] object-cover bg-surface"
              >
              <div
                v-else
                class="flex size-full select-none items-center justify-center rounded-[14px] bg-gradient-to-br from-panel via-surface to-raised font-mono text-xl sm:text-2xl font-black tracking-tight text-ink group-hover:text-accent transition-colors"
              >
                {{ initials(artist.name) }}
              </div>
            </div>
          </div>

          <!-- Artist Name -->
          <h2 class="w-full truncate text-sm sm:text-base font-bold text-ink transition-colors group-hover:text-accent">
            {{ artist.name }}
          </h2>

          <!-- Origin Pill Badge -->
          <div class="mt-1 h-5 flex items-center justify-center">
            <span
              v-if="artist.origin"
              class="inline-block max-w-[150px] truncate rounded-md border border-line-soft bg-surface/60 px-2 py-0.5 text-[10.5px] font-medium text-faint group-hover:text-muted transition-colors"
            >
              {{ artist.origin }}
            </span>
            <span v-else class="text-[10.5px] text-dim opacity-40">Muzičar</span>
          </div>

          <!-- Stats row: Song count & Overall rating -->
          <div class="mt-3 flex items-center justify-center gap-2 w-full border-t border-line-soft pt-2.5 text-xs text-muted font-mono">
            <!-- Songs badge -->
            <span class="inline-flex items-center gap-1 rounded-md bg-surface/80 px-2 py-0.5 text-[11px] font-semibold text-ink border border-line-soft shadow-2xs" :title="`${artist.songCount || 0} pjesama`">
              <Icon name="material-symbols:music-note-rounded" class="text-xs text-accent" />
              <span>{{ artist.songCount || 0 }}</span>
            </span>

            <!-- Rating badge -->
            <span
              class="inline-flex items-center gap-1 rounded-md bg-surface/80 px-2 py-0.5 text-[11px] font-semibold border border-line-soft shadow-2xs"
              :class="artist.rating ? 'text-ink' : 'text-faint'"
              :title="artist.rating ? `${artist.rating.toFixed(1)} / 5 (${artist.ratingCount || 0} ocjena)` : 'Nije ocijenjeno'"
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
