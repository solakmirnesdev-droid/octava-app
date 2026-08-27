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
  { at: 60, key: 'metronome.largo', label: 'Largo' },
  { at: 76, key: 'metronome.adagio', label: 'Adagio' },
  { at: 108, key: 'metronome.andante', label: 'Andante' },
  { at: 120, key: 'metronome.moderato', label: 'Moderato' },
  { at: 168, key: 'metronome.allegro', label: 'Allegro' },
  { at: 200, key: 'metronome.presto', label: 'Presto' },
  { at: Infinity, key: 'metronome.prestissimo', label: 'Prestissimo' }
];

const marking = computed(() => MARKINGS.find((m) => bpm.value < m.at)?.key || 'metronome.prestissimo');

const PRESETS = [
  { bpm: 60, name: 'Largo' },
  { bpm: 80, name: 'Adagio' },
  { bpm: 100, name: 'Andante' },
  { bpm: 120, name: 'Moderato' },
  { bpm: 144, name: 'Allegro' },
  { bpm: 180, name: 'Presto' }
];

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

const showTip = ref(false);

onMounted(() => {
  window.addEventListener('keydown', onKey);
  if (typeof window !== 'undefined' && !sessionStorage.getItem('octava_metronome_tip_dismissed')) {
    showTip.value = true;
  }
});

function dismissTip() {
  showTip.value = false;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('octava_metronome_tip_dismissed', '1');
  }
}

onBeforeUnmount(() => window.removeEventListener('keydown', onKey));

/**
 * Mechanical metronome pendulum physics:
 * - 1 full swing cycle (left -> right -> left) = 2 beats.
 * - Duration for one full cycle = (60 / BPM) * 2 seconds.
 */
const swingDuration = computed(() => `${(120 / bpm.value).toFixed(4)}s`);

/**
 * Counterweight position on the metal rod:
 * - Slow BPM (40) -> Weight slides up towards top of rod (y = 48px).
 * - Fast BPM (240) -> Weight slides down towards pivot base (y = 190px).
 */
const weightY = computed(() => {
  const ratio = (bpm.value - MIN_BPM) / (MAX_BPM - MIN_BPM);
  return 65 + ratio * 255;
});

