<script setup>
import { transposeKey } from '~/utils/chordpro';

const props = defineProps({
  semitones: { type: Number, default: 0 },
  originalKey: { type: String, default: '' }
});
const emit = defineEmits(['update:semitones']);

const open = ref(false);

/**
 * Local mirror of the prop.
 *
 * Stepping computed straight from props.semitones drops updates when two
 * clicks land in the same tick: the second one reads the value the first has
 * not written back yet, so +2 then +1 lands on +1 rather than +3. Holding the
 * value locally and syncing the prop back keeps rapid stepping additive.
 */
const value = ref(props.semitones);
watch(() => props.semitones, (next) => { value.value = next; });

/**
 * Transposition wraps at twelve: +7 and -5 produce identical chords, so there
 * are only twelve distinct destinations no matter how wide the range looks.
 * Offsets past the tritone are shown as their negative twin, because "-5" is
 * the shorter way to say the same thing.
 */
const signed = (offset) => (offset > 6 ? offset - 12 : offset);

const keys = computed(() =>
  Array.from({ length: 12 }, (_, offset) => ({
    offset,
    shift: signed(offset),
    name: transposeKey(props.originalKey, offset)
  }))
);

const currentKey = computed(() => transposeKey(props.originalKey, value.value));

/** 0-11, regardless of which direction the user travelled to get here. */
const normalized = computed(() => ((value.value % 12) + 12) % 12);

const offsetLabel = computed(() =>
  value.value === 0 ? 'original' : (value.value > 0 ? '+' : '') + value.value
);

/**
 * A capo raises pitch, so any transposition upward can be played with the
 * original shapes by capoing that many frets. Past the seventh fret the frets
 * are too narrow for comfortable chording, so the hint stops being useful.
 */
const capoHint = computed(() => {
  const fret = normalized.value;
  if (fret < 1 || fret > 7) return null;
  return { fret, shapes: props.originalKey };
});

function set(next) {
  // Wrap rather than clamp: stepping past the end lands on the next key round
  // the circle, which is where the chords actually go.
  value.value = next > 11 ? next - 12 : next < -11 ? next + 12 : next;
  emit('update:semitones', value.value);
}

const shift = (delta) => set(value.value + delta);

function pick(offset) {
  set(signed(offset));
  open.value = false;
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex flex-wrap items-center gap-2">
      <span class="hidden text-xs font-medium uppercase tracking-wide text-faint sm:inline">{{ $t('song.key') }}</span>

      <div class="flex items-center overflow-hidden rounded border border-line-strong bg-panel">
        <button class="px-2.5 py-1.5 text-sm font-medium hover:bg-raised hover:text-accent"
                :title="$t('song.semitonesDown', { n: 2 }, 2)" @click="shift(-2)">−2</button>
        <button class="border-l border-line px-2.5 py-1.5 text-sm font-medium hover:bg-raised hover:text-accent"
                :title="$t('song.semitonesDown', { n: 1 }, 1)" @click="shift(-1)">−1</button>

        <button
          class="min-w-[4.75rem] border-x border-line px-2 py-1.5 text-center hover:bg-raised"
          :title="$t('song.chooseKey')"
          :aria-expanded="open"
          @click="open = !open"
        >
          <span class="block font-mono text-sm font-semibold leading-none">{{ currentKey || '—' }}</span>
          <span class="mt-0.5 block text-[10px] leading-none text-faint">{{ offsetLabel }}</span>
        </button>

        <button class="px-2.5 py-1.5 text-sm font-medium hover:bg-raised hover:text-accent"
                :title="$t('song.semitonesUp', { n: 1 }, 1)" @click="shift(1)">+1</button>
        <button class="border-l border-line px-2.5 py-1.5 text-sm font-medium hover:bg-raised hover:text-accent"
                :title="$t('song.semitonesUp', { n: 2 }, 2)" @click="shift(2)">+2</button>
      </div>

      <button
        v-if="value !== 0"
        class="text-xs text-faint underline hover:text-accent"
        @click="set(0)"
      >
        vrati na {{ originalKey }}
      </button>
    </div>

    <!-- All twelve destinations. There is no thirteenth: the interval wraps. -->
    <div v-if="open" class="flex flex-wrap gap-1 rounded border border-line bg-panel p-2">
      <button
        v-for="key in keys" :key="key.offset"
        class="min-w-[3.25rem] rounded px-2 py-1 text-center hover:bg-accent-soft"
        :class="key.shift === value ? 'bg-ink text-on-ink hover:bg-ink' : ''"
        @click="pick(key.offset)"
      >
        <span class="block font-mono text-sm font-semibold leading-none">{{ key.name }}</span>
        <span class="mt-0.5 block text-[10px] leading-none opacity-50">
          {{ key.shift === 0 ? 'original' : (key.shift > 0 ? '+' : '') + key.shift }}
        </span>
      </button>
    </div>

    <i18n-t keypath="song.sameSound" tag="p" v-if="capoHint" class="text-xs text-faint" scope="global">
        <template #fret><strong>{{ capoHint.fret }}</strong></template>
        <template #key><strong class="font-mono">{{ capoHint.shapes }}</strong></template>
      </i18n-t>
  </div>
</template>
