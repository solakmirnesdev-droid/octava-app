<script setup>
import { extractChords, transposeContent, normalizeNotation } from '~/utils/chordpro';
import { findFingering } from '~/utils/chordEngine';

const props = defineProps({
  content: { type: String, default: '' },
  semitones: { type: Number, default: 0 },
  capo: { type: Number, default: 0 },
  originalKey: { type: String, default: '' },
  modelValue: { type: Boolean, default: undefined }
});

const emit = defineEmits(['update:modelValue']);

const internalOpen = ref(false);
const isOpen = computed({
  get: () => (props.modelValue !== undefined ? props.modelValue : internalOpen.value),
  set: (val) => {
    internalOpen.value = val;
    emit('update:modelValue', val);
  }
});

const instrument = ref('guitar');
const localePath = useLocalePath();

/**
 * Extract transposed chords according to current semitones and capo
 */
const chords = computed(() =>
  extractChords(normalizeNotation(
    transposeContent(props.content, props.semitones - props.capo, props.originalKey)
  ))
);

const playable = computed(() => {
  const seen = new Set();
  const out = [];

  for (const chord of chords.value) {
    const shape = findFingering(chord, 0, instrument.value);
    if (!shape || seen.has(shape.name)) continue;
    seen.add(shape.name);
    out.push(shape.name);
  }
  return out;
});

const missing = computed(() => chords.value.filter((c) => !findFingering(c, 0, instrument.value)));

const ringingChord = ref(null);
let ringTimer = null;

function onChordPlay(chord) {
  ringingChord.value = chord;
  window.clearTimeout(ringTimer);
  ringTimer = window.setTimeout(() => {
    ringingChord.value = null;
  }, 850);
}

onBeforeUnmount(() => window.clearTimeout(ringTimer));

// Close popover when clicking outside
function onClickOutside(e) {
  if (isOpen.value && !e.target.closest('[data-dancing-chords]')) {
    isOpen.value = false;
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', onClickOutside);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', onClickOutside);
  }
});
</script>