useSeoMeta({
  title: t('meta.metronomeTitle'),
  description: t('meta.metronomeDesc'),
  ogTitle: t('page.metronome')
});
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-7">
    <!-- Header -->
    <header class="text-center sm:text-left">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-2.5">
          <span class="flex size-8 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <MetronomeIcon size="1.3em" />
          </span>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-ink">
            {{ $t('page.metronome') }}
          </h1>
        </div>
      </div>
    </header>

    <!-- 2-Column Responsive Studio Cockpit Grid (Left: 7 cols, Right: 5 cols) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <!-- 1. LEFT COLUMN: Modern Grand Mechanical Metronome (7 cols on lg) -->
      <section class="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-line bg-gradient-to-b from-panel/95 via-panel/85 to-surface/95 p-6 sm:p-7 backdrop-blur-md shadow-sm relative overflow-hidden min-h-[500px]">
        <!-- Ambient background lighting -->
        <div class="pointer-events-none absolute -left-12 -bottom-12 size-56 rounded-full bg-accent/5 blur-3xl" />
        <div class="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-accent/5 blur-3xl" />

        <!-- Top Status & Accent Beat Light -->
        <div class="relative z-20 flex items-center justify-between w-full">
          <div class="flex items-center gap-2 rounded-full border border-line-soft bg-surface/80 px-3 py-1 backdrop-blur-xs shadow-2xs">
            <span
              class="size-3 rounded-full transition-colors duration-100"
              :class="running ? (beat === 0 ? 'bg-accent shadow-md shadow-accent/50 animate-pulse' : 'bg-ok') : 'bg-dim'"
            />
            <span class="font-mono text-xs font-bold text-ink tracking-wide">
              {{ running ? `${bpm} BPM` : 'SPREMAN' }}
            </span>
          </div>

          <!-- Discrete Time Signature Badge -->
          <span class="rounded-full border border-line-soft bg-surface/80 px-3 py-1 font-mono text-xs font-bold text-accent shadow-2xs">
            {{ beatsPerBar }}/{{ beatsPerBar === 6 ? '8' : '4' }}
          </span>
        </div>

        <!-- Full-Bleed Grand Mechanical Metronome Chamber -->
        <div class="relative z-10 flex-1 flex items-center justify-center my-3 min-h-[380px] w-full">
          <div class="relative w-full max-w-md h-96 sm:h-[420px] flex items-center justify-center">
            <svg
              viewBox="0 0 400 420"
              class="w-full h-full overflow-visible select-none"
            >
              <!-- Subtle Engraved Scale Ladder (Stationary Background) -->
              <g class="opacity-45">
                <!-- Vertical Guide Center Line -->
                <line x1="200" y1="40" x2="200" y2="360" stroke="currentColor" stroke-width="1" stroke-dasharray="3 4" class="text-line-strong" />

                <!-- 40 LARGO -->
                <line x1="140" y1="65" x2="260" y2="65" stroke="currentColor" stroke-width="1" class="text-line-strong" />
                <text x="80" y="69" class="fill-muted font-mono font-bold" style="font-size: 11px">40 LARGO</text>
                <text x="320" y="69" class="fill-muted font-mono font-bold" style="font-size: 11px">40</text>

                <!-- 60 ADAGIO -->
                <line x1="150" y1="116" x2="250" y2="116" stroke="currentColor" stroke-width="1" class="text-line-strong" />
                <text x="80" y="120" class="fill-muted font-mono font-bold" style="font-size: 11px">60 ADAGIO</text>
                <text x="320" y="120" class="fill-muted font-mono font-bold" style="font-size: 11px">60</text>

                <!-- 80 ANDANTE -->
                <line x1="155" y1="167" x2="245" y2="167" stroke="currentColor" stroke-width="1" class="text-line-strong" />
                <text x="80" y="171" class="fill-muted font-mono font-bold" style="font-size: 11px">80 ANDANTE</text>
                <text x="320" y="171" class="fill-muted font-mono font-bold" style="font-size: 11px">80</text>

                <!-- 120 MODERATO -->
                <line x1="150" y1="218" x2="250" y2="218" stroke="currentColor" stroke-width="1" class="text-line-strong" />
                <text x="80" y="222" class="fill-muted font-mono font-bold" style="font-size: 11px">120 MODERATO</text>
                <text x="320" y="222" class="fill-muted font-mono font-bold" style="font-size: 11px">120</text>

                <!-- 160 ALLEGRO -->
                <line x1="155" y1="269" x2="245" y2="269" stroke="currentColor" stroke-width="1" class="text-line-strong" />
                <text x="80" y="273" class="fill-muted font-mono font-bold" style="font-size: 11px">160 ALLEGRO</text>
                <text x="320" y="273" class="fill-muted font-mono font-bold" style="font-size: 11px">160</text>

                <!-- 200 PRESTO -->
                <line x1="160" y1="320" x2="240" y2="320" stroke="currentColor" stroke-width="1" class="text-line-strong" />
                <text x="80" y="324" class="fill-muted font-mono font-bold" style="font-size: 11px">200 PRESTO</text>
                <text x="320" y="324" class="fill-muted font-mono font-bold" style="font-size: 11px">200</text>
              </g>

              <!-- Pendulum Pivot Group with dynamic CSS animation -->
              <g
                class="pendulum-arm"
                :class="{ 'pendulum-swinging': running }"
                :style="{ '--swing-duration': swingDuration }"
              >
                <!-- The Metallic Rod -->
                <line
                  x1="200" y1="24"
                  x2="200" y2="380"
                  stroke="currentColor"
                  stroke-width="5"
                  class="text-ink drop-shadow-sm"
                  stroke-linecap="round"
                />

                <!-- Upper Tip Pointer with glowing accent dot -->
                <circle cx="200" cy="22" r="7" class="fill-accent shadow-md shadow-accent/40" />

                <!-- Sliding Brass/Metallic Counterweight -->
                <!-- Position changes along Y axis with BPM -->
                <g :transform="`translate(0, ${weightY})`">
                  <!-- Weight Body with bevel & shadow -->
                  <rect
                    x="172" y="-19"
                    width="56" height="38"
                    rx="8"
                    fill="currentColor"
                    class="text-accent shadow-xl"
                  />
                  <!-- Inner reflective stripe & center notch -->
                  <line x1="175" y1="0" x2="225" y2="0" stroke="currentColor" stroke-width="2.5" class="text-on-accent" />
                  <rect x="193" y="-10" width="14" height="20" rx="3" class="fill-on-accent/30" />
                </g>
              </g>

              <!-- Base Pivot Nut / Golden Rivet (Stationary) -->
              <circle cx="200" cy="380" r="18" class="fill-panel stroke-line-strong shadow-md" stroke-width="3.5" />
              <circle cx="200" cy="380" r="7" class="fill-accent shadow-xs" />
            </svg>
          </div>
        </div>

        <!-- Spacebar Hint Footer -->
        <p class="relative z-20 text-center text-xs text-faint">
          {{ $t('metronome.spaceHint') }}
        </p>
      </section>

      <!-- 2. RIGHT COLUMN: Interactive Control Cockpit (5 cols on lg) -->
      <section class="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-line bg-panel/85 p-6 sm:p-7 backdrop-blur-md shadow-sm">
        <!-- Visual Beat Indicator Dots -->
        <div>
          <div class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-4">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-faint">Takt:</span>
              <div class="flex gap-2">
                <button
                  v-for="bar in BARS" :key="bar.beats"
                  type="button"
                  class="rounded-xl border px-3 py-1 font-mono text-xs font-semibold transition-colors shadow-2xs outline-none"
                  :class="beatsPerBar === bar.beats
                    ? 'border-accent bg-accent-soft text-accent shadow-xs'
                    : 'border-line bg-surface text-muted hover:border-accent hover:text-accent hover:bg-raised'"
                  @click="beatsPerBar = bar.beats"
                >
                  {{ bar.label }}
                </button>
              </div>
            </div>

            <!-- One dot per beat with accent pulse on downbeat -->
            <div class="flex items-center gap-2 rounded-xl border border-line bg-surface/80 px-3 py-1.5">
              <span
                v-for="n in beatsPerBar" :key="n"
                class="size-3.5 rounded-full transition-all duration-75"
                :class="beat === n - 1
                  ? (n === 1 ? 'bg-accent ring-4 ring-accent/30 scale-105' : 'bg-ink')
                  : 'bg-sunken'"
                aria-hidden="true"
              />
            </div>
          </div>

          <!-- Big BPM Display & Tempo Term -->
          <div class="text-center my-3">
            <div class="inline-flex items-baseline justify-center">
              <span class="font-mono text-6xl sm:text-7xl font-black tracking-tight text-ink tabular-nums leading-none">
                {{ bpm }}
              </span>
              <span class="font-mono text-lg font-bold text-faint ml-2">BPM</span>
            </div>
            <p class="mt-2 text-sm font-bold text-accent tracking-wide uppercase">
              {{ $t(marking) }}
            </p>
          </div>

          <!-- Smooth Tempo Slider & Step Adjust Buttons -->
          <div class="mt-6 flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              class="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface font-mono text-base font-bold text-ink hover:border-accent hover:text-accent hover:bg-raised transition-colors shadow-2xs outline-none"
              :aria-label="$t('metronome.slower')"
              @click="setBpm(bpm - 5)"
              title="−5 BPM"
            >
              −5
            </button>

            <button
              type="button"
              class="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface font-mono text-base font-bold text-ink hover:border-accent hover:text-accent hover:bg-raised transition-colors shadow-2xs outline-none"
              :aria-label="$t('metronome.slower')"
              @click="setBpm(bpm - 1)"
              title="−1 BPM"
            >
              −1
            </button>

            <input
              :value="bpm"
              type="range"
              :min="MIN_BPM"
              :max="MAX_BPM"
              step="1"
              class="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-sunken accent-accent outline-none"
              :aria-label="$t('metronome.tempo')"
              @input="setBpm($event.target.value)"
            >

            <button
              type="button"
              class="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface font-mono text-base font-bold text-ink hover:border-accent hover:text-accent hover:bg-raised transition-colors shadow-2xs outline-none"
              :aria-label="$t('metronome.faster')"
              @click="setBpm(bpm + 1)"
              title="+1 BPM"
            >
              +1
            </button>

            <button
              type="button"
              class="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface font-mono text-base font-bold text-ink hover:border-accent hover:text-accent hover:bg-raised transition-colors shadow-2xs outline-none"
              :aria-label="$t('metronome.faster')"
              @click="setBpm(bpm + 5)"
              title="+5 BPM"
            >
              +5
            </button>
          </div>

          <!-- Quick Tempo Presets Pills -->
          <div class="mt-5 flex flex-wrap items-center justify-center gap-1.5">
            <button
              v-for="p in PRESETS"
              :key="p.bpm"
              type="button"
              class="rounded-lg border px-2.5 py-1 text-xs font-mono transition-colors shadow-2xs outline-none"
              :class="bpm === p.bpm
                ? 'border-accent bg-accent text-on-accent font-bold'
                : 'border-line-soft bg-surface/70 text-muted hover:border-accent hover:text-accent hover:bg-surface'"
              @click="setBpm(p.bpm)"
            >
              {{ p.bpm }} <span class="opacity-75 text-[10px] font-sans font-normal">{{ p.name }}</span>
            </button>
          </div>
        </div>

        <!-- Primary Action Buttons (Start/Stop + Tap Tempo) -->
        <div class="mt-8 pt-5 border-t border-line-soft flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 px-6 text-sm font-bold transition-all duration-200 outline-none"
            :class="running
              ? 'border border-line-strong bg-surface text-ink hover:border-danger hover:text-danger hover:bg-raised shadow-xs'
              : 'bg-accent text-on-accent shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/35 hover:opacity-95'"
            @click="toggle"
          >
            <Icon
              :name="running ? 'material-symbols:stop-rounded' : 'material-symbols:play-arrow-rounded'"
              class="text-xl"
            />
            <span>{{ running ? $t('metronome.stop') : $t('metronome.start') }}</span>
          </button>

          <button
            type="button"
            class="w-full sm:w-36 inline-flex items-center justify-center gap-1.5 rounded-xl border py-3 px-4 text-xs font-bold transition-colors shadow-2xs outline-none"
            :class="tapped
              ? 'border-accent bg-accent text-on-accent shadow-md'
              : 'border-line-strong bg-surface text-muted hover:border-accent hover:text-accent hover:bg-raised'"
            :title="$t('metronome.tapHint')"
            @click="onTap"
          >
            <Icon name="material-symbols:touch-app-rounded" class="text-base" />
            <span>{{ $t('metronome.tap') }} (Tap)</span>
          </button>
        </div>
      </section>
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
            <div class="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-xs">
              <MetronomeIcon size="1.6em" />
            </div>

            <div class="flex-1 min-w-0 pr-5">
              <div class="flex items-center gap-1.5">
                <h3 class="text-xs font-bold text-ink uppercase tracking-wider">Savjet za vježbanje</h3>
                <span class="inline-block size-1.5 rounded-full bg-accent animate-pulse" />
              </div>
              <p class="mt-1 text-xs text-muted leading-relaxed">
                {{ $t('page.metronomeLead') }} {{ $t('metronome.note') }}
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
/* Pendulum arm rotation around base pivot */
.pendulum-arm {
  transform-origin: 200px 380px;
  transition: transform 0.25s ease-out;
}

@keyframes metronomeSwingKeyframes {
  0% {
    transform: rotate(-28deg);
  }
  50% {
    transform: rotate(28deg);
  }
  100% {
    transform: rotate(-28deg);
  }
}

.pendulum-swinging {
  animation: metronomeSwingKeyframes var(--swing-duration, 1.2s) ease-in-out infinite;
}
</style>
