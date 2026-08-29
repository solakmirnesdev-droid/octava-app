<script setup>
import { parseSong, transposeContent, normalizeNotation, extractChords } from '~/utils/chordpro';
import { strum } from '~/utils/chordAudio';
import { findFingering, fingeringsFor } from '~/utils/chordEngine';

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
  columns: { type: Boolean, default: false },
  /**
   * The chords arrived masked from the server.
   *
   * AI-NOTE: this only changes how they are drawn. It is not the protection —
   * the symbols are already dots by the time they get here, and a component
   * prop could never be the thing standing between a visitor and paid content.
   */
  locked: { type: Boolean, default: false }
});

/**
 * The body as it is actually drawn: transposed, dropped by the capo, respelled.
 *
 * Held as its own computed because two things read it — the parsed lines and
 * the prefetch below — and running the transposition twice for the same string
 * is work nobody sees.
 */
const sheet = computed(() => normalizeNotation(
  transposeContent(props.content, props.semitones - props.capo, props.originalKey)
));

const lines = computed(() => parseSong(sheet.value));

/** The distinct symbols on screen, which is what the prefetch warms. */
const shown = computed(() => extractChords(sheet.value));

/**
 * Precomputes the fingerings for the chords on screen, before anyone taps one.
 *
 * AI-DECISION: `fingeringsFor` searches the fretboard for playable voicings and
 * caches by symbol — 10.6ms for four chords on a laptop, 0.015ms once warm.
 * On a phone that first tap is the difference between a diagram appearing and a
 * diagram arriving, and it lands at the worst moment: mid-song, on stage.
 *
 * AI-TRAP: it runs on idle slices, not on mount. The work is pure CPU on the
 * main thread, so doing it eagerly moves a stall from the first tap onto first
 * paint — trading a delay nobody notices for one everybody does. It also has to
 * re-run on transpose: `shown` holds the symbols *after* the shift, so a song
 * moved up two semitones is a completely cold set of shapes.
 *
 * Not run while locked: those symbols arrive from the server as dots.
 */
let warmHandle = null;
let stopWarming = () => {};

function warmFingerings(symbols) {
  stopWarming();
  if (props.locked || !symbols?.length) return;

  const queue = symbols.slice();
  const idle = window.requestIdleCallback;
  const schedule = idle
    ? (fn) => idle(fn, { timeout: 2000 })
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
  <!--
    AI-NOTE: this blur is the SECOND layer, not the protection. What reaches this
    component is already substituted text over masked chords — the words in this
    DOM are not the song's words. The blur only stops somebody reading the
    substitution as though it were the lyric.

    select-none and aria-hidden travel with it: there is nothing here worth
    copying, and a screen reader announcing scrambled letters is just noise.
  -->
  <div
    class="font-mono leading-tight transition-all"
    :class="[
      columns ? 'columns-1 md:columns-2 xl:columns-3 max-w-full gap-8 md:gap-10 xl:gap-12 [column-rule:1px_solid_var(--color-line-soft)]' : 'max-w-2xl',
      locked ? 'select-none blur-[3px] opacity-70' : ''
    ]"
    :style="{ fontSize: fontSize + 'px' }"
    :aria-hidden="locked || undefined"
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
          <!-- Locked: a span, not a button. The symbol arrived as dots, so there
               is nothing to play and nothing to look up. -->
          <span
            v-if="locked"
            class="select-none font-semibold text-faint/60 blur-[1.5px]"
            :title="$t('paywall.chordsHidden')"
          >{{ seg.chord }}</span>
          <button
            v-else
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
            <span
                v-if="seg.chord && locked"
                class="select-none font-semibold text-faint/60 blur-[1.5px]"
                :title="$t('paywall.chordsHidden')"
              >{{ seg.chord }}</span>
              <button
              v-else-if="seg.chord"
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
