<script setup>
import { initials } from '~/utils/avatar';
import { safeFlag } from '~/utils/countries';

const config = useRuntimeConfig();
const localePath = useLocalePath();
const { t } = useI18n();
const router = useRouter();
const { $api } = useNuxtApp();

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;
const SUGGEST_LIMIT = 6;

const query = ref('');
const open = ref(false);
const loading = ref(false);
const results = ref({ songs: [], artists: [], genres: [] });
const highlighted = ref(-1);

/*
 * What the panel shows before anything is typed.
 *
 * AI-DECISION: written into `results`, the same shape a search fills, so the
 * existing list draws them with no new markup, no second code path and no
 * second way for the keyboard handling to be wrong. A suggestion row and a
 * result row are the same thing to somebody looking at them; making them the
 * same thing in the code is what keeps them looking that way.
 *
 * Fetched once per page and kept: it is the most-viewed list, which does not
 * change between two openings of a dropdown.
 */
const suggestions = ref(null);
const showingSuggestions = ref(false);

async function loadSuggestions() {
  if (!suggestions.value) {
    try {
      const [songs, artists] = await Promise.all([
        $api('/songs', { params: { sort: 'popular', limit: 5 } }),
        $api('/artists', { params: { limit: 3 } })
      ]);
      suggestions.value = {
        songs: songs.songs || [],
        artists: artists.artists || [],
        genres: []
      };
    } catch {
      // The box still searches; only the head start is missing.
      suggestions.value = { songs: [], artists: [], genres: [] };
    }
  }
  results.value = suggestions.value;
  showingSuggestions.value = true;
  open.value = true;
}

const root = useTemplateRef('root');

let timer = null;
let controller = null;

/**
 * Flat list behind the grouped display, so the arrow keys can walk every
 * result in visual order without the three sections knowing about each other.
 */
const flat = computed(() => {
  const topArtistName = results.value.artists.length === 1 ? results.value.artists[0].name?.toLowerCase() : null;

  return [
    ...results.value.artists.map((a) => ({
      key: 'a' + a._id,
      kind: 'artist',
      label: a.name,
      to: localePath(`/izvodjac/${a.slug}`),
      image: a.hasImage ? `${config.public.apiBase}/artists/${a._id}/image` : null,
      flag: safeFlag(a.flag, a.country)
    })),
    ...results.value.songs.map((s) => {
      const songArtistName = s.artist?.name;
      // Do not repeat artist name if the searched artist is already displayed on top
      const isRedundant = topArtistName && songArtistName && songArtistName.toLowerCase() === topArtistName;
      return {
        key: 's' + s._id,
        kind: 'song',
        label: s.title,
        artistName: isRedundant ? null : songArtistName,
        to: localePath(`/pjesma/${s.slug}`)
      };
    }),
    ...results.value.genres.map((g) => ({
      key: 'g' + g._id,
      kind: 'genre',
      label: g.name,
      to: localePath(`/zanr/${g.slug}`)
    }))
  ];
});

/** An artist row and a song row read identically without this. */
const ICONS = {
  artist: 'material-symbols:artist-rounded',
  song: 'material-symbols:music-note-rounded',
  genre: 'material-symbols:label-outline-rounded'
};

const hasResults = computed(() => flat.value.length > 0);

async function run(term) {
  // Cancel whatever is still in flight. Without this a slow response for "J"
  // can land after the one for "Jos" and overwrite the newer, better results.
  controller?.abort();
  // Held locally: by the time this call settles, `controller` may already be
  // a newer one's.
  const mine = new AbortController();
  controller = mine;

  loading.value = true;
  try {
    const data = await $api('/songs/search', {
      params: { q: term, limit: SUGGEST_LIMIT },
      signal: mine.signal
    });
    if (mine.signal.aborted) return;
    results.value = {
      songs: data.songs || [],
      artists: data.artists || [],
      genres: data.genres || []
    };
    showingSuggestions.value = false;
    highlighted.value = -1;
  } catch (err) {
    /*
     * An aborted request is the expected outcome of typing, not a failure.
     *
     * AI-TRAP: the name alone does not recognise one. $api wraps the abort in
     * a FetchError, so `err.name === 'AbortError'` is false and this wiped
     * results a newer call had already put there — the rejection lands after
     * the replacement, so the reader watches a list appear and then empty
     * itself. Ask the signal, which knows.
     */
    const aborted = mine.signal.aborted || err.name === 'AbortError';
    if (!aborted) results.value = { songs: [], artists: [], genres: [] };
  } finally {
    loading.value = false;
  }
}

watch(query, (value) => {
  clearTimeout(timer);
  const term = value.trim();

  if (term.length < MIN_QUERY) {
    controller?.abort();
    /*
     * Clearing the box goes back to the suggestions rather than to an empty
     * panel. Somebody who deletes what they typed is starting over, not leaving
     * — shutting the panel in their face makes them click the field again to get
     * back where they already were.
     */
    if (!term && open.value) {
      loadSuggestions();
      return;
    }
    results.value = { songs: [], artists: [], genres: [] };
    showingSuggestions.value = false;
    open.value = false;
    return;
  }

  showingSuggestions.value = false;
  open.value = true;
  // Wait for a pause in typing rather than firing per keystroke.
  timer = setTimeout(() => run(term), DEBOUNCE_MS);
});

