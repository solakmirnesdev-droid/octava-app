<script setup>
import { findFingering, fingerNumbers } from '~/utils/chordEngine';

const props = defineProps({
  symbol: { type: String, required: true },
  // Tight spots — the hover tooltip — can drop the position switcher.
  switchable: { type: Boolean, default: true }
});

const variant = ref(0);

// A different chord under the same component is a different set of positions,
// so the switcher has to start over rather than keep an index into the old one.
watch(() => props.symbol, () => { variant.value = 0; });

const shape = computed(() => findFingering(props.symbol, variant.value));
const fingers = computed(() => (shape.value ? fingerNumbers(shape.value) : []));

// Geometry of the drawn grid, in SVG units.
const STRINGS = 6;
const FRETS = 5;
const LEFT = 14;
const TOP = 22;
const STEP_X = 16;
const STEP_Y = 18;

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
  <div v-if="shape" class="w-[132px] select-none text-center">
    <p class="font-mono text-sm font-semibold text-ink">
      {{ shape.name }}<span v-if="shape.qualityKey" class="ml-1 font-sans text-xs font-normal text-faint">{{ $t(`chord.${shape.qualityKey}`) }}</span>
    </p>
    <p v-if="shape.formula" class="mb-1 font-mono text-[10px] text-faint">{{ shape.formula }}</p>

    <svg :width="132" :height="TOP + FRETS * STEP_Y + 14" class="mx-auto overflow-visible">
      <!-- Open and muted markers sit above the nut. -->
      <template v-for="(fret, i) in shape.frets" :key="'m' + i">
        <text
          :x="x(i)" :y="TOP - 6" text-anchor="middle"
          class="fill-faint font-mono" style="font-size: 10px"
        >{{ fret === null ? '×' : (fret === 0 ? '○' : '') }}</text>
      </template>

      <!-- Nut is heavy only when the shape starts at the top of the neck. -->
      <line
        :x1="x(0)" :y1="TOP" :x2="x(STRINGS - 1)" :y2="TOP"
        stroke="currentColor" :stroke-width="shape.baseFret === 1 ? 3 : 1" class="text-body"
      />

      <line
        v-for="f in FRETS" :key="'f' + f"
        :x1="x(0)" :y1="TOP + f * STEP_Y" :x2="x(STRINGS - 1)" :y2="TOP + f * STEP_Y"
        stroke="currentColor" stroke-width="1" class="text-dim"
      />

      <line
        v-for="s in STRINGS" :key="'s' + s"
        :x1="x(s - 1)" :y1="TOP" :x2="x(s - 1)" :y2="TOP + FRETS * STEP_Y"
        stroke="currentColor" stroke-width="1" class="text-dim"
      />

      <!-- Position marker for shapes that start further down the neck. -->
      <text
        v-if="shape.baseFret > 1"
        :x="x(0) - 8" :y="y(1) + 4" text-anchor="end"
        class="fill-muted font-mono" style="font-size: 10px"
      >{{ shape.baseFret }}</text>

      <rect
        v-if="shape.barre"
        :x="x(shape.barre.from) - 5"
        :y="y(relative(shape.barre.fret)) - 5"
        :width="(shape.barre.to - shape.barre.from) * STEP_X + 10"
        height="10" rx="5"
        class="fill-accent"
      />
      <text
        v-if="shape.barre"
        :x="x(shape.barre.from)" :y="y(relative(shape.barre.fret)) + 3"
        text-anchor="middle" class="fill-on-accent font-mono font-semibold" style="font-size: 8px"
      >1</text>

      <template v-for="d in dots" :key="'d' + d.i">
        <circle :cx="x(d.i)" :cy="y(relative(d.fret))" r="5" class="fill-accent" />
        <text
          v-if="d.finger"
          :x="x(d.i)" :y="y(relative(d.fret)) + 3" text-anchor="middle"
          class="fill-on-accent font-mono font-semibold" style="font-size: 8px"
        >{{ d.finger }}</text>
      </template>
    </svg>

    <p class="font-mono text-[11px] tracking-wider text-faint">{{ tab }}</p>

    <!-- Only worth showing when there is somewhere else to go. -->
    <div
      v-if="switchable && shape.variants > 1"
      class="mt-1 flex items-center justify-center gap-1"
    >
      <button
        type="button" :aria-label="$t('chord.prevShape')"
        class="flex h-5 w-5 items-center justify-center rounded text-faint transition-colors hover:bg-raised hover:text-ink"
        @click.stop="step(-1)"
      >‹</button>
      <span class="font-mono text-[10px] tabular-nums text-faint">
        {{ shape.variant + 1 }}/{{ shape.variants }}
      </span>
      <button
        type="button" :aria-label="$t('chord.nextShape')"
        class="flex h-5 w-5 items-center justify-center rounded text-faint transition-colors hover:bg-raised hover:text-ink"
        @click.stop="step(1)"
      >›</button>
    </div>
  </div>
</template>
