<script setup>
import { findFingering, fingerNumbers, CHORD_INSTRUMENTS } from '~/utils/chordEngine';
import { strum, canPlay } from '~/utils/chordAudio';

const props = defineProps({
  symbol: { type: String, required: true },
  // Tight spots — the hover tooltip — can drop the position switcher.
  switchable: { type: Boolean, default: true },
  /** 'guitar', 'bass' or 'ukulele'. Decides the tuning, and with it the shape. */
  instrument: { type: String, default: 'guitar' }
});

const variant = ref(0);

/**
 * Hearing the shape is half of learning it.
 *
 * AI-NOTE: the audio context is built inside this handler rather than at setup,
 * because browsers refuse to start audio outside a user gesture — one created on
 * page load arrives suspended and the first click is silent.
 */
// Resolved on the client only: window does not exist while this renders on the
// server, and guessing wrong would either hide the control from everyone or
// offer a button that does nothing.
const audible = ref(false);
onMounted(() => { audible.value = canPlay(); });

const ringing = ref(false);
let timer = null;

function play() {
  // The tuning goes with the shape: the same fret numbers on a ukulele are a
  // different chord, and playing them against guitar strings would teach the ear
  // something the diagram does not say.
  const tuning = (CHORD_INSTRUMENTS[props.instrument] || CHORD_INSTRUMENTS.guitar).tuning;
  if (!strum(shape.value.frets, { tuning })) return;
  ringing.value = true;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { ringing.value = false; }, 700);
}

onBeforeUnmount(() => window.clearTimeout(timer));

// A different chord under the same component is a different set of positions,
// so the switcher has to start over rather than keep an index into the old one.
watch(() => [props.symbol, props.instrument], () => { variant.value = 0; });

const shape = computed(() => findFingering(props.symbol, variant.value, props.instrument));
const fingers = computed(() => (shape.value ? fingerNumbers(shape.value) : []));

// Geometry of the drawn grid, in SVG units.
/**
 * Taken from the shape rather than fixed at six.
 *
 * A bass and a ukulele both have four, and a diagram that always draws six
 * would render their shapes against two strings that are not there — with the
 * dots landing on the wrong lines rather than obviously breaking.
 */
const STRINGS = computed(() => props.shape?.frets?.length || 6);
const FRETS = 5;
const LEFT = 16;
const TOP = 24;
const STEP_X = 18;
const STEP_Y = 20;

const x = (stringIndex) => LEFT + stringIndex * STEP_X;
const y = (fret) => TOP + (fret - 0.5) * STEP_Y;

/** Fret numbers are relative to baseFret once the shape sits up the neck. */
const relative = (fret) => fret - (shape.value.baseFret - 1);

const dots = computed(() =>
  shape.value.frets
    .map((fret, i) => ({ fret, i, finger: fingers.value[i] }))
    .filter(({ fret }) => fret !== null && fret > 0)
    // A barre is drawn as a bar, so its strings are not also drawn as dots.
    .filter(({ fret, i }) => {
      const barre = shape.value.barre;
      return !(barre && fret === barre.fret && i >= barre.from && i <= barre.to);
    })
);

/**
 * The "x32010" line printed under the diagram.
 *
 * AI-TRAP: only single digits may be run together. Shapes up the neck reach
 * fret 10 and above, where "x10 9 10 8" run together reads as nonsense.
 */
const tab = computed(() => {
  const parts = shape.value.frets.map((f) => (f === null ? 'x' : String(f)));
  return parts.some((p) => p.length > 1) ? parts.join(' ') : parts.join('');
});

const step = (by) => {
  variant.value = (variant.value + by + shape.value.variants) % shape.value.variants;
};
</script>

