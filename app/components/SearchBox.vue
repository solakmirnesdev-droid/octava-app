<script setup>
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
const flat = computed(() => [
  // Artists lead. Someone typing "aca lukas" means the performer; the songs are
  // what they browse once they get there. Ranking them under five song titles
  // buried the one result that answers the query.
  ...results.value.artists.map((a) => ({
    key: 'a' + a._id, kind: 'artist', label: a.name,
    sub: t('common.songCount', { n: a.songCount || 0 }, a.songCount || 0),
    to: localePath(`/izvodjac/${a.slug}`),
    // A face is recognised faster than a name is read.
    image: a.hasImage ? `${config.public.apiBase}/artists/${a._id}/image` : null,
    flag: a.flag || null
  })),
  ...results.value.songs.map((s) => ({
    key: 's' + s._id, kind: 'song', label: s.title, sub: s.artist?.name,
    to: localePath(`/pjesma/${s.slug}`)
  })),
  ...results.value.genres.map((g) => ({
    key: 'g' + g._id, kind: 'genre', label: g.name, sub: t('common.genre'),
    to: localePath(`/zanr/${g.slug}`)
  }))
]);

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
  <div ref="root" class="relative flex-1">
    <form role="search" class="relative" @submit.prevent="submit">
      <!-- Decorative: the input already has an accessible name, so announcing
           the icon as well would just repeat it. -->
      <Icon
        name="material-symbols:search-rounded"
        aria-hidden="true"
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
      />

      <input
        v-model="query"
        type="search"
        :aria-label="$t('nav.searchLabel')"
        autocomplete="off"
        :placeholder="$t('nav.search')"
        class="w-full rounded-full border border-black/15 bg-white py-1.5 pl-9 pr-9 text-sm outline-none focus:border-accent"
        :aria-expanded="open"
        @focus="query.trim().length >= MIN_QUERY && (open = true)"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.esc.prevent="close"
      />

      <button
        v-if="query"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-accent"
        :title="$t('nav.clear')"
        @click="query = ''; close()"
      >
        <Icon name="material-symbols:close-rounded" />
        <span class="sr-only">{{ $t('nav.clearSearch') }}</span>
      </button>
    </form>

    <div
      v-if="open"
      class="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
    >
      <p v-if="loading && !hasResults" class="px-4 py-3 text-sm text-black/40">{{ $t('nav.searching') }}</p>

      <p v-else-if="!hasResults" class="px-4 py-3 text-sm text-black/40">
        {{ $t('nav.noResultsFor', { q: query.trim() }) }}
      </p>

      <ul v-else class="max-h-80 overflow-auto py-1">
        <li v-for="(item, i) in flat" :key="item.key">
          <button
            type="button"
            class="flex w-full items-baseline gap-2 px-4 py-2 text-left text-sm"
            :class="i === highlighted ? 'bg-accent/10 text-accent' : 'hover:bg-black/[0.03]'"
            @click="go(item.to)"
            @mouseenter="highlighted = i"
          >
            <img
              v-if="item.image" :src="item.image" alt=""
              class="size-6 shrink-0 self-center rounded-full object-cover ring-1 ring-black/10"
            >
            <Icon v-else :name="ICONS[item.kind]" class="shrink-0 self-center text-black/30" />
            <span class="font-medium">
              <span v-if="item.flag" class="mr-1">{{ item.flag }}</span>{{ item.label }}
            </span>
            <span class="truncate text-xs text-black/45">{{ item.sub }}</span>
          </button>
        </li>
      </ul>

      <button
        v-if="hasResults"
        type="button"
        class="w-full border-t border-black/5 px-4 py-2 text-left text-xs text-black/45 hover:text-accent"
        @click="submit"
      >
        Prikaži sve rezultate za „{{ query.trim() }}"
      </button>
    </div>
  </div>
</template>
