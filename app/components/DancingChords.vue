<script setup>
import { extractChords, transposeContent, normalizeNotation } from '~/utils/chordpro';
import { findFingering } from '~/utils/chordEngine';
import ChordIcon from '~/components/ChordIcon.vue';

const props = defineProps({
  content: { type: String, default: '' },
  semitones: { type: Number, default: 0 },
  capo: { type: Number, default: 0 },
  originalKey: { type: String, default: '' },
  locked: { type: Boolean, default: false }
});

const localePath = useLocalePath();
const isOpen = ref(false);
const instrument = ref('guitar');

/**
 * Chords extracted from current song content taking transpose into account
 */
const chords = computed(() =>
  extractChords(
    normalizeNotation(
      transposeContent(
        props.content,
        props.semitones - props.capo,
        props.originalKey
      )
    )
  )
);

const playable = computed(() => {
  if (props.locked) return [];
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

// Notify global state whether this floating button is visible
const { hasFloatingChords } = useFloatingChords();
watch(
  () => playable.value.length > 0,
  (val) => {
    hasFloatingChords.value = val;
  },
  { immediate: true }
);

const missing = computed(() => (props.locked ? [] : chords.value.filter((c) => !findFingering(c, 0, instrument.value))));

onBeforeUnmount(() => {
  hasFloatingChords.value = false;
});

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
    <Transition name="popup">
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
              class="group relative flex flex-col items-center justify-between rounded-xl border border-line bg-surface/90 p-2 backdrop-blur-md shadow-2xs transition-colors duration-150 hover:border-accent/50 hover:bg-panel hover:shadow-md overflow-hidden cursor-pointer"
            >
              <div class="pointer-events-none absolute -right-5 -top-5 size-12 rounded-full bg-accent/5 blur-md group-hover:bg-accent/15 transition-colors" />
              <ChordDiagram :symbol="chord" :instrument="instrument" :compact="true" />
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
      ]
"
      :title="isOpen ? 'Zatvori akorde' : 'Prikaži akorde pjesme'"
      @click="isOpen = !isOpen"
    >
      <!-- Animated Chord Fretboard Icon -->
      <span
        class="inline-flex items-center justify-center transition-transform duration-300 pointer-events-none"
        :class="isOpen ? 'rotate-12 scale-110' : 'group-hover:scale-105'"
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
