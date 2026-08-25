<script setup>
import { parseSong, transposeContent, normalizeNotation } from '~/utils/chordpro';

const props = defineProps({
  content: { type: String, default: '' },
  semitones: { type: Number, default: 0 },
  // Passed so transposition can resolve the destination key.
  originalKey: { type: String, default: '' },
  fontSize: { type: Number, default: 15 },
  columns: { type: Boolean, default: false }
});

const lines = computed(() =>
  parseSong(normalizeNotation(transposeContent(props.content, props.semitones, props.originalKey)))
);

// Which chord is showing its diagram. Keyed by position rather than by symbol,
// since the same chord appears many times in a song.
const active = ref(null);
const isActive = (line, seg) => active.value === `${line}:${seg}`;

let closeTimer = null;

function show(line, seg) {
  clearTimeout(closeTimer);
  active.value = `${line}:${seg}`;
}

function hide() {
  // A short grace period keeps the diagram from flickering while the pointer
  // crosses the gap between the chord and the panel.
  closeTimer = setTimeout(() => { active.value = null; }, 120);
}

onBeforeUnmount(() => clearTimeout(closeTimer));
</script>

<template>
  <!-- Chords and lyrics scale together, so column alignment survives any size. -->
  <div
    class="font-mono leading-tight"
    :class="columns ? 'columns-2 gap-10 [column-rule:1px_solid_rgb(0_0_0/0.08)]' : ''"
    :style="{ fontSize: fontSize + 'px' }"
  >
    <template v-for="(line, i) in lines" :key="i">
      <h2
        v-if="line.type === 'section'"
        class="mt-6 mb-2 font-sans text-xs font-semibold tracking-widest uppercase text-accent
               break-after-avoid break-inside-avoid"
      >
        {{ line.label }}
      </h2>

      <!-- Instrumental run: spaced evenly, since there are no words to sit over
           and column positions would collide the chords. -->
      <div v-else-if="line.instrumental" class="flex flex-wrap gap-4 min-h-[1.6em] break-inside-avoid">
        <span
          v-for="(seg, j) in line.segments.filter((s) => s.chord)" :key="j"
          class="relative"
          @mouseenter="show(i, 'i' + j)" @mouseleave="hide"
        >
          <button
            class="font-semibold text-accent underline decoration-dotted decoration-accent/30 underline-offset-4"
            @click="isActive(i, 'i' + j) ? hide() : show(i, 'i' + j)"
          >{{ seg.chord }}</button>

          <ChordTooltip v-if="isActive(i, 'i' + j)" :symbol="seg.chord" @keep="show(i, 'i' + j)" @leave="hide" />
        </span>
      </div>

      <!-- Chord and lyric share one inline-block so they stay aligned no matter
           what the font metrics do or where the line wraps. -->
      <div v-else class="flex flex-wrap min-h-[2.6em] break-inside-avoid">
        <span v-for="(seg, j) in line.segments" :key="j" class="relative inline-block">
          <span class="block h-[1.3em]">
            <button
              v-if="seg.chord"
              class="font-semibold text-accent underline decoration-dotted decoration-accent/30 underline-offset-2"
              @mouseenter="show(i, j)" @mouseleave="hide"
              @click="isActive(i, j) ? hide() : show(i, j)"
            >{{ seg.chord }}</button>
          </span>
          <span class="block whitespace-pre">{{ seg.text }}</span>

          <ChordTooltip v-if="isActive(i, j)" :symbol="seg.chord" @keep="show(i, j)" @leave="hide" />
        </span>
      </div>
    </template>
  </div>
</template>
