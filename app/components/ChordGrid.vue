<script setup>
import { extractChords, transposeContent, normalizeNotation } from '~/utils/chordpro';
import { findFingering } from '~/utils/fingerings';

const props = defineProps({
  content: { type: String, default: '' },
  semitones: { type: Number, default: 0 },
  originalKey: { type: String, default: '' }
});

/**
 * Chords are read from the transposed text rather than the stored text, so the
 * grid follows the key the reader is actually looking at.
 */
const chords = computed(() =>
  extractChords(normalizeNotation(transposeContent(props.content, props.semitones, props.originalKey)))
);

/**
 * One card per distinct shape.
 *
 * A slash chord falls back to the shape of the chord before the slash, so G/H
 * and G would otherwise sit side by side showing the same fingering — noise in
 * a panel whose whole job is to show the different shapes. The slash chord is
 * still reachable from the sheet itself, where hovering it gives the same card.
 */
const playable = computed(() => {
  const seen = new Set();
  const out = [];

  for (const chord of chords.value) {
    const shape = findFingering(chord);
    if (!shape || seen.has(shape.name)) continue;
    seen.add(shape.name);
    // Label the card by the shape rather than by the symbol that resolved to it.
    out.push(shape.name);
  }
  return out;
});

// A shape the dataset does not cover would render an empty card, which reads
// as a bug rather than as a gap; those are listed as text instead.
const missing = computed(() => chords.value.filter((c) => !findFingering(c)));
</script>

<template>
  <div class="rounded-lg border border-black/10 bg-white p-4">
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      <div
        v-for="chord in playable" :key="chord"
        class="flex justify-center rounded border border-black/8 py-2"
      >
        <ChordDiagram :symbol="chord" />
      </div>
    </div>

    <p v-if="missing.length" class="mt-3 text-xs text-black/40">
      Bez dijagrama: <span class="font-mono">{{ missing.join(', ') }}</span>
    </p>
    <p v-if="!playable.length" class="text-sm text-black/40">
      U ovoj pjesmi nema prepoznatih akorda.
    </p>
  </div>
</template>
