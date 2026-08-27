<script setup>
import { extractChords, transposeContent, normalizeNotation } from '~/utils/chordpro';
import { findFingering } from '~/utils/chordEngine';

const props = defineProps({
  content: { type: String, default: '' },
  semitones: { type: Number, default: 0 },
  /** Display only; see ChordSheet. The grid must show the same shapes. */
  capo: { type: Number, default: 0 },
  originalKey: { type: String, default: '' }
});

/**
 * Chords are read from the transposed text rather than the stored text, so the
 * grid follows the key the reader is actually looking at.
 */
const chords = computed(() =>
  extractChords(normalizeNotation(
    transposeContent(props.content, props.semitones - props.capo, props.originalKey)))
);

/**
 * One card per distinct chord.
 *
 * Slash chords used to fall back to the shape before the slash, so G/H and G
 * showed the same fingering twice. They now get their own voicing — G/H really
 * is a different grip — so both belong on the panel.
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
  <div class="rounded-lg border border-line bg-panel p-4">
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      <div
        v-for="chord in playable" :key="chord"
        class="flex justify-center rounded border border-line py-2"
      >
        <ChordDiagram :symbol="chord" />
      </div>
    </div>

    <p v-if="missing.length" class="mt-3 text-xs text-faint">{{ $t('song.noDiagrams') }} <span class="font-mono">{{ missing.join(', ') }}</span>
    </p>
    <p v-if="!playable.length" class="text-sm text-faint">
      {{ $t('song.noChords') }}
    </p>
  </div>
</template>
