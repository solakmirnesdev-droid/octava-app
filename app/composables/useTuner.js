/**
 * Microphone pitch detection for the tuner.
 *
 * Uses autocorrelation rather than an FFT peak. A plucked guitar string often
 * puts more energy into its second harmonic than into the fundamental, so
 * reading the loudest FFT bin reports the note an octave high — exactly the
 * failure that makes a tuner useless. Autocorrelation finds the repeating
 * period of the waveform, which is the fundamental whatever the harmonics do.
 */

/** Standard tuning, low to high, in our notation. */
export const STRINGS = [
  { label: 'E', octave: 2, frequency: 82.41 },
  { label: 'A', octave: 2, frequency: 110.00 },
  { label: 'D', octave: 3, frequency: 146.83 },
  { label: 'G', octave: 3, frequency: 196.00 },
  { label: 'H', octave: 3, frequency: 246.94 },
  { label: 'E', octave: 4, frequency: 329.63 }
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H'];

const A4 = 440;
const BUFFER_SIZE = 2048;
/** Below this the signal is noise, not a note. */
const RMS_FLOOR = 0.01;
/** Correlation quality under this means no clear periodicity was found. */
const CLARITY_FLOOR = 0.9;
/** The detector is O(n^2); running it every frame would peg a phone's CPU. */
const INTERVAL_MS = 90;

/** Frequency to note name, octave, and how far off in cents. */
export function describePitch(frequency) {
  const semitonesFromA4 = 12 * Math.log2(frequency / A4);
  const rounded = Math.round(semitonesFromA4);

  // A4 sits at index 9 (A) of octave 4.
  const noteIndex = (((rounded + 9) % 12) + 12) % 12;
  const octave = 4 + Math.floor((rounded + 9) / 12);
  const exact = A4 * Math.pow(2, rounded / 12);
  const cents = Math.round(1200 * Math.log2(frequency / exact));

  return { note: NOTE_NAMES[noteIndex], octave, cents, frequency };
}

/**
 * Estimates the fundamental period by correlating the signal with itself.
 * Returns -1 when the input is too quiet or too noisy to trust.
 */
function detectPitch(buffer, sampleRate) {
  const size = buffer.length;

  let rms = 0;
  for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / size);
  if (rms < RMS_FLOOR) return -1;

  // Trim near-silent head and tail so they do not flatten the correlation.
  const threshold = 0.2;
  let start = 0;
  let end = size - 1;
  for (let i = 0; i < size / 2; i++) if (Math.abs(buffer[i]) < threshold) { start = i; break; }
  for (let i = 1; i < size / 2; i++) if (Math.abs(buffer[size - i]) < threshold) { end = size - i; break; }

  const trimmed = buffer.slice(start, end);
  const length = trimmed.length;
  if (length < 2) return -1;

  const correlation = new Float32Array(length).fill(0);
  for (let lag = 0; lag < length; lag++) {
    for (let i = 0; i < length - lag; i++) correlation[lag] += trimmed[i] * trimmed[i + lag];
  }

  // Walk past the initial descent, then take the tallest peak: that lag is one
  // period. Starting from lag 0 would always find lag 0 itself.
  let lag = 0;
  while (lag < length - 1 && correlation[lag] > correlation[lag + 1]) lag++;

  let peak = -1;
  let peakLag = -1;
  for (let i = lag; i < length; i++) {
    if (correlation[i] > peak) { peak = correlation[i]; peakLag = i; }
  }
  if (peakLag <= 0) return -1;

  // A weak peak relative to zero lag means no real periodicity.
  if (correlation[0] > 0 && peak / correlation[0] < 1 - CLARITY_FLOOR) return -1;

  // Parabolic interpolation around the peak, so resolution is not limited to
  // whole samples — at guitar frequencies one sample is several cents.
  const before = correlation[peakLag - 1] ?? 0;
  const at = correlation[peakLag];
  const after = correlation[peakLag + 1] ?? 0;
  const shape = (before + after - 2 * at) / 2;
  const slope = (after - before) / 2;
  const refined = shape ? peakLag - slope / (2 * shape) : peakLag;

  return sampleRate / refined;
}

export function useTuner() {
  const listening = ref(false);
  const error = ref(null);
  const reading = ref(null);

  let context = null;
  let stream = null;
  let analyser = null;
  let timer = null;
  let buffer = null;

  /** Smoothed so the needle settles instead of twitching on every frame. */
  const history = [];
  const SMOOTHING = 4;

  function sample() {
    analyser.getFloatTimeDomainData(buffer);
    const frequency = detectPitch(buffer, context.sampleRate);

    if (frequency < 0) {
      history.length = 0;
      reading.value = null;
      return;
    }

    history.push(frequency);
    if (history.length > SMOOTHING) history.shift();

    // Median rather than mean: one bad frame should not drag the reading.
    const sorted = [...history].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    reading.value = describePitch(median);
  }

  async function start() {
    if (listening.value) return;
    error.value = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Every one of these would fight the detector: noise suppression
          // eats sustained tones and AGC keeps changing the amplitude.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      context = new (window.AudioContext || window.webkitAudioContext)();
      analyser = context.createAnalyser();
      analyser.fftSize = BUFFER_SIZE;
      buffer = new Float32Array(analyser.fftSize);

      context.createMediaStreamSource(stream).connect(analyser);

      listening.value = true;
      timer = setInterval(sample, INTERVAL_MS);
    } catch (err) {
      error.value = err.name === 'NotAllowedError'
        ? 'Pristup mikrofonu je odbijen. Dozvoli ga u postavkama preglednika.'
        : 'Mikrofon nije dostupan na ovom uređaju.';
      stop();
    }
  }

  function stop() {
    listening.value = false;
    reading.value = null;
    history.length = 0;

    clearInterval(timer);
    timer = null;

    stream?.getTracks().forEach((track) => track.stop());
    stream = null;

    context?.close().catch(() => {});
    context = null;
    analyser = null;
  }

  /** Which open string the current reading is closest to. */
  const nearestString = computed(() => {
    if (!reading.value) return null;

    return STRINGS.reduce((best, string) => {
      const distance = Math.abs(1200 * Math.log2(reading.value.frequency / string.frequency));
      return !best || distance < best.distance ? { ...string, distance } : best;
    }, null);
  });

  const inTune = computed(() => reading.value && Math.abs(reading.value.cents) <= 5);

  // A tuner left running holds the microphone open, which most browsers show
  // as a recording indicator.
  onBeforeUnmount(stop);

  return { listening, error, reading, nearestString, inTune, start, stop, STRINGS };
}
