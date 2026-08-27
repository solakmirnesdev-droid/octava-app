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
  <div>
    <header class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight">{{ $t('page.chordsTitle') }}</h1>
      <i18n-t keypath="page.chordsLead" tag="p" class="mt-2 max-w-2xl text-muted" scope="global">
        <template #total>{{ total }}</template>
        <template #h><strong class="font-mono">H</strong></template>
      </i18n-t>
    </header>

    <div class="mb-6">
      <div class="relative">
        <Icon
          name="material-symbols:search-rounded"
          aria-hidden="true"
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          v-model="query"
          type="search"
          autocomplete="off"
          :aria-label="$t('page.chordSearchLabel')"
          :placeholder="$t('page.chordSearch')"
          class="w-full rounded-full border border-line-strong bg-panel py-2 pl-10 pr-4 outline-none focus:border-accent"
        >
      </div>

      <!-- The roots as chips: "everything in A" is the other half of how a
           reference like this gets used, and it needs no typing. -->
      <div class="mt-2.5 flex flex-wrap gap-1">
        <button
          v-for="r in ROOTS" :key="r"
          type="button"
          class="rounded px-2 py-1 font-mono text-xs transition-colors"
          :class="root === r
            ? 'bg-accent text-on-accent'
            : 'text-muted hover:bg-raised hover:text-accent'"
          @click="root = root === r ? '' : r"
        >{{ r }}</button>

        <button
          v-if="filtering"
          type="button"
          class="ml-auto rounded px-2 py-1 text-xs text-faint hover:text-accent"
          @click="clear"
        >{{ $t('page.chordSearchClear') }}</button>
      </div>
    </div>

    <!-- One row, three tunings. The bass is capped at three notes on purpose:
         four-note chords down at E1 are mud, and what bass players actually use
         is a root with a fifth or an octave. -->
    <div class="mb-6 flex flex-wrap items-center gap-2" data-print="hide">
      <button
        v-for="i in INSTRUMENT_LIST" :key="i.key"
        type="button"
        class="rounded-full border px-3 py-1 text-xs transition"
        :class="instrument === i.key
          ? 'border-accent bg-accent-soft text-accent font-medium'
          : 'border-line-strong text-muted hover:border-accent hover:text-accent'"
        @click="instrument = i.key"
      >
        {{ $t(i.labelKey) }}
        <span class="ml-1 font-mono opacity-60">{{ i.tuning }}</span>
      </button>
    </div>

    <p v-if="filtering" class="mb-4 text-sm text-muted">
      {{ $t('page.chordSearchCount', { n: visible.length }, visible.length) }}
    </p>

    <p v-if="!visible.length" class="text-sm text-muted">
      {{ $t('page.chordSearchEmpty', { query }) }}
    </p>

    <section
      v-for="(group, idx) in grouped"
      :key="group.root"
      class="mb-10 pt-8 sm:pt-10 border-t border-line/70 first:border-t-0 first:pt-0"
    >
      <div class="mb-4 flex items-center gap-3">
        <span class="flex size-7 items-center justify-center rounded-lg border border-accent/30 bg-accent-soft font-mono text-sm font-bold text-accent shadow-2xs">
          {{ group.root }}
        </span>
        <h2 class="font-mono text-base font-bold text-ink tracking-tight">
          {{ group.root }}
        </h2>
        <div class="flex-1 h-px bg-gradient-to-r from-line/80 via-line-soft/40 to-transparent ml-2" />
      </div>

      <div class="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <div
          v-for="symbol in group.chords" :key="symbol"
          class="group relative flex flex-col items-center justify-between rounded-2xl border border-line/75 bg-gradient-to-b from-panel/95 via-panel/60 to-surface/80 p-3.5 sm:p-4 backdrop-blur-md shadow-xs transition-colors duration-200 hover:border-accent/60 hover:bg-panel hover:shadow-lg hover:shadow-accent/5 overflow-hidden"
        >
          <div class="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-accent/5 blur-xl group-hover:bg-accent/15 transition-colors" />
          <ChordDiagram :symbol="symbol" :instrument="instrument" />
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
