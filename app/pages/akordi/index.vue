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
 * Matches on the symbol, the root, or the name of the quality.
 *
 * AI-DECISION: prefix on the symbol rather than an exact parse. Typing "am"
 * should show the whole A minor family — Am, Am6, Am7 — because somebody
 * looking up a chord is usually deciding between them. An exact parse would
 * return one card and hide the four they were choosing among.
 */
const visible = computed(() => {
  const q = normalise(query.value);
  const wanted = root.value;

  return all.value.filter((c) => {
    if (wanted && c.root !== wanted) return false;
    if (!q) return true;

    const symbol = normalise(c.symbol);
    return symbol.startsWith(q)
      || normalise(c.root) === q
      || (qualityWords.value[c.quality] || '').includes(q);
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

    <p v-if="filtering" class="mb-4 text-sm text-muted">
      {{ $t('page.chordSearchCount', { n: visible.length }, visible.length) }}
    </p>

    <p v-if="!visible.length" class="text-sm text-muted">
      {{ $t('page.chordSearchEmpty', { query }) }}
    </p>

    <section v-for="group in grouped" :key="group.root" class="mb-8">
      <h2 class="mb-3 font-mono text-lg font-semibold text-accent">{{ group.root }}</h2>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <div
          v-for="symbol in group.chords" :key="symbol"
          class="flex justify-center rounded border border-line bg-panel py-3"
        >
          <ChordDiagram :symbol="symbol" />
        </div>
      </div>
    </section>
  </div>
</template>
