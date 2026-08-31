<script setup>
import { parseSong, extractChords, transposeContent, normalizeNotation } from '~/utils/chordpro';
import { fingeringsFor, findFingering } from '~/utils/chordEngine';
import { strum } from '~/utils/chordAudio';

const props = defineProps({
  content: { type: String, default: '' },
  semitones: { type: Number, default: 0 },
  capo: { type: Number, default: 0 },
  originalKey: { type: String, default: '' },
  fontSize: { type: Number, default: 16 },
  columns: { type: Boolean, default: true },
  locked: { type: Boolean, default: false }
});

const sheet = computed(() => normalizeNotation(
  transposeContent(props.content, props.semitones - props.capo, props.originalKey)
));

const lines = computed(() => parseSong(sheet.value));

/** The distinct symbols on screen, which is what the prefetch warms. */
const shown = computed(() => extractChords(sheet.value));

/**
 * Pre-computes fingerings for all visible chords during idle time.
 *
 * Generates all 8 variations per chord across all 3 instruments so subsequent
 * clicks and hovers never touch the worker or lock the main thread.
 */
let warmHandle = null;
let stopWarming = () => {};

function warmFingerings(chordList) {
  stopWarming();
  if (typeof window === 'undefined' || props.locked || !chordList?.length) return;

  const queue = [...chordList];
  const idle = window.requestIdleCallback;
  const schedule = idle
    ? (fn) => idle(fn, { timeout: 2000 } || {})
    : (fn) => setTimeout(() => fn({ didTimeout: true }), 60);
  const clear = idle ? window.cancelIdleCallback : clearTimeout;

  const step = (deadline) => {
    // One chord costs roughly two milliseconds; stop before the slice is spent
    // rather than after, so a frame is never dropped for speculative work.
    while (queue.length && (deadline.didTimeout || deadline.timeRemaining() > 3)) {
      fingeringsFor(queue.shift());
    }
    warmHandle = queue.length ? schedule(step) : null;
  };

  warmHandle = schedule(step);
  stopWarming = () => {
    if (warmHandle !== null) clear(warmHandle);
    warmHandle = null;
  };
}

// onMounted rather than an immediate watcher: this touches window, and an
// immediate watcher would run during server render.
onMounted(() => warmFingerings(shown.value));
watch(shown, warmFingerings);
onBeforeUnmount(() => stopWarming());

// Which chord is showing its diagram. Keyed by position rather than by symbol,
// since the same chord appears many times in a song.
const active = ref(null);
const isActive = (key) => active.value === key;

/**
 * The chord button the open diagram belongs to.
 *
 * The tooltip measures this rather than sitting inside it: inside the
 * two-column sheet, CSS fragmentation puts an absolutely-positioned child in
 * the wrong column. See the trap note in ChordTooltip.vue.
 */
const anchor = ref(null);
const playCount = ref(0);

let closeTimer = null;

function show(key, event) {
  clearTimeout(closeTimer);
  active.value = key;
  if (event?.currentTarget) {
    const el = event.currentTarget;
    anchor.value = el.tagName === 'BUTTON' ? el : el.querySelector('button') || el;
  }
}

function keep(key) {
  clearTimeout(closeTimer);
  active.value = key;
}

function hide() {
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    active.value = null;
    anchor.value = null;
  }, 300);
}

onBeforeUnmount(() => {
  clearTimeout(closeTimer);
});

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

function onChordClick(key, symbol, event) {
  playChord(symbol);
  playCount.value += 1;
  show(key, event);
}
</script>

<template>
  <!-- Chords and lyrics scale together, so column alignment survives any size. -->
  <!--
    AI-NOTE: this blur is the SECOND layer, not the protection. What reaches this
    component is already substituted text over masked chords — the words in this
    DOM are not the song's words. The blur only stops somebody reading the
    substitution as though it were the lyric.

    select-none and aria-hidden travel with it: there is nothing here worth
    copying, and a screen reader announcing scrambled letters is just noise.
  -->
  <div
    class="font-mono leading-tight"
    :class="[
      columns ? 'columns-1 md:columns-2 xl:columns-3 max-w-full gap-8 md:gap-10 xl:gap-12 [column-rule:1px_solid_var(--color-line-soft)]' : 'max-w-2xl',
      locked ? 'select-none pointer-events-none' : ''
    ]"
    :style="{ fontSize: fontSize + 'px' }"
  >
    <template v-for="(line, i) in lines" :key="i">
      <!-- Empty lines: keep a non-breaking space so multi-column layouts do not
           collapse the vertical rhythm between verses. -->
      <div v-if="!line.label && !line.segments" class="h-[1.5em] break-inside-avoid">
        &nbsp;
      </div>

      <!-- Section headers (e.g. [Strofa 1], [Refren]) -->
      <h2
        v-else-if="line.label"
        class="mt-4 mb-2 first:mt-0 font-sans text-xs font-black uppercase tracking-wider text-accent inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-soft/70 border border-accent/25 select-none shadow-2xs
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
          @mouseenter="show(`inst-${i}-${j}`, $event)" @mouseleave="hide"
        >
          <!-- Locked: a span, not a button. The symbol arrived as dots, so there
               is nothing to play and nothing to look up. -->
          <span
            v-if="locked"
            class="select-none font-semibold text-faint/60 blur-[1.5px]"
            :title="$t('paywall.chordsHidden')"
          >{{ seg.chord }}</span>
          <button
            v-else
            class="font-semibold text-accent underline decoration-dotted decoration-accent/30 underline-offset-4 cursor-pointer"
            :class="isActive(`inst-${i}-${j}`) ? 'text-accent' : ''"
            :title="$t('song.chordHear')"
            @click="onChordClick(`inst-${i}-${j}`, seg.chord, $event)"
          >{{ seg.chord }}</button>

          <ChordTooltip
            v-if="!locked && isActive(`inst-${i}-${j}`)"
            :symbol="seg.chord"
            :anchor="anchor"
            :play-trigger="playCount"
            @keep="keep(`inst-${i}-${j}`)"
            @leave="hide"
          />
        </span>
      </div>

      <!-- Chord and lyric share one inline-block so they stay aligned no matter
           what the font metrics do or where the line wraps. -->
      <div v-else class="flex flex-wrap min-h-[2.6em] break-inside-avoid">
        <span v-for="(seg, j) in line.segments" :key="j" class="relative inline-block">
          <span class="block h-[1.3em]">
            <span
              v-if="seg.chord && locked"
              class="select-none font-semibold text-faint/60 blur-[1.5px]"
              :title="$t('paywall.chordsHidden')"
            >{{ seg.chord }}</span>
            <button
              v-else-if="seg.chord"
              class="font-semibold text-accent underline decoration-dotted decoration-accent/30 underline-offset-2 cursor-pointer"
              :class="isActive(`${i}-${j}`) ? 'text-accent' : ''"
              :title="$t('song.chordHear')"
              @mouseenter="show(`${i}-${j}`, $event)"
              @mouseleave="hide"
              @click="onChordClick(`${i}-${j}`, seg.chord, $event)"
            >{{ seg.chord }}</button>

            <ChordTooltip
              v-if="!locked && seg.chord && isActive(`${i}-${j}`)"
              :symbol="seg.chord"
              :anchor="anchor"
              :play-trigger="playCount"
              @keep="keep(`${i}-${j}`)"
              @leave="hide"
            />
          </span>
          <span class="block whitespace-pre">{{ seg.text }}</span>
        </span>
      </div>
    </template>
  </div>
</template>
