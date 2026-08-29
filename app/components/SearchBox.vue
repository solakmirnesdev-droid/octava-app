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
  controller = new AbortController();

  loading.value = true;
  try {
    const data = await $api('/songs/search', {
      params: { q: term, limit: SUGGEST_LIMIT },
      signal: controller.signal
    });
    results.value = {
      songs: data.songs || [],
      artists: data.artists || [],
      genres: data.genres || []
    };
    highlighted.value = -1;
  } catch (err) {
    // An aborted request is the expected outcome of typing, not a failure.
    if (err.name !== 'AbortError') results.value = { songs: [], artists: [], genres: [] };
  } finally {
    loading.value = false;
  }
}

watch(query, (value) => {
  clearTimeout(timer);
  const term = value.trim();

  if (term.length < MIN_QUERY) {
    controller?.abort();
    results.value = { songs: [], artists: [], genres: [] };
    open.value = false;
    return;
  }

  open.value = true;
  // Wait for a pause in typing rather than firing per keystroke.
  timer = setTimeout(() => run(term), DEBOUNCE_MS);
});

function move(step) {
  if (!hasResults.value) return;
  const count = flat.value.length;
  highlighted.value = (highlighted.value + step + count) % count;
}

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
  query.value = '';
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

onMounted(() => document.addEventListener('click', onDocumentClick));
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
        @focus="query.trim().length >= MIN_QUERY && (open = true)"
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
      <p v-if="loading && !hasResults" class="px-4 py-3 text-sm text-faint">{{ $t('nav.searching') }}</p>

      <p v-else-if="!hasResults" class="px-4 py-3 text-sm text-faint">
        {{ $t('nav.noResultsFor', { q: query.trim() }) }}
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

      <button
        v-if="hasResults"
        type="button"
        class="w-full border-t border-line-soft px-4 py-2.5 text-left text-xs text-faint hover:text-accent"
        @click="submit"
      >
        Prikaži sve rezultate za „{{ query.trim() }}"
      </button>
    </div>
  </div>
</template>
