import { context as audioContext } from '~/utils/chordAudio';

/**
 * A metronome that stays in time.
 *
 * AI-DECISION: beats are scheduled ahead on the audio clock, not fired by a
 * timer. setInterval drifts by tens of milliseconds under any load — a route
 * change, a garbage collection, a background tab — and a metronome that
 * stutters is worse than none, because you cannot tell whether you rushed or it
 * did. A timer still runs, but only to top up a queue of beats already placed on
 * the audio clock, which does not drift. See AI-NOTES.md §5.
 */

export const MIN_BPM = 40;
export const MAX_BPM = 240;

/** How far ahead beats are placed, and how often the queue is topped up. */
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12;

/** A tap older than this belongs to a different attempt at setting the tempo. */
const TAP_TIMEOUT_MS = 2000;

export function useMetronome() {
  const running = ref(false);
  const bpm = ref(100);
  const beatsPerBar = ref(4);

  /** Which beat is sounding, 0-based; -1 when stopped. */
  const beat = ref(-1);

  let timer = null;
  let nextBeatAt = 0;
  let nextBeatNumber = 0;
  let taps = [];

  /**
   * One click.
   *
   * A short sine burst rather than noise: noise reads as a rimshot and gets lost
   * against a strummed guitar, while a pitched click cuts through. The first
   * beat of the bar is higher and a little louder, which is the whole reason to
   * have bars at all.
   */
  function click(at, accented) {
    const ctx = audioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = accented ? 1600 : 1000;
    // Very short, and shaped: a square edge on a sine makes an audible thump at
    // the end of the click.
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(accented ? 0.5 : 0.32, at + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);

    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.06);
  }

  /** Tops up the queue with every beat that falls inside the lookahead window. */
  function schedule() {
    const ctx = audioContext();
    if (!ctx) return;

    while (nextBeatAt < ctx.currentTime + SCHEDULE_AHEAD) {
      const which = nextBeatNumber % beatsPerBar.value;
      click(nextBeatAt, which === 0);

      /*
       * AI-TRAP: the indicator is driven by a timer aimed at the scheduled
       * moment, not updated where the beat is queued. Queuing happens up to
       * 120ms early, so lighting the dot there makes the display run visibly
       * ahead of the sound — which reads as the metronome being wrong.
       */
      const delay = Math.max(0, (nextBeatAt - ctx.currentTime) * 1000);
      window.setTimeout(() => { if (running.value) beat.value = which; }, delay);

      // Read fresh each time, so a tempo change takes effect on the next beat
      // rather than after the queue drains.
      nextBeatAt += 60 / bpm.value;
      nextBeatNumber += 1;
    }
  }

  function start() {
    const ctx = audioContext();
    if (!ctx || running.value) return false;

    running.value = true;
    nextBeatNumber = 0;
    // A breath of headroom, or the first beat is scheduled in the past and the
    // browser fires it immediately — which lands it early against the second.
    nextBeatAt = ctx.currentTime + 0.06;

    schedule();
    timer = window.setInterval(schedule, LOOKAHEAD_MS);
    return true;
  }

  function stop() {
    running.value = false;
    beat.value = -1;
    window.clearInterval(timer);
    timer = null;
  }

  const toggle = () => (running.value ? stop() : start());

  function setBpm(value) {
    bpm.value = Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value) || MIN_BPM));
  }

  /**
   * Tap tempo.
   *
   * Averages the gaps rather than using the last one: a single uneven tap
   * should nudge the tempo, not replace it.
   */
  function tap() {
    const now = performance.now();
    if (taps.length && now - taps[taps.length - 1] > TAP_TIMEOUT_MS) taps = [];
    taps.push(now);
    if (taps.length > 6) taps.shift();
    if (taps.length < 2) return null;

    const gaps = taps.slice(1).map((t, i) => t - taps[i]);
    const average = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    setBpm(60000 / average);
    return bpm.value;
  }

  // A metronome left running in a closed tab is a browser that keeps ticking.
  onBeforeUnmount(stop);

  return { running, bpm, beatsPerBar, beat, start, stop, toggle, setBpm, tap };
}
