/**
 * Plays a chord shape as a strummed guitar.
 *
 * AI-DECISION: Karplus–Strong rather than oscillators. A sine or sawtooth per
 * note sounds like a church organ, and the point of hearing the chord is to
 * recognise it as the thing your hands are about to do. A short noise burst fed
 * through a delay line the length of one period, averaged as it recirculates, is
 * a plucked string in about thirty lines and no samples to download.
 *
 * AI-NOTE: the buffers are computed once per pitch and cached. Six strings at
 * 2.5 seconds is 660,000 samples of arithmetic — fine once, wasteful on every
 * click of a page showing 168 chords.
 */

const TUNING = [40, 45, 50, 55, 59, 64];   // E A D G H E, as MIDI numbers
const DECAY = 2.6;                          // seconds of ring
const STRUM = 0.028;                        // seconds between strings

let ctx = null;
const cache = new Map();

/** MIDI number to hertz. 69 is A4 at 440. */
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

/**
 * The audio context, created on the first click and never before.
 *
 * AI-TRAP: browsers refuse to start audio outside a user gesture, and a context
 * created at page load arrives suspended. Building it lazily inside the click
 * handler means it is always created in a gesture — and resume() covers the case
 * where the tab was backgrounded and the context was suspended again.
 */
function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/**
 * One plucked string.
 *
 * The loop is the whole algorithm: each sample is the average of the two that
 * sat one period earlier, scaled a little under one. Averaging is a lowpass, so
 * the high partials die first and the note darkens as it fades — which is what a
 * real string does and what makes this sound like one.
 */
function pluckBuffer(context, frequency, brightness) {
  const key = `${Math.round(frequency * 100)}:${brightness}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const rate = context.sampleRate;
  const period = Math.max(2, Math.round(rate / frequency));
  const length = Math.floor(rate * DECAY);
  const buffer = context.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);

  // The noise burst: one period of it, which is the pluck itself.
  for (let i = 0; i <= period; i++) data[i] = Math.random() * 2 - 1;

  // Just under 1: above it the string never stops, below it dies too fast.
  const damping = 0.9965 - (1 - brightness) * 0.004;

  // Starts at period + 1 so both terms are always inside the buffer. Reaching
  // back one further than the period is what makes the delay line average two
  // samples rather than repeat one.
  for (let i = period + 1; i < length; i++) {
    data[i] = damping * 0.5 * (data[i - period] + data[i - period - 1]);
  }

  cache.set(key, buffer);
  return buffer;
}

/**
 * Strums one fingering.
 *
 * @param frets  low E to high E; a number is a fret, 0 is open, null is muted
 * @param opts   direction 'down' (default) or 'up', and a 0–1 volume
 */
export function strum(frets, { direction = 'down', volume = 0.7 } = {}) {
  const context = audio();
  if (!context || !Array.isArray(frets)) return false;

  const strings = frets
    .map((fret, i) => (fret === null ? null : { i, midi: TUNING[i] + fret }))
    .filter(Boolean);
  if (!strings.length) return false;

  const order = direction === 'up' ? [...strings].reverse() : strings;
  const start = context.currentTime + 0.02;

  order.forEach((string, n) => {
    const source = context.createBufferSource();
    // Thinner strings ring brighter; the wound low ones are duller.
    source.buffer = pluckBuffer(context, hz(string.midi), 0.55 + (string.i / 5) * 0.45);

    const gain = context.createGain();
    // The bass strings carry more energy, so they need less gain to sit level.
    const level = volume * (0.55 + (5 - string.i) * 0.03);
    const at = start + n * STRUM;

    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + 0.006);
    // The string fades by itself, so this only guards the tail against a click.
    gain.gain.setValueAtTime(level, at + DECAY - 0.15);
    gain.gain.linearRampToValueAtTime(0, at + DECAY);

    source.connect(gain).connect(context.destination);
    source.start(at);
    source.stop(at + DECAY);
  });

  return true;
}

/**
 * One string, at a given pitch.
 *
 * The tuner's reference notes need this: there is no fingering to strum, just a
 * frequency somebody wants to hear so they can match it by ear.
 */
export function note(frequency, { volume = 0.6, brightness = 0.75 } = {}) {
  const context = audio();
  if (!context || !(frequency > 0)) return false;

  const source = context.createBufferSource();
  source.buffer = pluckBuffer(context, frequency, brightness);

  const gain = context.createGain();
  const at = context.currentTime + 0.02;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.006);
  gain.gain.setValueAtTime(volume, at + DECAY - 0.15);
  gain.gain.linearRampToValueAtTime(0, at + DECAY);

  source.connect(gain).connect(context.destination);
  source.start(at);
  source.stop(at + DECAY);
  return true;
}

/**
 * The shared audio context, for anything that needs to schedule its own sound.
 *
 * AI-NOTE: exported so the metronome can schedule against the same clock rather
 * than opening a second context. Browsers cap how many a page may have, and two
 * contexts drift apart — which for a metronome is the whole problem.
 */
export const context = () => audio();

/** Whether this browser can play anything at all. */
export const canPlay = () =>
  typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext);
