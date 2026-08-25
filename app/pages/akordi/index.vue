<script setup>
import { FINGERINGS } from '~/utils/fingerings';


/**
 * Grouped by root so the page reads like a reference rather than a dump.
 * The root is the part before any quality suffix, which is what someone
 * scanning for "everything in A" is looking for.
 */
const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H'];

const grouped = computed(() => {
  const map = Object.fromEntries(ROOTS.map((r) => [r, []]));

  for (const symbol of Object.keys(FINGERINGS)) {
    const root = /^([A-H][#b]?)/.exec(symbol)?.[1];
    if (map[root]) map[root].push(symbol);
  }

  // Plain triad first, then the extensions, so each row opens with the shape
  // most readers came for.
  for (const root of ROOTS) {
    map[root].sort((a, b) => a.length - b.length || a.localeCompare(b));
  }
  return map;
});

const total = computed(() => Object.keys(FINGERINGS).length);

useSeoMeta({
  title: 'Akordi za gitaru — svi hvatovi | Octava',
  description: `Dijagrami hvatova za ${total.value} akorda na gitari. Durski i molski trozvuci, septakordi i sus akordi, u našoj notaciji sa H.`,
  ogTitle: 'Akordi za gitaru — svi hvatovi',
  ogType: 'article'
});

// Canonical and hreflang come from useLocaleHead in app.vue. A hard-coded
// canonical here pointed every English page at its Bosnian counterpart,
// which tells a search engine to index that one instead.
</script>

<template>
  <div>
    <header class="mb-8">
      <h1 class="text-2xl font-semibold tracking-tight">Akordi za gitaru</h1>
      <p class="mt-2 max-w-2xl text-black/60">
        Hvatovi za {{ total }} akorda. Notacija je naša — <strong class="font-mono">H</strong>
        je dvanaesti stepen, a povisilice se pišu umjesto snizilica.
      </p>
    </header>

    <section v-for="root in ROOTS" :key="root" class="mb-8">
      <h2 class="mb-3 font-mono text-lg font-semibold text-accent">{{ root }}</h2>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <div
          v-for="symbol in grouped[root]" :key="symbol"
          class="flex justify-center rounded border border-black/10 bg-white py-3"
        >
          <ChordDiagram :symbol="symbol" />
        </div>
      </div>
    </section>
  </div>
</template>
