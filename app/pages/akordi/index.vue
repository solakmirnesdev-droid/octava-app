<script setup>
import { CATALOGUE, NOTES, QUALITIES, parseChord } from '~/utils/chordEngine';

const { t } = useI18n();

/**
 * Grouped by root so the page reads like a reference rather than a dump.
 * The root is the part before any quality suffix, which is what someone
 * scanning for "everything in A" is looking for.
 */
const ROOTS = NOTES;

const query = ref('');
const root = ref('');

/**
 * Which instrument the diagrams are drawn for.
 *
 * AI-NOTE: the catalogue of symbols is the same for all three — a C is a C —
 * but every shape below it is regenerated from that instrument's tuning.
 */
const INSTRUMENT_LIST = [
  { key: 'guitar', labelKey: 'tuner.guitar', tuning: 'E A D G H E' },
  { key: 'bass', labelKey: 'tuner.bass', tuning: 'E A D G' },
  { key: 'ukulele', labelKey: 'tuner.ukulele', tuning: 'G C E A' }
];
const instrument = ref('guitar');

/**
 * Folds a query so the search is not a spelling test.
 *
 * AI-NOTE: strips accents and case, and rewrites the two foreign spellings a
 * reader is likely to arrive with — B for our A#, and any flat for the sharp a
 * semitone below. Somebody who learned "Bb" should still find A#.
 */
const FLATS = { db: 'c#', eb: 'd#', gb: 'f#', ab: 'g#', bb: 'a#', b: 'h' };

