<script setup>
import { findFingering } from '~/utils/fingerings';

const props = defineProps({ symbol: { type: String, required: true } });

const shape = computed(() => findFingering(props.symbol));

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
    .map((fret, i) => ({ fret, i }))
    .filter(({ fret }) => fret !== null && fret > 0)
    // A barre is drawn as a bar, so its strings are not also drawn as dots.
    .filter(({ fret, i }) => {
      const barre = shape.value.barre;
      return !(barre && fret === barre.fret && i >= barre.from && i <= barre.to);
    })
);

/** The "x32010" line printed under the diagram. */
const tab = computed(() =>
  shape.value.frets.map((f) => (f === null ? 'x' : f)).join('')
);
</script>

<template>
  <div v-if="shape" class="w-[132px] select-none text-center">
    <p class="font-mono text-sm font-semibold text-ink">
      {{ shape.name }}<span v-if="shape.qualityKey" class="ml-1 font-sans text-xs font-normal text-black/45">{{ $t(`chord.${shape.qualityKey}`) }}</span>
    </p>
    <p v-if="shape.formula" class="mb-1 font-mono text-[10px] text-black/35">{{ shape.formula }}</p>

    <svg :width="132" :height="TOP + FRETS * STEP_Y + 14" class="mx-auto overflow-visible">
      <!-- Open and muted markers sit above the nut. -->
      <template v-for="(fret, i) in shape.frets" :key="'m' + i">
        <text
          :x="x(i)" :y="TOP - 6" text-anchor="middle"
          class="fill-black/45 font-mono" style="font-size: 10px"
        >{{ fret === null ? '×' : (fret === 0 ? '○' : '') }}</text>
      </template>

      <!-- Nut is heavy only when the shape starts at the top of the neck. -->
      <line
        :x1="x(0)" :y1="TOP" :x2="x(STRINGS - 1)" :y2="TOP"
        stroke="currentColor" :stroke-width="shape.baseFret === 1 ? 3 : 1" class="text-black/70"
      />

      <line
        v-for="f in FRETS" :key="'f' + f"
        :x1="x(0)" :y1="TOP + f * STEP_Y" :x2="x(STRINGS - 1)" :y2="TOP + f * STEP_Y"
        stroke="currentColor" stroke-width="1" class="text-black/20"
      />

      <line
        v-for="s in STRINGS" :key="'s' + s"
        :x1="x(s - 1)" :y1="TOP" :x2="x(s - 1)" :y2="TOP + FRETS * STEP_Y"
        stroke="currentColor" stroke-width="1" class="text-black/25"
      />

      <!-- Position marker for shapes that start further down the neck. -->
      <text
        v-if="shape.baseFret > 1"
        :x="x(0) - 8" :y="y(1) + 4" text-anchor="end"
        class="fill-black/50 font-mono" style="font-size: 10px"
      >{{ shape.baseFret }}</text>

      <rect
        v-if="shape.barre"
        :x="x(shape.barre.from) - 5"
        :y="y(relative(shape.barre.fret)) - 5"
        :width="(shape.barre.to - shape.barre.from) * STEP_X + 10"
        height="10" rx="5"
        class="fill-accent"
      />

      <circle
        v-for="d in dots" :key="'d' + d.i"
        :cx="x(d.i)" :cy="y(relative(d.fret))" r="5"
        class="fill-accent"
      />
    </svg>

    <p class="font-mono text-[11px] tracking-wider text-black/40">{{ tab }}</p>
    <p v-if="shape.approximate" class="mt-0.5 text-[10px] leading-tight text-black/35">
      osnovni oblik za {{ symbol }}
    </p>
  </div>
</template>
