<script setup>
const { t } = useI18n();
import { note as pluck } from '~/utils/chordAudio';

const {
  listening, error, reading, nearestString, inTune, start, stop,
  instrument, strings, INSTRUMENTS, focus
} = useTuner();

/**
 * A reference note you can hear.
 *
 * AI-NOTE: tuning by ear against a played note is how most people actually do
 * it, and it is the only way that works at all when the microphone cannot hear
 * over the room. The six cards were already showing the frequencies; making
 * them play is the smaller half of the work.
 */
const sounded = ref(null);
let soundTimer = null;

function hear(string) {
  if (!pluck(string.frequency)) return;
  sounded.value = string.frequency;
  window.clearTimeout(soundTimer);
  soundTimer = window.setTimeout(() => { sounded.value = null; }, 900);
}

onBeforeUnmount(() => window.clearTimeout(soundTimer));

/**
 * Needle position, clamped to +/- 50 cents.
 *
 * Half a semitone either way is the whole useful range: past that the reading
 * belongs to the neighbouring note, and the display switches to that note
 * rather than pinning at the edge.
 */
const needle = computed(() => {
  if (!reading.value) return 50;
  return 50 + Math.max(-50, Math.min(50, reading.value.cents));
});

const verdict = computed(() => {
  if (!reading.value) return null;
  if (inTune.value) return { text: t('meta.inTune'), tone: 'text-ok' };
  return reading.value.cents < 0
    ? { text: 'nisko — zategni', tone: 'text-warn' }
    : { text: 'visoko — popusti', tone: 'text-warn' };
});

useSeoMeta({
  title: t('meta.tunerTitle'),
  description: t('meta.tunerDesc'),
  ogTitle: t('meta.tunerOg')
});

// Canonical and hreflang come from useLocaleHead in app.vue. A hard-coded
// canonical here pointed every English page at its Bosnian counterpart,
// which tells a search engine to index that one instead.
</script>

<template>
  <div class="mx-auto max-w-xl">
    <header class="mb-8">
      <h1 class="text-2xl font-semibold tracking-tight">{{ $t('page.tuner') }}</h1>
      <i18n-t keypath="page.tuningLead" tag="p" class="mb-6 text-sm text-muted" scope="global">
        <template #tuning><span class="font-mono">{{ INSTRUMENTS[instrument].tuning }}</span></template>
      </i18n-t>
    </header>

    <!-- The instrument decides both the reference notes and which string a
         reading is measured against, so it belongs above the meter. -->
    <div class="mb-4 flex gap-2">
      <button
        v-for="(spec, key) in INSTRUMENTS" :key="key"
        type="button"
        class="rounded border px-3 py-1.5 text-sm transition-colors"
        :class="instrument === key
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-line-strong text-muted hover:border-accent hover:text-accent'"
        @click="instrument = key"
      >{{ $t(spec.labelKey) }}</button>
    </div>

    <div class="rounded-lg border border-line bg-panel p-6">
      <div v-if="!listening" class="py-8 text-center">
        <button
          class="rounded bg-ink px-6 py-3 font-medium text-on-ink hover:bg-accent"
          @click="start"
        >
          {{ $t('page.micOn') }}
        </button>
        <p v-if="error" role="alert" class="mt-4 text-sm text-accent">{{ error }}</p>
        <p v-else class="mt-4 text-xs text-faint">
          {{ $t('page.micPrivacy') }}
        </p>
      </div>

      <div v-else>
        <div class="mb-2 text-center">
          <p class="font-mono text-5xl font-semibold leading-none" :class="inTune ? 'text-ok' : 'text-ink'">
            {{ reading ? reading.note : '—' }}<span
              v-if="reading" class="align-super text-xl text-dim"
            >{{ reading.octave }}</span>
          </p>
          <p v-if="verdict" class="mt-2 text-sm font-medium" :class="verdict.tone">{{ verdict.text }}</p>
          <p v-else class="mt-2 text-sm text-faint">{{ $t('page.playString') }}</p>
        </div>

        <!-- Cent scale. Centre is in tune; the shaded band is the tolerance. -->
        <div class="relative mt-6 h-16">
          <div class="absolute inset-x-0 top-7 h-px bg-sunken" />
          <div class="absolute left-1/2 top-4 h-8 w-[10%] -translate-x-1/2 rounded bg-ok-soft/10" />
          <div class="absolute left-1/2 top-3 h-10 w-px -translate-x-1/2 bg-line-strong" />

          <div
            v-if="reading"
            class="absolute top-2 h-12 w-1 -translate-x-1/2 rounded-full transition-all duration-150"
            :class="inTune ? 'bg-ok-soft' : 'bg-accent'"
            :style="{ left: needle + '%' }"
          />

          <span class="absolute left-0 top-12 font-mono text-[10px] text-faint">−50</span>
          <span class="absolute left-1/2 top-12 -translate-x-1/2 font-mono text-[10px] text-dim">0</span>
          <span class="absolute right-0 top-12 font-mono text-[10px] text-faint">+50</span>
        </div>

        <p class="mt-2 text-center font-mono text-xs text-faint">
          <template v-if="reading">
            {{ reading.cents > 0 ? '+' : '' }}{{ reading.cents }} centi ·
            {{ reading.frequency.toFixed(1) }} Hz
          </template>
          <template v-else>&nbsp;</template>
        </p>

        <!-- Offered where the reading is, because it changes what the reading
             will accept — not tucked away in settings. -->
        <label class="mt-6 flex cursor-pointer items-start gap-2.5 rounded border border-line-soft p-3">
          <input v-model="focus" type="checkbox" class="mt-0.5 accent-accent">
          <span class="min-w-0">
            <span class="block text-sm font-medium">{{ $t('tuner.focus') }}</span>
            <span class="block text-xs leading-relaxed text-faint">{{ $t('tuner.focusHint') }}</span>
          </span>
        </label>

        <button
          class="mt-3 w-full rounded border border-line-strong py-2 text-sm hover:border-accent"
          @click="stop"
        >
          {{ $t('page.stop') }}
        </button>
      </div>
    </div>

    <!-- Which open string the reading is nearest, so a badly out-of-tune
         string still tells you which one you are holding. -->
    <div class="mt-6 flex justify-between gap-2">
      <button
        v-for="(string, i) in strings" :key="i"
        type="button"
        class="flex-1 rounded border py-2 text-center transition-colors"
        :class="[
          nearestString && nearestString.frequency === string.frequency
            ? (inTune ? 'border-ok bg-ok-soft/10' : 'border-accent bg-accent-soft')
            : 'border-line hover:border-accent',
          sounded === string.frequency ? 'bg-accent-soft' : ''
        ]"
        :title="$t('tuner.hear', { note: string.label })"
        :aria-label="$t('tuner.hear', { note: string.label })"
        @click="hear(string)"
      >
        <span class="block font-mono text-sm font-semibold">{{ string.label }}</span>
        <span class="block text-[10px] text-faint">{{ string.frequency }}</span>
      </button>
    </div>

    <p class="mt-6 text-xs text-faint">
      Radi najbolje u tihoj prostoriji. Ako očitanje skače, odsviraj žicu jače
      i pusti je da odzvoni prije nego pogledaš.
    </p>
  </div>
</template>
