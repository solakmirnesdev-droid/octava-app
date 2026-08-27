<script setup>
import { MIN_BPM, MAX_BPM } from '~/composables/useMetronome';

const { t } = useI18n();
const { running, bpm, beatsPerBar, beat, toggle, setBpm, tap } = useMetronome();

/**
 * AI-NOTE: six beats is labelled 6/8, not 6/4. Both exist, but a guitarist who
 * reaches for six is counting a shuffle or a waltz-feel ballad — 6/8 — and 6/4
 * is rare enough that offering it would read as a typo.
 */
const BARS = [
  { beats: 2, label: '2/4' },
  { beats: 3, label: '3/4' },
  { beats: 4, label: '4/4' },
  { beats: 6, label: '6/8' }
];

/** The tempo words a musician actually reads off a score. */
const MARKINGS = [
  { at: 60, key: 'metronome.largo' },
  { at: 76, key: 'metronome.adagio' },
  { at: 108, key: 'metronome.andante' },
  { at: 120, key: 'metronome.moderato' },
  { at: 168, key: 'metronome.allegro' },
  { at: 200, key: 'metronome.presto' },
  { at: Infinity, key: 'metronome.prestissimo' }
];

const marking = computed(() => MARKINGS.find((m) => bpm.value < m.at)?.key || 'metronome.prestissimo');

const tapped = ref(false);
function onTap() {
  tap();
  tapped.value = true;
  window.setTimeout(() => { tapped.value = false; }, 150);
}

/** Space starts and stops, the way every metronome does. */
function onKey(event) {
  if (event.code !== 'Space' || event.target.tagName === 'INPUT') return;
  event.preventDefault();
  toggle();
}

onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));

useSeoMeta({
  title: t('meta.metronomeTitle'),
  description: t('meta.metronomeDesc'),
  ogTitle: t('page.metronome')
});
</script>

<template>
  <div class="mx-auto max-w-xl">
    <header class="mb-8">
      <h1 class="text-2xl font-semibold tracking-tight">{{ $t('page.metronome') }}</h1>
      <p class="mb-6 text-sm text-muted">{{ $t('page.metronomeLead') }}</p>
    </header>

    <div class="rounded-lg border border-line bg-panel p-6">
      <!-- One dot per beat, so the bar is visible and not just audible. -->
      <div class="mb-6 flex justify-center gap-2.5">
        <span
          v-for="n in beatsPerBar" :key="n"
          class="size-3 rounded-full transition-colors duration-75"
          :class="beat === n - 1
            ? (n === 1 ? 'bg-accent' : 'bg-ink')
            : 'bg-sunken'"
          aria-hidden="true"
        />
      </div>

      <div class="text-center">
        <p class="font-mono text-6xl font-semibold leading-none tabular-nums">{{ bpm }}</p>
        <p class="mt-1 text-sm text-faint">{{ $t(marking) }}</p>
      </div>

      <!-- The slider is the coarse move and the buttons are the fine one; a
           drummer counting in wants ±1, a guitarist finding a feel wants ±20. -->
      <div class="mt-6 flex items-center gap-3">
        <button
          class="w-9 shrink-0 rounded border border-line-strong py-1.5 font-mono text-sm hover:border-accent hover:text-accent"
          :aria-label="$t('metronome.slower')"
          @click="setBpm(bpm - 1)"
        >−</button>

        <input
          :value="bpm" type="range" :min="MIN_BPM" :max="MAX_BPM" step="1"
          class="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-sunken accent-accent"
          :aria-label="$t('metronome.tempo')"
          @input="setBpm($event.target.value)"
        >

        <button
          class="w-9 shrink-0 rounded border border-line-strong py-1.5 font-mono text-sm hover:border-accent hover:text-accent"
          :aria-label="$t('metronome.faster')"
          @click="setBpm(bpm + 1)"
        >+</button>
      </div>

      <div class="mt-6 flex gap-2">
        <button
          class="flex-1 rounded py-3 font-medium transition-colors"
          :class="running ? 'border border-line-strong text-ink hover:border-accent' : 'bg-ink text-on-ink hover:bg-accent'"
          @click="toggle"
        >{{ running ? $t('metronome.stop') : $t('metronome.start') }}</button>

        <button
          class="w-28 rounded border py-3 text-sm transition-colors"
          :class="tapped ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong text-muted hover:border-accent hover:text-accent'"
          :title="$t('metronome.tapHint')"
          @click="onTap"
        >{{ $t('metronome.tap') }}</button>
      </div>

      <p class="mt-3 text-center text-xs text-faint">{{ $t('metronome.spaceHint') }}</p>
    </div>

    <div class="mt-6">
      <p class="mb-2 text-xs uppercase tracking-wide text-faint">{{ $t('metronome.bar') }}</p>
      <div class="flex gap-2">
        <button
          v-for="bar in BARS" :key="bar.beats"
          class="flex-1 rounded border py-2 font-mono text-sm transition-colors"
          :class="beatsPerBar === bar.beats
            ? 'border-accent bg-accent-soft text-accent'
            : 'border-line-strong text-muted hover:border-accent hover:text-accent'"
          @click="beatsPerBar = bar.beats"
        >{{ bar.label }}</button>
      </div>
    </div>

    <p class="mt-6 text-xs text-faint">{{ $t('metronome.note') }}</p>
  </div>
</template>
