<script setup>
import { note as pluck, strum } from '~/utils/chordAudio';
import { findFingering } from '~/utils/chordEngine';

const { t } = useI18n();

const {
  listening, error, reading, nearestString, inTune, start, stop,
  instrument, strings, INSTRUMENTS, focus
} = useTuner();

const sounded = ref(null);
const vibratingIndex = ref(null);
const isStrumming = ref(false);
const activeTestChord = ref(null);

let soundTimer = null;
let vibrateTimer = null;
let chordTimer = null;

function hear(string, index) {
  if (!pluck(string.frequency)) return;
  sounded.value = string.frequency;
  vibratingIndex.value = index;
  window.clearTimeout(soundTimer);
  window.clearTimeout(vibrateTimer);
  soundTimer = window.setTimeout(() => { sounded.value = null; }, 1600);
  vibrateTimer = window.setTimeout(() => { vibratingIndex.value = null; }, 1400);
}

async function strumAll() {
  if (isStrumming.value) return;
  isStrumming.value = true;
  for (let i = 0; i < strings.value.length; i++) {
    const s = strings.value[i];
    hear(s, i);
    await new Promise((r) => setTimeout(r, 450));
  }
  isStrumming.value = false;
}

const TEST_CHORDS_MAP = {
  guitar: ['Em', 'Am', 'C', 'G', 'D', 'E'],
  ukulele: ['C', 'G', 'Am', 'F', 'Dm'],
  bass: ['E', 'A', 'D', 'G']
};

const testChords = computed(() => TEST_CHORDS_MAP[instrument.value] || TEST_CHORDS_MAP.guitar);

function testChord(chordSymbol) {
  const shape = findFingering(chordSymbol);
  if (shape && shape.frets) {
    strum(shape.frets);
    activeTestChord.value = chordSymbol;
    window.clearTimeout(chordTimer);
    chordTimer = window.setTimeout(() => { activeTestChord.value = null; }, 1200);
  }
}

onBeforeUnmount(() => {
  window.clearTimeout(soundTimer);
  window.clearTimeout(vibrateTimer);
  window.clearTimeout(chordTimer);
});

/**
 * Needle position, clamped to +/- 50 cents.
 */
const needle = computed(() => {
  if (!reading.value) return 50;
  return 50 + Math.max(-50, Math.min(50, reading.value.cents));
});

const verdict = computed(() => {
  if (!reading.value) return null;
  if (inTune.value) {
    return { text: t('meta.inTune'), tone: 'text-ok', bg: 'border-ok/30 bg-ok-soft text-ok' };
  }
  return reading.value.cents < 0
    ? { text: 'Nisko — Zategni žicu', tone: 'text-warn', bg: 'border-warn/30 bg-warn-soft text-warn' }
    : { text: 'Visoko — Popusti žicu', tone: 'text-warn', bg: 'border-warn/30 bg-warn-soft text-warn' };
});

// String thickness gauges depending on instrument
const GAUGE_MAP = {
  guitar: [5, 4.2, 3.4, 2.6, 1.8, 1.2],
  bass: [6, 4.8, 3.8, 2.8],
  ukulele: [2.5, 3.2, 2.8, 2.0]
};

function getGauge(index) {
  const gauges = GAUGE_MAP[instrument.value] || GAUGE_MAP.guitar;
  return gauges[index] || 2;
}

const showTip = ref(false);

onMounted(() => {
  try {
    const dismissed = sessionStorage.getItem('octava-tuner-tip-dismissed');
    if (!dismissed) {
      setTimeout(() => {
        showTip.value = true;
      }, 400);
    }
  } catch {
    showTip.value = true;
  }
});

function dismissTip() {
  showTip.value = false;
  try {
    sessionStorage.setItem('octava-tuner-tip-dismissed', '1');
  } catch {}
}