function normalise(text) {
  const bare = String(text || '')
    .trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Only the leading note is rewritten: "bb" is a chord root, "bbq" is a typo.
  const m = /^([a-h][b#]?)(.*)$/.exec(bare);
  if (!m) return bare;
  return (FLATS[m[1]] || m[1]) + m[2];
}

/** The quality names, in the reader's language, for matching "mol" or "minor". */
const qualityWords = computed(() => {
  const out = {};
  for (const [key, spec] of Object.entries(QUALITIES)) {
    out[key] = normalise(t(`chord.${spec.labelKey}`));
  }
  return out;
});

const all = computed(() => CATALOGUE.map((symbol) => {
  const parsed = parseChord(symbol);
  return { symbol, root: NOTES[parsed.root], quality: parsed.quality };
}));

/**
 * Splits a query into a root and whatever follows it.
 *
 * AI-TRAP: "cdur" and "c dur" are the obvious way to ask for C major and both
 * failed. Matching the symbol OR the quality name is not enough — the reader
 * writes them together, and neither half matches the whole string. The query has
 * to be taken apart the same way a chord symbol is.
 */
function splitQuery(text) {
  const q = normalise(text);
  const m = /^([a-h][#]?)\s*(.*)$/.exec(q);
  if (!m) return { root: null, rest: q, whole: q };
  return { root: m[1].toUpperCase(), rest: m[2].trim(), whole: q };
}

/**
 * Matches on the symbol, the root, the quality name, or a root and a quality
 * name written together.
 *
 * AI-DECISION: prefix on the symbol rather than an exact parse. Typing "am"
 * should show the whole A minor family — Am, Am6, Am7 — because somebody
 * looking a chord up is usually deciding between them. An exact parse would
 * return one card and hide the four they were choosing among.
 */
const visible = computed(() => {
  const { root: qRoot, rest, whole } = splitQuery(query.value);
  const wanted = root.value;

  return all.value.filter((c) => {
    if (wanted && c.root !== wanted) return false;
    if (!whole) return true;

    const symbol = normalise(c.symbol);
    const quality = qualityWords.value[c.quality] || '';

    // "cdur", "c dur", "amol": a root written together with a quality name.
    if (qRoot && c.root === qRoot) {
      if (!rest) return true;
      if (quality.startsWith(rest) || quality.includes(rest)) return true;
      if (normalise(c.quality).startsWith(rest)) return true;
    }

    return symbol.startsWith(whole)
      || normalise(c.root) === whole
      || quality.includes(whole);
  });
});

const grouped = computed(() => {
  const map = new Map();
  for (const c of visible.value) {
    if (!map.has(c.root)) map.set(c.root, []);
    map.get(c.root).push(c.symbol);
  }
  // Plain triad first, then the extensions, so each row opens with the shape
  // most readers came for.
  for (const list of map.values()) list.sort((a, b) => a.length - b.length || a.localeCompare(b));
  return ROOTS.filter((r) => map.has(r)).map((r) => ({ root: r, chords: map.get(r) }));
});

const total = computed(() => CATALOGUE.length);
const filtering = computed(() => Boolean(query.value.trim() || root.value));

function clear() {
  query.value = '';
  root.value = '';
}

const ringingChord = ref(null);
let ringTimer = null;

function onChordPlay(symbol) {
  ringingChord.value = symbol;
  window.clearTimeout(ringTimer);
  ringTimer = window.setTimeout(() => {
    ringingChord.value = null;
  }, 850);
}

onBeforeUnmount(() => window.clearTimeout(ringTimer));

const showTip = ref(false);

onMounted(() => {
  if (typeof window !== 'undefined' && !sessionStorage.getItem('octava_chords_tip_dismissed')) {
    showTip.value = true;
  }
});

function dismissTip() {
  showTip.value = false;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('octava_chords_tip_dismissed', '1');
  }
}

useSeoMeta({
  title: t('meta.chordsTitle'),
  description: `Dijagrami hvatova za ${total.value} akorda na gitari. Durski i molski trozvuci, septakordi i sus akordi, u našoj notaciji sa H.`,
  ogTitle: t('meta.chordsHeading'),
  ogType: 'article'
});

// Canonical and hreflang come from useLocaleHead in app.vue. A hard-coded
// canonical here pointed every English page at its Bosnian counterpart,
// which tells a search engine to index that one instead.
</script>

<template>
  <div class="space-y-6">
    <!-- 1. Header Zone with Instrument Switcher on the Right -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <span class="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent shadow-xs">
            <Icon name="material-symbols:music-note-rounded" class="text-xl" />
          </span>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-ink">
            {{ $t('page.chordsTitle') }}
          </h1>
        </div>
        <p class="mt-1 text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
          Hvatovi za {{ total }} akorda sa zvučnim pregledom u domaćoj notaciji sa <strong class="font-mono text-ink">H</strong>.
        </p>
      </div>

      <!-- Instrument Segmented Control -->
      <div class="flex items-center gap-1 self-start sm:self-auto rounded-2xl border border-line-soft bg-surface/85 p-1 shadow-2xs backdrop-blur-md" data-print="hide">
        <button
          v-for="i in INSTRUMENT_LIST"
          :key="i.key"
          type="button"
          class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 outline-none cursor-pointer"
          :class="instrument === i.key
            ? 'bg-accent text-on-accent shadow-xs shadow-accent/25'
            : 'text-muted hover:bg-panel hover:text-ink'"
          @click="instrument = i.key"
        >
          <span>{{ $t(i.labelKey) }}</span>
          <span class="font-mono text-[10px] opacity-70 hidden md:inline">{{ i.tuning }}</span>
        </button>
      </div>
    </header>

    <!-- 2. Unified Studio Toolbar (Search + Note Roots in One Seamless Line) -->
    <div class="rounded-2xl border border-line bg-gradient-to-r from-panel/95 via-panel/85 to-surface/90 p-3 sm:p-3.5 backdrop-blur-xl shadow-xs ring-1 ring-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      
      <!-- Search Input (Compact, appropriately proportioned) -->
      <div class="relative w-full lg:w-72 xl:w-80 shrink-0">
        <Icon
          name="material-symbols:search-rounded"
          aria-hidden="true"
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-faint"
        />
        <input
          v-model="query"
          type="search"
          autocomplete="off"
          :aria-label="$t('page.chordSearchLabel')"
          :placeholder="$t('page.chordSearch')"
          class="w-full rounded-xl border border-line-soft bg-surface/90 py-2 pl-9 pr-8 text-xs sm:text-sm text-ink placeholder:text-faint outline-none transition focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20 shadow-2xs"
        >
        <button
          v-if="query"
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full text-faint hover:text-ink hover:bg-line transition cursor-pointer"
          @click="query = ''"
        >
          <Icon name="material-symbols:close-rounded" class="text-xs" />
        </button>
      </div>

      <!-- Root Note Selector Chips Strip -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none [mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)]">
        <button
          type="button"
          class="shrink-0 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold transition-all shadow-2xs cursor-pointer outline-none"
          :class="!root
            ? 'bg-accent-soft border border-accent/40 text-accent font-black'
            : 'border border-transparent text-muted hover:border-line hover:bg-surface hover:text-ink'"
          @click="root = ''"
        >
          SVI
        </button>

        <button
          v-for="r in ROOTS"
          :key="r"
          type="button"
          class="shrink-0 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold transition-all shadow-2xs cursor-pointer outline-none"
          :class="root === r
            ? 'bg-accent text-on-accent shadow-xs shadow-accent/25'
            : 'border border-transparent text-muted hover:border-line hover:bg-surface hover:text-accent'"
          @click="root = root === r ? '' : r"
        >
          {{ r }}
        </button>

        <button
          v-if="filtering"
          type="button"
          class="shrink-0 ml-1.5 rounded-lg border border-line-soft bg-surface/70 px-2.5 py-1.5 text-xs font-medium text-faint hover:text-danger hover:border-danger/30 hover:bg-danger-soft transition shadow-2xs cursor-pointer"
          @click="clear"
        >
          {{ $t('page.chordSearchClear') }}
        </button>
      </div>
    </div>

    <!-- Active Filtering Status Badge -->
    <div v-if="filtering" class="flex items-center justify-between text-xs text-muted px-1">
      <span class="font-mono font-medium">
        {{ $t('page.chordSearchCount', { n: visible.length }, visible.length) }}
      </span>
      <button
        type="button"
        class="text-xs text-faint hover:text-accent font-semibold transition"
        @click="clear"
      >
        Prikaži sve akorde ({{ total }})
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-if="!visible.length"
      class="rounded-3xl border border-line bg-panel/75 p-12 text-center backdrop-blur-md space-y-3"
    >
      <div class="flex size-12 items-center justify-center rounded-2xl bg-surface border border-line text-faint mx-auto">
        <Icon name="material-symbols:search-off-rounded" class="text-2xl" />
      </div>
      <p class="text-sm font-semibold text-ink">
        {{ $t('page.chordSearchEmpty', { query: query || root }) }}
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface hover:bg-panel px-4 py-2 text-xs font-bold text-accent transition shadow-2xs"
        @click="clear"
      >
        <span>Poništi pretragu</span>
      </button>
    </div>

    <!-- Grouped Chords Sections -->
    <section
      v-for="(group, idx) in grouped"
      :key="group.root"
      class="pt-6 sm:pt-8 border-t border-line/70 first:border-t-0 first:pt-0"
    >
      <div class="mb-4 flex items-center gap-3">
        <span class="flex size-7 items-center justify-center rounded-lg border border-accent/30 bg-accent-soft font-mono text-sm font-bold text-accent shadow-2xs">
          {{ group.root }}
        </span>
        <h2 class="font-mono text-base font-bold text-ink tracking-tight">
          {{ group.root }}
        </h2>
        <span class="text-xs font-mono text-faint">({{ group.chords.length }})</span>
        <div class="flex-1 h-px bg-gradient-to-r from-line/80 via-line-soft/40 to-transparent ml-2" />
      </div>

      <div class="grid grid-cols-2 gap-3.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <div
          v-for="symbol in group.chords" :key="symbol"
          class="group relative flex flex-col items-center justify-between rounded-2xl border bg-gradient-to-b from-panel/95 via-panel/60 to-surface/80 p-3.5 sm:p-4 backdrop-blur-md shadow-xs transition-all duration-300 hover:border-accent/60 hover:bg-panel hover:shadow-lg hover:shadow-accent/5 overflow-hidden cursor-pointer"
          :class="ringingChord === symbol
            ? 'border-accent ring-2 ring-accent/50 shadow-[0_0_24px_rgba(224,90,58,0.35)]'
            : 'border-line/75'"
        >
          <div class="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-accent/5 blur-xl group-hover:bg-accent/15 transition-colors" />
          <ChordDiagram :symbol="symbol" :instrument="instrument" @play="onChordPlay(symbol)" />
        </div>
      </div>
    </section>

    <!-- Floating Landing Popup Tip -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-6 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-6 scale-95"
      >
        <div
          v-if="showTip"
          class="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[calc(100%-2.5rem)] rounded-2xl border border-line bg-panel/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/5"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-start gap-3.5">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent shadow-xs">
              <Icon name="material-symbols:volume-up-rounded" class="text-lg" />
            </div>

            <div class="flex-1 min-w-0 pr-5">
              <div class="flex items-center gap-1.5">
                <h3 class="text-xs font-bold text-ink uppercase tracking-wider">Zvučni pregled akorda</h3>
                <span class="inline-block size-1.5 rounded-full bg-accent animate-pulse" />
              </div>
              <p class="mt-1 text-xs text-muted leading-relaxed">
                {{ $t('page.chordHear') }}
              </p>
            </div>

            <button
              type="button"
              class="absolute top-3 right-3 flex size-6 items-center justify-center rounded-lg text-faint hover:bg-surface hover:text-ink transition-colors outline-none"
              title="Zatvori"
              @click="dismissTip"
            >
              <Icon name="material-symbols:close-rounded" class="text-base" />
              <span class="sr-only">Zatvori</span>
            </button>
          </div>

          <div class="mt-3 flex justify-end">
            <button
              type="button"
              class="rounded-lg bg-surface hover:bg-raised border border-line px-3 py-1 text-[11px] font-bold text-ink hover:text-accent transition-colors shadow-2xs outline-none"
              @click="dismissTip"
            >
              U redu, shvatam
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