function move(step) {
  if (!hasResults.value) return;
  const count = flat.value.length;
  highlighted.value = (highlighted.value + step + count) % count;
}

const route = useRoute();

function submit() {
  const chosen = flat.value[highlighted.value];
  if (chosen) return go(chosen.to);

  const term = query.value.trim();
  if (term) {
    close();
    router.push(localePath({ path: '/pretraga', query: { q: term } }));
  }
}

function go(to) {
  close();
  router.push(to);
}

function close() {
  open.value = false;
  highlighted.value = -1;
  clearTimeout(timer);
}

// Clicking anywhere else dismisses the panel.
function onDocumentClick(event) {
  if (root.value && !root.value.contains(event.target)) close();
}

onMounted(() => {
  if (route.query?.q && !query.value) {
    query.value = String(route.query.q);
  }
  document.addEventListener('click', onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  clearTimeout(timer);
  controller?.abort();
});
</script>

<template>
  <div ref="root" class="relative w-full min-w-0">
    <form role="search" class="relative" @submit.prevent="submit">
      <!-- Decorative: the input already has an accessible name, so announcing
           the icon as well would just repeat it. -->
      <Icon
        name="material-symbols:search-rounded"
        aria-hidden="true"
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
      />

      <input
        v-model="query"
        type="search"
        :aria-label="$t('nav.searchLabel')"
        autocomplete="off"
        :placeholder="$t('nav.search')"
        class="w-full rounded-full border border-line-strong bg-panel py-2 pl-9.5 pr-9 text-base sm:text-sm outline-none focus:border-accent"
        :aria-expanded="open"
        @focus="query.trim().length >= MIN_QUERY ? (open = true) : loadSuggestions()"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.esc.prevent="close"
      />

      <button
        v-if="query"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-accent"
        :title="$t('nav.clear')"
        @click="query = ''; close()"
      >
        <Icon name="material-symbols:close-rounded" />
        <span class="sr-only">{{ $t('nav.clearSearch') }}</span>
      </button>
    </form>

    <div
      v-if="open"
      class="absolute left-0 top-full z-30 mt-1.5 w-full min-w-[280px] sm:min-w-[340px] max-w-[90vw] overflow-hidden popover-surface"
    >
      <!--
        AI-TRAP: above the v-if chain, never inside it. Slipped between the
        v-else-if and the v-else this breaks the chain — Vue needs those to be
        immediate siblings — and the list silently stops rendering while the
        heading above it goes on looking perfectly correct.

        Same faint one-liner the states below use, so the panel gains a label
        without gaining a new kind of element.
      -->
      <p
        v-if="showingSuggestions && hasResults"
        class="px-4 pt-3 pb-1 text-[11px] uppercase tracking-wider text-faint"
      >{{ $t('nav.suggestHeading') }}</p>

      <p v-if="loading && !hasResults" class="px-4 py-3 text-sm text-faint">{{ $t('nav.searching') }}</p>

      <p v-else-if="!hasResults" class="px-4 py-3 text-sm text-faint">
        <!-- Nothing was searched for while suggestions are showing, so the
             "no results for X" sentence would name an empty X. -->
        {{ showingSuggestions ? $t('nav.suggestEmpty') : $t('nav.noResultsFor', { q: query.trim() }) }}
      </p>

      <ul v-else class="max-h-80 overflow-auto py-1">
        <li v-for="(item, i) in flat" :key="item.key">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors"
            :class="i === highlighted ? 'bg-accent-soft text-accent' : 'hover:bg-raised text-ink'"
            @click="go(item.to)"
            @mouseenter="highlighted = i"
          >
            <img
              v-if="item.image" :src="item.image" alt=""
              class="size-6 shrink-0 rounded-full object-cover ring-1 ring-line"
            >
            <span
              v-else-if="item.kind === 'artist'"
              class="flex size-6 shrink-0 select-none items-center justify-center rounded-full border border-line bg-surface/90 font-mono text-[9px] font-bold text-muted ring-1 ring-line-soft"
            >{{ initials(item.label) }}</span>
            <Icon v-else :name="ICONS[item.kind]" class="size-4 shrink-0 text-dim" />

            <div class="min-w-0 flex-1 flex items-center justify-between gap-2">
              <span class="truncate font-medium">
                <span v-if="item.flag" class="mr-1.5">{{ item.flag }}</span>{{ item.label }}
              </span>
              <span v-if="item.artistName" class="shrink-0 text-xs text-faint truncate max-w-[120px]">
                {{ item.artistName }}
              </span>
            </div>
          </button>
        </li>
      </ul>

      <!-- Hidden while suggestions show: nothing was searched for, so this
           would offer to see all results for an empty phrase. -->
      <button
        v-if="hasResults && !showingSuggestions"
        type="button"
        class="w-full border-t border-line-soft px-4 py-2.5 text-left text-xs text-faint hover:text-accent"
        @click="submit"
      >
        {{ $t('nav.showAllFor', { q: query.trim() }) }}
      </button>
    </div>
  </div>
</template>