useSeoMeta({
  title: t('meta.tunerTitle'),
  description: t('meta.tunerDesc'),
  ogTitle: t('meta.tunerOg')
});
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-7">
    <!-- Header -->
    <header class="text-center sm:text-left">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-2.5">
          <span class="flex size-8 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <TunerIcon size="1.3em" />
          </span>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-ink">
            {{ $t('page.tuner') }}
          </h1>
        </div>

        <!-- Instrument Switcher Tabs -->
        <div class="inline-flex rounded-xl border border-line bg-panel/80 p-1 backdrop-blur-xs shadow-2xs self-center sm:self-auto">
          <button
            v-for="(spec, key) in INSTRUMENTS" :key="key"
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 sm:px-3.5 py-1.5 text-xs font-semibold transition-all outline-none"
            :class="instrument === key
              ? 'bg-accent text-on-accent shadow-xs font-bold'
              : 'text-muted hover:text-ink hover:bg-surface'"
            @click="instrument = key"
          >
            <GuitarIcon v-if="key === 'guitar'" size="1.25em" />
            <BassIcon v-else-if="key === 'bass'" size="1.25em" />
            <UkuleleIcon v-else-if="key === 'ukulele'" size="1.25em" />
            <span>{{ $t(spec.labelKey) }}</span>
          </button>
        </div>
      </div>

      <p class="mt-2 text-xs sm:text-sm text-muted">
        Standardno štimovanje:
        <span class="font-mono font-bold text-accent tracking-wide">{{ INSTRUMENTS[instrument].tuning }}</span>
      </p>
    </header>

    <!-- 2-Column Responsive Cockpit Grid: Strings Left, Mic Tuner Right -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <!-- 1. LEFT COLUMN: Interactive Guitar Neck, Strings & Reference Tones (6 cols) -->
      <section class="lg:col-span-6 flex flex-col justify-between rounded-3xl border border-line bg-panel/85 p-5 sm:p-6 backdrop-blur-md shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 class="text-base font-bold text-ink flex items-center gap-2">
              <Icon name="material-symbols:graphic-eq-rounded" class="text-accent text-lg" />
              Interaktivne žice i tonovi
            </h2>
            <p class="text-xs text-muted mt-0.5">
              Klikni na žicu za ton i provjeri štimovanje na uho.
            </p>
          </div>

          <!-- Auto-strum button -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent hover:text-on-accent transition-all shadow-2xs"
            :disabled="isStrumming"
            @click="strumAll"
          >
            <Icon name="material-symbols:play-arrow-rounded" class="text-base" />
            <span>{{ isStrumming ? 'Sviram...' : 'Odsviraj sve (Strum)' }}</span>
          </button>
        </div>

        <!-- Fretboard & Vertical Test Chords Container -->
        <div class="flex gap-2.5 sm:gap-3.5 flex-1 items-stretch">
          <!-- Fretboard & Strings Visual Container (flex-1) -->
          <div class="relative flex-1 rounded-2xl border border-line bg-gradient-to-r from-panel via-surface to-panel p-4 sm:p-5 overflow-hidden shadow-inner flex flex-col justify-center">
            <!-- Nut (kobilica na lijevoj strani) -->
            <div class="absolute left-16 sm:left-18 top-0 bottom-0 w-2.5 bg-gradient-to-r from-amber-100/30 to-amber-200/10 border-r border-line-strong z-10"></div>

            <!-- Fret lines -->
            <div class="absolute inset-0 pointer-events-none flex justify-between ml-18 mr-4 opacity-25">
              <div class="w-px h-full bg-line-strong"></div>
              <div class="w-px h-full bg-line-strong"></div>
              <div class="w-px h-full bg-line-strong"></div>
              <div class="w-px h-full bg-line-strong"></div>
            </div>

            <!-- List of interactive strings -->
            <div class="relative z-20 space-y-3 sm:space-y-3.5">
              <div
                v-for="(string, i) in strings"
                :key="i"
                class="group flex items-center gap-2.5 sm:gap-3.5 cursor-pointer"
                @click="hear(string, i)"
              >
                <!-- String Tuning Peg Badge -->
                <button
                  type="button"
                  class="relative flex size-9 sm:size-10 shrink-0 flex-col items-center justify-center rounded-xl border font-mono transition-colors duration-150 shadow-2xs"
                  :class="[
                    (nearestString && nearestString.frequency === string.frequency && listening) || vibratingIndex === i || sounded === string.frequency
                      ? (inTune ? 'border-ok bg-ok text-on-accent shadow-md' : 'border-accent bg-accent text-on-accent shadow-md')
                      : 'border-line bg-surface text-ink hover:border-accent hover:text-accent hover:bg-raised'
                  ]"
                  :title="$t('tuner.hear', { note: string.label })"
                >
                  <span class="text-sm font-extrabold leading-none">{{ string.label }}</span>
                  <span class="text-[8.5px] opacity-75 leading-none mt-0.5">{{ string.octave ? `${string.octave}` : '' }}</span>
                </button>

                <!-- Physical String Bar (Visual Guitar String) -->
                <div class="relative flex-1 py-2.5 group-hover:opacity-100 transition-opacity">
                  <!-- String Wire with realistic thickness & vibration -->
                  <div
                    class="w-full rounded-full transition-colors duration-150 relative"
                    :class="[
                      (nearestString && nearestString.frequency === string.frequency && listening) || vibratingIndex === i || sounded === string.frequency
                        ? (inTune ? 'bg-ok shadow-lg shadow-ok/50 string-vibrating' : 'bg-accent shadow-lg shadow-accent/50 string-vibrating')
                        : 'bg-muted/40 group-hover:bg-accent/70'
                    ]"
                    :style="{
                      height: `${getGauge(i)}px`
                    }"
                  />

                  <!-- Ambient Glow line on hover/active -->
                  <div
                    v-if="vibratingIndex === i || sounded === string.frequency"
                    class="absolute inset-0 -top-1 -bottom-1 bg-accent/20 blur-sm rounded-full pointer-events-none"
                  />
                </div>

                <!-- Frequency & Sound Icon Badge -->
                <div class="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                  <span
                    class="hidden sm:inline-block rounded-md border border-line-soft bg-surface/60 px-1.5 py-0.5 text-[10.5px] text-faint"
                  >
                    {{ string.frequency }} Hz
                  </span>

                  <!-- Sound icon button -->
                  <span
                    class="flex size-6.5 items-center justify-center rounded-lg border border-line-soft text-faint group-hover:border-accent group-hover:text-accent group-hover:bg-surface transition-colors"
                  >
                    <Icon
                      :name="vibratingIndex === i || sounded === string.frequency ? 'material-symbols:volume-up-rounded' : 'material-symbols:volume-up-outline-rounded'"
                      class="text-xs"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Vertical Test Chords Sidebar Strip -->
          <div class="flex flex-col items-center justify-between rounded-2xl border border-line/80 bg-surface/85 p-2 backdrop-blur-md shadow-inner w-15 sm:w-18 shrink-0">
            <div class="text-[9px] font-bold uppercase tracking-wider text-faint text-center">
              Akordi
            </div>

            <div class="flex flex-col gap-1.5 w-full my-auto">
              <button
                v-for="ch in testChords"
                :key="ch"
                type="button"
                class="group relative flex flex-col items-center justify-center rounded-xl border py-1.5 px-1 font-mono transition-colors shadow-2xs outline-none"
                :class="activeTestChord === ch
                  ? 'border-accent bg-accent text-on-accent shadow-md'
                  : 'border-line/70 bg-panel text-ink hover:border-accent hover:text-accent hover:bg-raised'"
                :title="`Odsviraj ${ch}`"
                @click="testChord(ch)"
              >
                <span class="text-xs sm:text-sm font-extrabold leading-none">{{ ch }}</span>
                <span class="text-[8px] leading-none mt-0.5" :class="activeTestChord === ch ? 'text-on-accent/80' : 'text-faint group-hover:text-accent/80'">test</span>
              </button>
            </div>

            <div class="text-[8.5px] font-semibold text-accent/80 text-center">
              ♫ Strum
            </div>
          </div>
        </div>
      </section>

      <!-- 2. RIGHT COLUMN: Digital Tuner Cockpit (Pitch Detector via Mic) (6 cols) -->
      <div class="lg:col-span-6 relative overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-panel/95 via-panel/85 to-panel/95 p-5 sm:p-6 backdrop-blur-md shadow-sm text-center flex flex-col justify-between">
        <!-- Watermark musical arc icon -->
        <Icon
          name="material-symbols:tune-rounded"
          aria-hidden="true"
          class="pointer-events-none absolute -bottom-8 -right-8 select-none text-[130px] text-ink/5"
        />

        <!-- Inactive state (Mic Off) with Glowing Neon Fender Acoustic Guitar Background -->
        <div v-if="!listening" class="relative z-10 flex flex-col items-center justify-center flex-1 py-8 overflow-hidden">
          <!-- Background Large Diagonal Fender Acoustic Guitar SVG Graphic (Full-Bleed to Card Borders) -->
          <div class="pointer-events-none absolute -inset-6 sm:-inset-8 z-0 flex items-center justify-center overflow-hidden opacity-35 sm:opacity-45 select-none">
            <svg
              viewBox="0 0 500 500"
              class="w-full h-full text-accent pointer-events-none"
              aria-hidden="true"
            >
              <defs>
                <filter id="neon-fender-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur1" />
                  <feGaussianBlur stdDeviation="10" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="neon-ambient-acoustic" cx="50%" cy="55%" r="55%">
                  <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
                </radialGradient>
              </defs>

              <!-- Radial Ambient Neon Glow Halo -->
              <circle cx="250" cy="300" r="220" fill="url(#neon-ambient-acoustic)" />

              <!-- Full-Bleed Diagonal Fender Cutaway Acoustic Guitar Assembly -->
              <g
                transform="rotate(-28 250 340) scale(1.65)"
                filter="url(#neon-fender-glow)"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <!-- Fender Acoustic Body Contour with Smooth Venetian Cutaway -->
                <path
                  d="M 220,135
                     C 160,140 105,185 105,250
                     C 105,295 135,325 155,345
                     C 100,390 90,465 140,520
                     C 185,570 315,570 360,520
                     C 410,465 400,390 345,345
                     C 365,325 395,295 395,250
                     C 395,200 360,175 330,175
                     C 300,175 275,200 275,240
                     C 275,260 265,270 250,265
                     L 250,135 Z"
                  stroke-width="2.4"
                />

                <!-- Soundhole & Rosette Rings -->
                <circle cx="235" cy="290" r="38" stroke-width="2.2" />
                <circle cx="235" cy="290" r="46" stroke-width="1.2" stroke-dasharray="4 5" opacity="0.8" />
                <circle cx="235" cy="290" r="54" stroke-width="0.8" stroke-dasharray="2 6" opacity="0.5" />

                <!-- Fender Teardrop Acoustic Pickguard -->
                <path
                  d="M235 328 C262 328 286 310 286 285 C286 262 272 252 252 255 C280 282 292 335 252 368 C238 378 224 358 235 328 Z"
                  stroke-width="1.8"
                  opacity="0.85"
                />

                <!-- Acoustic Belly Bridge & Pins -->
                <path
                  d="M195 410 C220 405 250 405 275 410 C285 415 280 430 270 430 L200 430 C190 430 185 415 195 410 Z"
                  stroke-width="2"
                />
                <line x1="205" y1="417" x2="265" y2="417" stroke-width="2.5" />
                <!-- 6 Bridge pins -->
                <circle cx="208" cy="425" r="1.5" fill="currentColor" />
                <circle cx="219" cy="425" r="1.5" fill="currentColor" />
                <circle cx="230" cy="425" r="1.5" fill="currentColor" />
                <circle cx="241" cy="425" r="1.5" fill="currentColor" />
                <circle cx="252" cy="425" r="1.5" fill="currentColor" />
                <circle cx="263" cy="425" r="1.5" fill="currentColor" />

                <!-- Neck & Frets -->
                <line x1="220" y1="-60" x2="220" y2="135" stroke-width="2.2" />
                <line x1="250" y1="-60" x2="250" y2="135" stroke-width="2.2" />
                <!-- Fret rungs -->
                <line x1="220" y1="-35" x2="250" y2="-35" stroke-width="1" opacity="0.6" />
                <line x1="220" y1="-5" x2="250" y2="-5" stroke-width="1" opacity="0.6" />
                <line x1="220" y1="25" x2="250" y2="25" stroke-width="1" opacity="0.6" />
                <line x1="220" y1="55" x2="250" y2="55" stroke-width="1" opacity="0.6" />
                <line x1="220" y1="85" x2="250" y2="85" stroke-width="1" opacity="0.6" />
                <line x1="220" y1="115" x2="250" y2="115" stroke-width="1" opacity="0.6" />
                <line x1="220" y1="145" x2="250" y2="145" stroke-width="1" opacity="0.6" />
                <line x1="220" y1="175" x2="250" y2="175" stroke-width="1" opacity="0.6" />
                <line x1="220" y1="205" x2="250" y2="205" stroke-width="1" opacity="0.6" />

                <!-- Position inlays -->
                <circle cx="235" cy="10" r="2" fill="currentColor" opacity="0.7" />
                <circle cx="235" cy="70" r="2" fill="currentColor" opacity="0.7" />
                <circle cx="231" cy="130" r="1.5" fill="currentColor" opacity="0.7" />
                <circle cx="239" cy="130" r="1.5" fill="currentColor" opacity="0.7" />

                <!-- Fender 6-In-Line Characteristic Headstock -->
                <path
                  d="M220 -60 L212 -145 C220 -175 255 -175 262 -155 C268 -135 250 -105 250 -60 Z"
                  stroke-width="2.2"
                />
                <!-- 6 In-Line Tuning Pegs on the Fender Headstock Curve -->
                <circle cx="202" cy="-150" r="3.5" stroke-width="1.5" />
                <circle cx="204" cy="-130" r="3.5" stroke-width="1.5" />
                <circle cx="207" cy="-110" r="3.5" stroke-width="1.5" />
                <circle cx="211" cy="-90" r="3.5" stroke-width="1.5" />
                <circle cx="216" cy="-70" r="3.5" stroke-width="1.5" />
                <circle cx="222" cy="-50" r="3.5" stroke-width="1.5" />

                <!-- 6 Steel Acoustic Strings running down the neck to bridge -->
                <line x1="223" y1="-145" x2="208" y2="425" stroke-width="1.4" opacity="0.9" />
                <line x1="227" y1="-125" x2="219" y2="425" stroke-width="1.2" opacity="0.9" />
                <line x1="231" y1="-105" x2="230" y2="425" stroke-width="1.1" opacity="0.9" />
                <line x1="235" y1="-85" x2="241" y2="425" stroke-width="1.0" opacity="0.9" />
                <line x1="239" y1="-65" x2="252" y2="425" stroke-width="0.9" opacity="0.9" />
                <line x1="243" y1="-45" x2="263" y2="425" stroke-width="0.8" opacity="0.9" />
              </g>
            </svg>
          </div>

          <!-- Foreground Interactive Card Content -->
          <div class="relative z-10 flex flex-col items-center">
            <div class="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl border border-line bg-surface/90 shadow-md backdrop-blur-md">
              <Icon name="material-symbols:mic-rounded" class="text-2xl text-accent" />
            </div>

            <h2 class="text-base sm:text-lg font-bold text-ink drop-shadow-xs">Štimanje putem mikrofona</h2>
            <p class="mx-auto mt-1 max-w-xs text-xs text-muted leading-relaxed">
              Uključi mikrofon za automatsko prepoznavanje žice u realnom vremenu.
            </p>

            <button
              type="button"
              class="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-on-accent shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/35 transition-all duration-200 hover:opacity-95 outline-none"
              @click="start"
            >
              <Icon name="material-symbols:mic-rounded" class="text-base" />
              <span>{{ $t('page.micOn') }}</span>
            </button>

            <p v-if="error" role="alert" class="mt-4 text-xs font-semibold text-danger">{{ error }}</p>
            <p v-else class="mt-4 text-[11px] text-faint">
              {{ $t('page.micPrivacy') }}
            </p>
          </div>
        </div>

        <!-- Active state (Mic Listening) -->
        <div v-else class="relative z-10 flex flex-col justify-between flex-1 py-1">
          <!-- Live Note & In-Tune Feedback -->
          <div class="mb-4 flex flex-col items-center">
            <div class="relative inline-flex items-baseline">
              <span
                class="font-mono text-5xl sm:text-6xl font-black tracking-tight transition-colors duration-150"
                :class="inTune ? 'text-ok' : (reading ? 'text-ink' : 'text-dim')"
              >
                {{ reading ? reading.note : '—' }}
              </span>
              <span
                v-if="reading"
                class="ml-1 font-mono text-xl font-bold text-muted"
              >{{ reading.octave }}</span>
            </div>

            <!-- Dynamic Status / Verdict Pill -->
            <div class="mt-2 min-h-7">
              <span
                v-if="verdict"
                class="inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold transition-all shadow-2xs"
                :class="verdict.bg"
              >
                <Icon v-if="inTune" name="material-symbols:check-circle-rounded" class="text-sm" />
                <Icon v-else name="material-symbols:tune-rounded" class="text-sm" />
                {{ verdict.text }}
              </span>
              <span v-else class="inline-flex items-center gap-1.5 text-xs text-faint font-medium">
                <span class="size-2 rounded-full bg-accent animate-pulse"></span>
                {{ $t('page.playString') }}
              </span>
            </div>
          </div>

          <!-- Precision Needle Meter -->
          <div class="relative mx-auto w-full max-w-sm">
            <!-- Scale Bar & Target Zone -->
            <div class="relative h-10 w-full flex items-center justify-center">
              <!-- Background track -->
              <div class="h-2 w-full rounded-full bg-surface border border-line-soft overflow-hidden relative">
                <!-- Center in-tune tolerance band -->
                <div class="absolute left-1/2 top-0 h-full w-[12%] -translate-x-1/2 bg-ok/25"></div>
              </div>

              <!-- Center 0-mark guide notch -->
              <div class="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-ok"></div>

              <!-- Animated Needle Indicator -->
              <div
                v-if="reading"
                class="absolute top-1/2 h-7 w-1.5 -translate-y-1/2 -translate-x-1/2 rounded-full shadow-md transition-all duration-100 ease-out"
                :class="inTune ? 'bg-ok ring-4 ring-ok/30' : 'bg-accent ring-4 ring-accent/30'"
                :style="{ left: needle + '%' }"
              />
            </div>

            <!-- Cents Scale Numbers -->
            <div class="mt-1 flex justify-between font-mono text-[9.5px] text-faint px-1">
              <span>−50 ct</span>
              <span>−25</span>
              <span class="font-bold text-ok">0 (Ugađanje)</span>
              <span>+25</span>
              <span>+50 ct</span>
            </div>

            <!-- Exact Frequency & Cents offset -->
            <div class="mt-2.5 font-mono text-xs text-muted">
              <template v-if="reading">
                <span class="font-bold text-ink">{{ reading.frequency.toFixed(1) }} Hz</span>
                <span class="text-dim mx-1.5">·</span>
                <span :class="inTune ? 'text-ok font-bold' : 'text-warn font-semibold'">
                  {{ reading.cents > 0 ? '+' : '' }}{{ reading.cents }} centi
                </span>
              </template>
              <template v-else>
                <span class="text-faint">Čekam zvuk žice...</span>
              </template>
            </div>
          </div>

          <!-- Controls: Noise focus checkbox & Stop button -->
          <div class="mt-4 flex items-center justify-between gap-3 border-t border-line-soft pt-3">
            <label class="group inline-flex cursor-pointer items-center gap-2 text-left select-none outline-none">
              <input
                v-model="focus"
                type="checkbox"
                class="sr-only"
              >
              <span
                class="flex size-4.5 shrink-0 items-center justify-center rounded-lg border transition-all duration-150"
                :class="focus
                  ? 'border-accent bg-accent text-on-accent shadow-xs shadow-accent/25'
                  : 'border-line-strong bg-surface hover:border-accent/60 group-hover:bg-raised text-transparent'"
              >
                <Icon name="material-symbols:check-small-rounded" class="text-base" />
              </span>
              <span class="text-xs text-muted leading-none">
                <span class="font-medium text-ink group-hover:text-accent transition-colors">{{ $t('tuner.focus') }}</span>
              </span>
            </label>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface hover:bg-raised px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors shadow-2xs"
              @click="stop"
            >
              <Icon name="material-symbols:mic-off-rounded" class="text-sm text-dim" />
              {{ $t('page.stop') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Landing Popup Tip -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-6 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-6 scale-95"
      >
        <div
          v-if="showTip"
          class="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[calc(100%-2.5rem)] rounded-2xl border border-line bg-panel/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/5"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-start gap-3.5">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent shadow-xs">
              <Icon name="material-symbols:headphones-rounded" class="text-lg" />
            </div>

            <div class="flex-1 min-w-0 pr-5">
              <div class="flex items-center gap-1.5">
                <h3 class="text-xs font-bold text-ink uppercase tracking-wider">Savjet za štimovanje</h3>
                <span class="inline-block size-1.5 rounded-full bg-accent animate-pulse" />
              </div>
              <p class="mt-1 text-xs text-muted leading-relaxed">
                Štimer radi najbolje u tihoj prostoriji. Ako očitanje skače, odsviraj žicu i pusti je da odzvoni prije nego pogledaš iglu.
              </p>
            </div>

            <button
              type="button"
              class="absolute top-3 right-3 flex size-6 items-center justify-center rounded-lg text-faint hover:bg-surface hover:text-ink transition-colors outline-none"
              title="Zatvori"
              @click="dismissTip"
            >
              <Icon name="material-symbols:close-rounded" class="text-base" />
              <span class="sr-only">Zatvori</span>
            </button>
          </div>

          <div class="mt-3 flex justify-end">
            <button
              type="button"
              class="rounded-lg bg-surface hover:bg-raised border border-line px-3 py-1 text-[11px] font-bold text-ink hover:text-accent transition-colors shadow-2xs outline-none"
              @click="dismissTip"
            >
              U redu, shvatam
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes stringVibrate {
  0% { transform: translateY(0); }
  20% { transform: translateY(-2px); }
  40% { transform: translateY(2px); }
  60% { transform: translateY(-1.5px); }
  80% { transform: translateY(1.5px); }
  100% { transform: translateY(0); }
}

.string-vibrating {
  animation: stringVibrate 0.12s ease-in-out infinite;
}
</style>
