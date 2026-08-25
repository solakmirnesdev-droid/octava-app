<script setup>
const { listening, error, reading, nearestString, inTune, start, stop, STRINGS } = useTuner();

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
  if (inTune.value) return { text: 'naštimano', tone: 'text-green-600' };
  return reading.value.cents < 0
    ? { text: 'nisko — zategni', tone: 'text-amber-600' }
    : { text: 'visoko — popusti', tone: 'text-amber-600' };
});

useSeoMeta({
  title: 'Štimer za gitaru | Octava',
  description: 'Naštimaj gitaru preko mikrofona. Standardno štimovanje E A D G H E, prikaz odstupanja u centima.',
  ogTitle: 'Štimer za gitaru'
});

// Canonical and hreflang come from useLocaleHead in app.vue. A hard-coded
// canonical here pointed every English page at its Bosnian counterpart,
// which tells a search engine to index that one instead.
</script>

<template>
  <div class="mx-auto max-w-xl">
    <header class="mb-8">
      <h1 class="text-2xl font-semibold tracking-tight">Štimer</h1>
      <p class="mt-2 text-black/60">
        Standardno štimovanje — <span class="font-mono">E A D G H E</span>.
        Odsviraj jednu žicu i pusti je da zvoni.
      </p>
    </header>

    <div class="rounded-lg border border-black/10 bg-white p-6">
      <div v-if="!listening" class="py-8 text-center">
        <button
          class="rounded bg-ink px-6 py-3 font-medium text-white hover:bg-accent"
          @click="start"
        >
          Uključi mikrofon
        </button>
        <p v-if="error" role="alert" class="mt-4 text-sm text-accent">{{ error }}</p>
        <p v-else class="mt-4 text-xs text-black/40">
          Zvuk se obrađuje u pregledniku i nigdje se ne šalje.
        </p>
      </div>

      <div v-else>
        <div class="mb-2 text-center">
          <p class="font-mono text-5xl font-semibold leading-none" :class="inTune ? 'text-green-600' : 'text-ink'">
            {{ reading ? reading.note : '—' }}<span
              v-if="reading" class="align-super text-xl text-black/30"
            >{{ reading.octave }}</span>
          </p>
          <p v-if="verdict" class="mt-2 text-sm font-medium" :class="verdict.tone">{{ verdict.text }}</p>
          <p v-else class="mt-2 text-sm text-black/35">odsviraj žicu…</p>
        </div>

        <!-- Cent scale. Centre is in tune; the shaded band is the tolerance. -->
        <div class="relative mt-6 h-16">
          <div class="absolute inset-x-0 top-7 h-px bg-black/10" />
          <div class="absolute left-1/2 top-4 h-8 w-[10%] -translate-x-1/2 rounded bg-green-600/10" />
          <div class="absolute left-1/2 top-3 h-10 w-px -translate-x-1/2 bg-black/25" />

          <div
            v-if="reading"
            class="absolute top-2 h-12 w-1 -translate-x-1/2 rounded-full transition-all duration-150"
            :class="inTune ? 'bg-green-600' : 'bg-accent'"
            :style="{ left: needle + '%' }"
          />

          <span class="absolute left-0 top-12 font-mono text-[10px] text-black/30">−50</span>
          <span class="absolute left-1/2 top-12 -translate-x-1/2 font-mono text-[10px] text-black/30">0</span>
          <span class="absolute right-0 top-12 font-mono text-[10px] text-black/30">+50</span>
        </div>

        <p class="mt-2 text-center font-mono text-xs text-black/40">
          <template v-if="reading">
            {{ reading.cents > 0 ? '+' : '' }}{{ reading.cents }} centi ·
            {{ reading.frequency.toFixed(1) }} Hz
          </template>
          <template v-else>&nbsp;</template>
        </p>

        <button
          class="mt-6 w-full rounded border border-black/15 py-2 text-sm hover:border-accent"
          @click="stop"
        >
          Zaustavi
        </button>
      </div>
    </div>

    <!-- Which open string the reading is nearest, so a badly out-of-tune
         string still tells you which one you are holding. -->
    <div class="mt-6 flex justify-between gap-2">
      <div
        v-for="(string, i) in STRINGS" :key="i"
        class="flex-1 rounded border py-2 text-center transition"
        :class="nearestString && nearestString.frequency === string.frequency
          ? (inTune ? 'border-green-600 bg-green-600/10' : 'border-accent bg-accent/10')
          : 'border-black/10'"
      >
        <span class="block font-mono text-sm font-semibold">{{ string.label }}</span>
        <span class="block text-[10px] text-black/35">{{ string.frequency }}</span>
      </div>
    </div>

    <p class="mt-6 text-xs text-black/40">
      Radi najbolje u tihoj prostoriji. Ako očitanje skače, odsviraj žicu jače
      i pusti je da odzvoni prije nego pogledaš.
    </p>
  </div>
</template>
