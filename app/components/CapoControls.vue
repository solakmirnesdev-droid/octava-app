<script setup>
import { suggestions, MAX_CAPO } from '~/utils/capo';

const props = defineProps({
  capo: { type: Number, default: 0 },
  semitones: { type: Number, default: 0 },
  originalKey: { type: String, default: '' },
  content: { type: String, default: '' }
});
const emit = defineEmits(['update:capo']);

const open = ref(false);

const value = ref(props.capo);
watch(() => props.capo, (next) => { value.value = next; });

function set(next) {
  value.value = Math.min(MAX_CAPO, Math.max(0, next));
  emit('update:capo', value.value);
}

const step = (delta) => set(value.value + delta);

const ranked = computed(() => suggestions(props.content, props.semitones));

function pick(fret) {
  set(fret);
  open.value = false;
}
</script>

<template>
  <div class="relative">
    <div class="flex items-center gap-1.5 sm:gap-2">
      <span class="hidden text-xs font-semibold uppercase tracking-wider text-faint md:inline">
        {{ $t('song.capo') }}
      </span>

      <div class="inline-flex items-center rounded-xl border border-line bg-surface/90 p-0.5 shadow-2xs">
        <button
          type="button"
          class="rounded-lg px-2.5 py-1 text-xs font-bold text-muted hover:bg-panel hover:text-accent disabled:opacity-25 transition-colors"
          :disabled="value <= 0"
          :title="$t('capo.down')"
          @click="step(-1)"
        >−</button>

        <button
          type="button"
          class="min-w-[4rem] sm:min-w-[4.5rem] rounded-lg px-2 py-1 text-center transition-colors"
          :class="open ? 'bg-panel text-accent shadow-xs' : 'text-ink hover:bg-panel'"
          :title="$t('capo.choose')"
          :aria-expanded="open"
          @click="open = !open"
        >
          <span class="block font-mono text-xs sm:text-sm font-extrabold leading-tight">
            {{ value === 0 ? '—' : value }}
          </span>
          <span class="block text-[9px] leading-tight text-faint">
            {{ value === 0 ? $t('capo.none') : $t('capo.fret') }}
          </span>
        </button>

        <button
          type="button"
          class="rounded-lg px-2.5 py-1 text-xs font-bold text-muted hover:bg-panel hover:text-accent disabled:opacity-25 transition-colors"
          :disabled="value >= MAX_CAPO"
          :title="$t('capo.up')"
          @click="step(1)"
        >+</button>
      </div>

      <button
        v-if="value !== 0"
        type="button"
        class="flex size-7 sm:size-8 items-center justify-center rounded-lg border border-line bg-surface/70 text-muted transition hover:border-accent hover:bg-panel hover:text-accent shadow-2xs"
        :title="$t('capo.remove')"
        :aria-label="$t('capo.remove')"
        @click="set(0)"
      >
        <Icon name="material-symbols:restart-alt-rounded" class="text-sm sm:text-base" />
      </button>
    </div>

    <!-- Floating Dropdown overlay for capo recommendations (Never causes layout shift!) -->
    <div
      v-if="open"
      class="absolute left-0 top-full mt-2 z-30 flex flex-col gap-1 rounded-2xl border border-line bg-panel p-2 shadow-xl backdrop-blur-md min-w-[210px]"
    >
      <button
        v-for="row in ranked" :key="row.fret"
        type="button"
        class="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left transition-all"
        :class="row.fret === value ? 'bg-accent text-on-accent font-bold shadow-xs' : 'hover:bg-surface text-muted hover:text-ink'"
        @click="pick(row.fret)"
      >
        <span class="font-mono text-xs font-semibold">
          {{ row.fret === 0 ? $t('capo.none') : $t('song.capoFret', { n: row.fret }) }}
        </span>
        <span class="font-mono text-xs opacity-75">{{ row.shapes.join(' ') }}</span>
        <span class="font-mono text-[10px] opacity-60">{{ row.ease }}%</span>
      </button>
    </div>
  </div>
</template>
