<script setup>
import { parseSong, transposeContent, normalizeNotation } from '~/utils/chordpro';
import { strum } from '~/utils/chordAudio';
import { findFingering } from '~/utils/chordEngine';

const props = defineProps({
  content: { type: String, default: '' },
  semitones: { type: Number, default: 0 },
  // Passed so transposition can resolve the destination key.
  originalKey: { type: String, default: '' },
  /**
   * Capo fret. Display only: the shapes drop by this much so that fingering
   * them with the capo on sounds the chords that are actually stored. The
   * sounding pitch, and therefore the key label, never moves with it.
   */
  capo: { type: Number, default: 0 },
  fontSize: { type: Number, default: 15 },
  columns: { type: Boolean, default: false }
});

const lines = computed(() =>
  parseSong(normalizeNotation(
    transposeContent(props.content, props.semitones - props.capo, props.originalKey)))
);

// Which chord is showing its diagram. Keyed by position rather than by symbol,
// since the same chord appears many times in a song.
const active = ref(null);
const isActive = (line, seg) => active.value === `${line}:${seg}`;

/**
 * The chord button the open diagram belongs to.
 *
 * The tooltip measures this rather than sitting inside it: inside the
 * two-column sheet, CSS fragmentation puts an absolutely-positioned child in
 * the wrong column. See the trap note in ChordTooltip.vue.
 */
const anchor = ref(null);

let closeTimer = null;

function show(line, seg, event) {
  clearTimeout(closeTimer);
  active.value = `${line}:${seg}`;
  if (event?.currentTarget) {
    const el = event.currentTarget;
    anchor.value = el.tagName === 'BUTTON' ? el : el.querySelector('button') || el;
  }
}

function hide() {
  // A short grace period keeps the diagram from flickering while the pointer
  // crosses the gap between the chord and the panel.
  closeTimer = setTimeout(() => { active.value = null; }, 120);
}

onBeforeUnmount(() => clearTimeout(closeTimer));

/**
 * Pressing a chord in the text plays it and leaves the shape on screen.
 *
 * AI-DECISION: press no longer toggles the diagram shut. Somebody tapping a
 * chord in a lyric sheet is asking to hear it, and the second tap is almost
 * always "again", not "close" — closing is what moving away already does. The
 * dotted underline was the only sign these did anything at all.
 */
function playChord(symbol) {
  // `symbol` is already the shape, so its fingering is measured from the capo;
  // strum raises it back to concert pitch. Press Am under a capo at 3 and you
  // hear Cm, which is what the guitar in your hands would do.
  const shape = findFingering(symbol);
  if (shape) strum(shape.frets, { capo: props.capo });
}

</script>

<template>
  <!-- Chords and lyrics scale together, so column alignment survives any size. -->
  <div
    class="font-mono leading-tight transition-all"
    :class="columns ? 'columns-2 max-w-3xl gap-8 md:gap-12 [column-rule:1px_solid_var(--color-line-soft)]' : 'max-w-2xl'"
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
          @mouseenter="show(i, 'i' + j, $event)" @mouseleave="hide"
        >
          <button
            class="font-semibold text-accent underline decoration-dotted decoration-accent/30 underline-offset-4"
            :title="$t('song.chordHear')"
            @click="playChord(seg.chord); show(i, 'i' + j, $event)"
          >{{ seg.chord }}</button>

          <ChordTooltip v-if="isActive(i, 'i' + j)" :symbol="seg.chord" :anchor="anchor" @keep="show(i, 'i' + j)" @leave="hide" />
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
              @mouseenter="show(i, j, $event)" @mouseleave="hide"
              :title="$t('song.chordHear')"
              @click="playChord(seg.chord); show(i, j, $event)"
            >{{ seg.chord }}</button>
          </span>
          <span class="block whitespace-pre">{{ seg.text }}</span>

          <ChordTooltip v-if="isActive(i, j)" :symbol="seg.chord" :anchor="anchor" @keep="show(i, j)" @leave="hide" />
        </span>
      </div>
    </template>
  </div>
</template>
