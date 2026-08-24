<script setup>
import { transposeKey } from '~/utils/chordpro';

const props = defineProps({
  semitones: { type: Number, default: 0 },
  originalKey: { type: String, default: '' }
});
const emit = defineEmits(['update:semitones']);

// A full octave in either direction. Past a tritone the open shapes stop being
// practical, but capo users still reach for the far end, so the range stays wide.
const MIN = -12;
const MAX = 12;

const currentKey = computed(() => transposeKey(props.originalKey, props.semitones));

const offsetLabel = computed(() =>
  props.semitones === 0 ? 'original' : (props.semitones > 0 ? '+' : '') + props.semitones
);

const shift = (delta) =>
  emit('update:semitones', Math.min(MAX, Math.max(MIN, props.semitones + delta)));
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <span class="text-xs font-medium uppercase tracking-wide text-black/40">Tonalitet</span>

    <div class="flex items-center overflow-hidden rounded border border-black/15 bg-white">
      <button
        class="px-2.5 py-1.5 text-sm font-medium hover:bg-black/5 hover:text-accent disabled:opacity-25"
        :disabled="semitones <= MIN" title="−2 polutona" @click="shift(-2)"
      >−2</button>
      <button
        class="border-l border-black/10 px-2.5 py-1.5 text-sm font-medium hover:bg-black/5 hover:text-accent disabled:opacity-25"
        :disabled="semitones <= MIN" title="−1 poluton" @click="shift(-1)"
      >−1</button>

      <span class="min-w-[4.5rem] border-x border-black/10 px-2 py-1.5 text-center">
        <span class="block font-mono text-sm font-semibold leading-none">{{ currentKey || '—' }}</span>
        <span class="mt-0.5 block text-[10px] leading-none text-black/40">{{ offsetLabel }}</span>
      </span>

      <button
        class="px-2.5 py-1.5 text-sm font-medium hover:bg-black/5 hover:text-accent disabled:opacity-25"
        :disabled="semitones >= MAX" title="+1 poluton" @click="shift(1)"
      >+1</button>
      <button
        class="border-l border-black/10 px-2.5 py-1.5 text-sm font-medium hover:bg-black/5 hover:text-accent disabled:opacity-25"
        :disabled="semitones >= MAX" title="+2 polutona" @click="shift(2)"
      >+2</button>
    </div>

    <button
      v-if="semitones !== 0"
      class="text-xs text-black/40 underline hover:text-accent"
      @click="emit('update:semitones', 0)"
    >
      vrati na {{ originalKey }}
    </button>
  </div>
</template>
