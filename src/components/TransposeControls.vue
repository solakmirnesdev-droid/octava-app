<script setup>
import { computed } from 'vue';
import { transposeChord } from '../utils/chordpro';

const props = defineProps({
  semitones: { type: Number, default: 0 },
  originalKey: { type: String, default: '' }
});
const emit = defineEmits(['update:semitones']);

// Beyond a fifth in either direction the shapes stop being playable in open
// position, which is the point where a capo is the better answer anyway.
const MIN = -6;
const MAX = 6;

const currentKey = computed(() => {
  if (!props.originalKey) return '';
  const isMinor = /m$/.test(props.originalKey) && !/maj/i.test(props.originalKey);
  const root = isMinor ? props.originalKey.slice(0, -1) : props.originalKey;
  return transposeChord(root, props.semitones) + (isMinor ? 'm' : '');
});

const shift = (delta) => {
  const next = Math.min(MAX, Math.max(MIN, props.semitones + delta));
  emit('update:semitones', next);
};
</script>

<template>
  <div class="flex items-center gap-3">
    <span class="text-xs font-medium uppercase tracking-wide text-black/40">Tonalitet</span>

    <div class="flex items-center rounded border border-black/15 bg-white">
      <button
        class="px-3 py-1.5 text-sm hover:text-accent disabled:opacity-30"
        :disabled="semitones <= MIN" aria-label="Snizi za pola tona"
        @click="shift(-1)"
      >−</button>

      <span class="min-w-[3.5rem] border-x border-black/10 px-2 py-1.5 text-center font-mono text-sm font-semibold">
        {{ currentKey || '—' }}
      </span>

      <button
        class="px-3 py-1.5 text-sm hover:text-accent disabled:opacity-30"
        :disabled="semitones >= MAX" aria-label="Povisi za pola tona"
        @click="shift(1)"
      >+</button>
    </div>

    <button
      v-if="semitones !== 0"
      class="text-xs text-black/40 underline hover:text-accent"
      @click="emit('update:semitones', 0)"
    >
      original ({{ originalKey }})
    </button>
  </div>
</template>
