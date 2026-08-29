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
  <div class="rounded-3xl border border-line/75 bg-gradient-to-br from-panel/95 via-panel/80 to-surface/90 p-5 sm:p-6 backdrop-blur-md shadow-sm">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon name="material-symbols:grid-view-rounded" class="text-accent text-lg" />
        <h3 class="text-xs font-bold uppercase tracking-wider text-faint">{{ $t('song.allChords') }}</h3>
      </div>
      <span class="text-xs font-mono text-faint">{{ playable.length }} akorda</span>
    </div>

    <div class="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      <div
        v-for="chord in playable" :key="chord"
        class="group relative flex flex-col items-center justify-between rounded-2xl border border-line/75 bg-surface/85 p-3.5 sm:p-4 backdrop-blur-md shadow-xs transition-colors duration-150 hover:border-accent/50 hover:bg-panel hover:shadow-md overflow-hidden cursor-pointer"
      >
        <div class="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-accent/5 blur-xl group-hover:bg-accent/15 transition-colors" />
        <ChordDiagram :symbol="chord" />
      </div>
    </div>

    <p v-if="missing.length" class="mt-4 text-xs text-faint border-t border-line-soft pt-3">
      {{ $t('song.noDiagrams') }} <span class="font-mono text-muted">{{ missing.join(', ') }}</span>
    </p>
    <p v-if="!playable.length" class="text-sm text-faint py-4 text-center">
      {{ $t('song.noChords') }}
    </p>
  </div>
</template>
