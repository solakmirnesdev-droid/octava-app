<script setup>
import { transposeKey } from '~/utils/chordpro';

const props = defineProps({
  semitones: { type: Number, default: 0 },
  originalKey: { type: String, default: '' }
});
const emit = defineEmits(['update:semitones']);

const open = ref(false);

const value = ref(props.semitones);
watch(() => props.semitones, (next) => { value.value = next; });

const signed = (offset) => (offset > 6 ? offset - 12 : offset);

const keys = computed(() =>
  Array.from({ length: 12 }, (_, offset) => ({
    offset,
    shift: signed(offset),
    name: transposeKey(props.originalKey, offset)
  }))
);

const currentKey = computed(() => transposeKey(props.originalKey, value.value));

const offsetLabel = computed(() =>
  value.value === 0 ? 'orig' : (value.value > 0 ? '+' : '') + value.value
);

function set(next) {
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
  <div class="relative">
    <div class="flex items-center gap-1.5 sm:gap-2">
      <span class="hidden text-xs font-semibold uppercase tracking-wider text-faint md:inline">
        {{ $t('song.key') }}
      </span>

      <div class="inline-flex items-center rounded-xl border border-line bg-surface/90 p-0.5 shadow-2xs">
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-xs font-bold text-muted hover:bg-panel hover:text-accent transition-colors"
          :title="$t('song.semitonesDown', { n: 2 }, 2)"
          @click="shift(-2)"
        >−2</button>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-xs font-bold text-muted hover:bg-panel hover:text-accent transition-colors"
          :title="$t('song.semitonesDown', { n: 1 }, 1)"
          @click="shift(-1)"
        >−1</button>

        <button
          type="button"
          class="min-w-[4rem] sm:min-w-[4.5rem] rounded-lg px-2 py-1 text-center transition-colors"
          :class="open ? 'bg-panel text-accent shadow-xs' : 'text-ink hover:bg-panel'"
          :title="$t('song.chooseKey')"
          :aria-expanded="open"
          @click="open = !open"
        >
          <span class="block font-mono text-xs sm:text-sm font-extrabold leading-tight">{{ currentKey || '—' }}</span>
          <span class="block font-mono text-[9px] leading-tight text-faint">{{ offsetLabel }}</span>
        </button>

        <button
          type="button"
          class="rounded-lg px-2 py-1 text-xs font-bold text-muted hover:bg-panel hover:text-accent transition-colors"
          :title="$t('song.semitonesUp', { n: 1 }, 1)"
          @click="shift(1)"
        >+1</button>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-xs font-bold text-muted hover:bg-panel hover:text-accent transition-colors"
          :title="$t('song.semitonesUp', { n: 2 }, 2)"
          @click="shift(2)"
        >+2</button>
      </div>

      <button
        v-if="value !== 0"
        type="button"
        class="flex size-7 sm:size-8 items-center justify-center rounded-lg border border-line bg-surface/70 text-muted transition hover:border-accent hover:bg-panel hover:text-accent shadow-2xs"
        :title="$t('song.backToOriginal', { key: originalKey })"
        :aria-label="$t('song.backToOriginal', { key: originalKey })"
        @click="set(0)"
      >
        <Icon name="material-symbols:restart-alt-rounded" class="text-sm sm:text-base" />
      </button>
    </div>

    <!-- Absolute positioned 12-key dropdown overlay (Never causes layout shift!) -->
    <div
      v-if="open"
      class="absolute left-0 top-full mt-2 z-30 grid grid-cols-4 gap-1 rounded-2xl border border-line bg-panel p-2.5 shadow-xl backdrop-blur-md min-w-[220px]"
    >
      <button
        v-for="key in keys" :key="key.offset"
        type="button"
        class="rounded-lg p-1.5 text-center transition-all"
        :class="key.shift === value ? 'bg-accent text-on-accent font-bold shadow-xs' : 'hover:bg-surface text-muted hover:text-ink'"
        @click="pick(key.offset)"
      >
        <span class="block font-mono text-xs font-bold">{{ key.name }}</span>
        <span class="block text-[9px] opacity-70">
          {{ key.shift === 0 ? 'orig' : (key.shift > 0 ? '+' : '') + key.shift }}
        </span>
      </button>
    </div>
  </div>
</template>