<template>
  <div
    v-if="playable.length"
    class="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-40 flex flex-col items-end"
    data-dancing-chords
    data-print="hide"
  >
    <!-- Popover Mini Chords Sheet / Companion (Positioned to the left of floating buttons) -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-3 sm:translate-x-3 scale-95"
      enter-to-class="opacity-100 translate-y-0 sm:translate-x-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 sm:translate-x-0 scale-100"
      leave-to-class="opacity-0 translate-y-3 sm:translate-x-3 scale-95"
    >
      <div
        v-if="isOpen"
        class="fixed right-3 sm:right-20 bottom-18 sm:bottom-6 z-40 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-5.5rem)] sm:max-h-[calc(100dvh-6.5rem)] flex flex-col rounded-3xl border border-line bg-panel/95 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 overflow-hidden"
        role="dialog"
        aria-label="Akordi pjesme"
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 border-b border-line-soft/80 px-3.5 py-3 sm:px-4 sm:py-3.5 bg-surface/40">
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            <span class="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent shadow-xs ring-1 ring-accent/20">
              <ChordIcon size="1.45em" />
            </span>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-bold text-ink tracking-tight truncate">
                {{ $t('song.songChords') }}
              </h3>
              <p class="text-[11px] text-muted leading-tight mt-0.5 truncate">
                {{ $t('song.chordHear') }}
              </p>
            </div>
          </div>

          <!-- Aligned Right: Count Badge + Close Action -->
          <div class="flex items-center gap-1.5 shrink-0">
            <span
              class="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent/15 px-2 font-mono text-xs font-bold text-accent ring-1 ring-accent/25"
              :title="`${playable.length} akorda`"
            >
              {{ playable.length }}
            </span>

            <button
              type="button"
              class="flex size-7.5 items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-ink transition-colors outline-none cursor-pointer"
              :title="$t('common.close')"
              @click="isOpen = false"
            >
              <Icon name="material-symbols:close-rounded" class="text-lg" />
            </button>
          </div>
        </div>

        <!-- Instrument Quick Switcher -->
        <div class="flex items-center gap-1 px-3 pt-2 pb-1">
          <button
            type="button"
            class="flex-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer"
            :class="instrument === 'guitar' ? 'bg-accent text-on-accent shadow-xs' : 'text-muted hover:bg-surface hover:text-ink'"
            @click="instrument = 'guitar'"
          >
            Gitara
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer"
            :class="instrument === 'ukulele' ? 'bg-accent text-on-accent shadow-xs' : 'text-muted hover:bg-surface hover:text-ink'"
            @click="instrument = 'ukulele'"
          >
            Ukulele
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer"
            :class="instrument === 'bass' ? 'bg-accent text-on-accent shadow-xs' : 'text-muted hover:bg-surface hover:text-ink'"
            @click="instrument = 'bass'"
          >
            Bas
          </button>
        </div>

        <!-- Scrollable Chord Diagrams Grid (Compact) -->
        <div class="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="chord in playable"
              :key="chord"
              class="group relative flex flex-col items-center justify-between rounded-xl border bg-surface/90 p-2 backdrop-blur-md shadow-2xs transition-all duration-300 hover:border-accent/60 hover:bg-panel hover:shadow-md overflow-hidden cursor-pointer"
              :class="ringingChord === chord
                ? 'border-accent ring-2 ring-accent/50 shadow-[0_0_20px_rgba(224,90,58,0.35)]'
                : 'border-line'"
            >
              <div class="pointer-events-none absolute -right-5 -top-5 size-12 rounded-full bg-accent/5 blur-md group-hover:bg-accent/15 transition-colors" />
              <ChordDiagram :symbol="chord" :instrument="instrument" :compact="true" @play="onChordPlay(chord)" />
            </div>
          </div>

          <p v-if="missing.length" class="text-[10px] text-faint border-t border-line-soft pt-1.5 font-mono">
            {{ $t('song.noDiagrams') }} <span class="text-muted">{{ missing.join(', ') }}</span>
          </p>
        </div>

        <!-- Footer link -->
        <div class="border-t border-line-soft/80 px-3 py-2 flex items-center justify-between text-[10.5px] bg-surface/50">
          <NuxtLink
            :to="localePath('/akordi')"
            class="text-accent hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <span>Svi akordi (katalog)</span>
            <Icon name="material-symbols:arrow-forward-rounded" class="text-[11px]" />
          </NuxtLink>

          <span class="text-faint font-mono text-[9.5px]">Klikni za ton</span>
        </div>
      </div>
    </Transition>

    <!-- Floating Dancing Chords Button Trigger -->
    <button
      type="button"
      class="group relative flex size-12 sm:size-13 items-center justify-center rounded-2xl border transition-all duration-200 shadow-xl backdrop-blur-xl outline-none cursor-pointer"
      :class="[
        isOpen
          ? 'border-accent bg-accent-soft text-accent ring-2 ring-accent/40 shadow-accent/20 scale-105'
          : 'border-line/80 bg-panel/90 text-accent hover:border-accent hover:bg-panel hover:scale-105'
      ]"
      :title="isOpen ? 'Zatvori akorde' : 'Prikaži akorde pjesme'"
      @click="isOpen = !isOpen"
    >
      <!-- Dancing Animated Chord Fretboard Icon -->
      <span
        class="inline-flex items-center justify-center transition-transform pointer-events-none"
        :class="isOpen ? 'dancing-chord-active' : 'dancing-chord-idle'"
      >
        <ChordIcon size="1.6em" />
      </span>

      <!-- Chord Count Badge -->
      <span
        class="absolute -top-1 -right-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-mono font-bold text-on-accent shadow-xs"
      >
        {{ playable.length }}
      </span>
    </button>
  </div>
</template>

<style scoped>
/* Idle Gentle Chord Vibrato Dance Animation */
.dancing-chord-idle {
  animation: chordIdleDance 2.2s ease-in-out infinite alternate;
  transform-origin: 50% 80%;
}

@keyframes chordIdleDance {
  0% {
    transform: rotate(-6deg) translateY(0);
  }
  50% {
    transform: rotate(0deg) translateY(-2px) scale(1.04);
  }
  100% {
    transform: rotate(6deg) translateY(0);
  }
}

/* Active Open Dance Animation */
.dancing-chord-active {
  animation: chordActiveDance 1s ease-in-out infinite alternate;
  transform-origin: 50% 80%;
}

@keyframes chordActiveDance {
  0% {
    transform: rotate(-12deg) scale(1.08);
  }
  100% {
    transform: rotate(12deg) scale(1.08);
  }
}
</style>