<template>
  <div
    v-if="shape"
    class="relative w-full max-w-[155px] select-none text-center flex flex-col items-center cursor-pointer"
    :title="audible ? $t('chord.hear', { name: shape.name }) : ''"
    @click="play"
  >
    <!-- Top-Right Audio Icon Badge -->
    <span
      v-if="audible"
      class="absolute -top-1 -right-1 sm:top-0 sm:right-0 flex size-7 items-center justify-center rounded-lg border border-transparent transition-colors z-20"
      :class="ringing ? 'border-accent/40 bg-accent-soft text-accent shadow-xs' : 'text-faint hover:text-accent group-hover:text-accent'"
      aria-hidden="true"
    >
      <Icon
        :name="ringing ? 'material-symbols:volume-up-rounded' : 'material-symbols:volume-up-outline-rounded'"
        class="text-base"
      />
    </span>

    <!-- Chord Name & Quality -->
    <div class="mb-1 w-full px-5">
      <div class="flex items-baseline justify-center gap-1.5">
        <span class="font-mono text-base sm:text-lg font-extrabold text-ink tracking-tight">{{ shape.name }}</span>
        <span v-if="shape.qualityKey" class="text-xs font-semibold text-accent truncate">{{ $t(`chord.${shape.qualityKey}`) }}</span>
      </div>
      <p v-if="shape.formula" class="mt-0.5 inline-block rounded-md border border-line-soft bg-surface/70 px-2 py-0.5 font-mono text-[9.5px] text-faint font-medium">
        {{ shape.formula }}
      </p>
    </div>

    <!-- The diagram SVG (Larger Fretboard Grip) -->
    <div class="relative mx-auto my-1 block rounded-xl p-1">
      <svg :width="132" :height="TOP + FRETS * STEP_Y + 12" class="overflow-visible">
        <!-- Open and muted markers sit above the nut. -->
        <template v-for="(fret, i) in shape.frets" :key="'m' + i">
          <text
            :x="x(i)" :y="TOP - 7" text-anchor="middle"
            class="fill-faint font-mono font-bold" style="font-size: 11px"
          >{{ fret === null ? '×' : (fret === 0 ? '○' : '') }}</text>
        </template>

        <!-- Nut is heavy only when the shape starts at the top of the neck. -->
        <line
          :x1="x(0)" :y1="TOP" :x2="x(STRINGS - 1)" :y2="TOP"
          stroke="currentColor" :stroke-width="shape.baseFret === 1 ? 3.5 : 1.5" class="text-body"
        />

        <line
          v-for="f in FRETS" :key="'f' + f"
          :x1="x(0)" :y1="TOP + f * STEP_Y" :x2="x(STRINGS - 1)" :y2="TOP + f * STEP_Y"
          stroke="currentColor" stroke-width="1.2" class="text-dim"
        />

        <line
          v-for="s in STRINGS" :key="'s' + s"
          :x1="x(s - 1)" :y1="TOP" :x2="x(s - 1)" :y2="TOP + FRETS * STEP_Y"
          stroke="currentColor" stroke-width="1.2" class="text-dim"
        />

        <!-- Position marker for shapes that start further down the neck. -->
        <text
          v-if="shape.baseFret > 1"
          :x="x(0) - 7" :y="y(1) + 4" text-anchor="end"
          class="fill-muted font-mono font-bold" style="font-size: 11px"
        >{{ shape.baseFret }}</text>

        <rect
          v-if="shape.barre"
          :x="x(shape.barre.from) - 6"
          :y="y(relative(shape.barre.fret)) - 6"
          :width="(shape.barre.to - shape.barre.from) * STEP_X + 12"
          height="12" rx="6"
          class="fill-accent shadow-xs"
        />
        <text
          v-if="shape.barre"
          :x="x(shape.barre.from)" :y="y(relative(shape.barre.fret)) + 3.5"
          text-anchor="middle" class="fill-on-accent font-mono font-bold" style="font-size: 9px"
        >1</text>

        <template v-for="d in dots" :key="'d' + d.i">
          <circle :cx="x(d.i)" :cy="y(relative(d.fret))" r="5.8" class="fill-accent shadow-xs" />
          <text
            v-if="d.finger"
            :x="x(d.i)" :y="y(relative(d.fret)) + 3.5" text-anchor="middle"
            class="fill-on-accent font-mono font-bold" style="font-size: 9px"
          >{{ d.finger }}</text>
        </template>
      </svg>
    </div>

    <p class="font-mono text-xs font-bold tracking-widest text-muted/90">{{ tab }}</p>

    <!-- Position Switcher (< 1/8 > Wider & Clear Buttons) -->
    <div
      v-if="switchable && shape.variants > 1"
      class="mt-2 w-24 sm:w-28 flex items-center justify-between rounded-full border border-line-soft bg-surface/80 px-2 py-0.5 z-10 shadow-2xs hover:border-accent/40 transition-colors"
      @click.stop
    >
      <button
        type="button" :aria-label="$t('chord.prevShape')"
        class="flex size-5 items-center justify-center rounded-full text-xs font-bold text-muted transition-colors hover:bg-panel hover:text-accent active:bg-raised outline-none"
        @click.stop="step(-1)"
      >‹</button>

      <span class="font-mono text-[11px] font-bold tabular-nums text-ink/75 px-1">
        {{ shape.variant + 1 }}/{{ shape.variants }}
      </span>

      <button
        type="button" :aria-label="$t('chord.nextShape')"
        class="flex size-5 items-center justify-center rounded-full text-xs font-bold text-muted transition-colors hover:bg-panel hover:text-accent active:bg-raised outline-none"
        @click.stop="step(1)"
      >›</button>
    </div>
  </div>
</template>
