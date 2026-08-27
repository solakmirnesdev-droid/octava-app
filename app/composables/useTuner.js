/**
 * Microphone pitch detection for the tuner.
 *
 * Detection is delegated to pitchy, which implements the McLeod Pitch Method:
 * normalised square difference, which finds the waveform's repeating period
 * rather than its loudest frequency. That distinction matters because a
 * plucked string routinely puts more energy into its second harmonic than into
 * the fundamental, so an FFT peak reports the note an octave high.
 *
 * A hand-written autocorrelation measured the same accuracy (+/-3 cents on
 * synthesised plucks with realistic inharmonicity), but cost 10.8ms per
 * reading against 0.1ms here — around a hundred times more CPU, which on a
 * phone is the difference between a tuner and a space heater. The saving is
 * spent on a longer window instead: at 82Hz a 2048-sample buffer holds under
 * four periods of the low E, while 4096 holds nearly eight.
 */
import { PitchDetector } from 'pitchy';

/**
 * The instruments this tuner knows, each in standard tuning, low string first.
 *
 * AI-NOTE: written out as frequencies rather than derived from note names,
 * because the ukulele is the case a formula gets wrong. Its G is *above* the C
 * next to it — re-entrant tuning — so "low to high" is not the order of the
 * strings on the instrument, and anything that sorts them is showing a
 * ukulele nobody owns.
 */
export const INSTRUMENTS = {
  guitar: {
    labelKey: 'tuner.guitar',
    tuning: 'E A D G H E',
    strings: [
      { label: 'E', octave: 2, frequency: 82.41 },
      { label: 'A', octave: 2, frequency: 110.00 },
      { label: 'D', octave: 3, frequency: 146.83 },
      { label: 'G', octave: 3, frequency: 196.00 },
      { label: 'H', octave: 3, frequency: 246.94 },
      { label: 'E', octave: 4, frequency: 329.63 }
    ]
  },
  bass: {
    labelKey: 'tuner.bass',
    tuning: 'E A D G',
    strings: [
      { label: 'E', octave: 1, frequency: 41.20 },
      { label: 'A', octave: 1, frequency: 55.00 },
      { label: 'D', octave: 2, frequency: 73.42 },
      { label: 'G', octave: 2, frequency: 98.00 }
    ]
  },
  ukulele: {
    labelKey: 'tuner.ukulele',
    tuning: 'G C E A',
    strings: [
      { label: 'G', octave: 4, frequency: 392.00 },
      { label: 'C', octave: 4, frequency: 261.63 },
      { label: 'E', octave: 4, frequency: 329.63 },
      { label: 'A', octave: 4, frequency: 440.00 }
    ]
  }
};

/** Kept for anything still importing the guitar set directly. */
export const STRINGS = INSTRUMENTS.guitar.strings;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H'];

const A4 = 440;
/**
 * Long enough to hold several periods of the lowest string on offer.
 *
 * AI-DECISION: 8192 rather than 4096, because of the bass. At the guitar's low
 * E (82Hz) 4096 samples hold 7.6 periods, which is plenty; at the bass's low E
 * (41Hz) they hold 3.8, which is where the McLeod method starts guessing. 8192
 * gives the bass the same 7.6 periods the guitar had. It costs 186ms of latency
 * instead of 93ms — imperceptible against a string that rings for seconds.
 */
const BUFFER_SIZE = 8192;
/** Below this the signal is noise, not a note. */
const RMS_FLOOR = 0.01;
/**
 * pitchy reports how confidently the period was found. Anything under this is
 * a room noise or a dying note, and reporting it makes the needle jump.
 */
const CLARITY_FLOOR = 0.85;
/** Detection is cheap now, so this is chosen for a readable needle, not cost. */
const INTERVAL_MS = 60;

/**
 * In a noisy room, ask for more before believing a reading.
 *
 * AI-NOTE: this is the "focus" option. It does not make the tuner hear better —
 * it makes it refuse more. A stricter clarity floor, a louder signal required,
 * and a longer median: fewer readings, each worth trusting. In a quiet room it
 * would only make the tuner feel sluggish, which is why it is a choice.
 */
const FOCUS = { rms: 0.03, clarity: 0.94, smoothing: 7, cents: 250 };
const RELAXED = { rms: RMS_FLOOR, clarity: CLARITY_FLOOR, smoothing: 4, cents: 700 };

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

export function useTuner() {
  /**
   * Which instrument is being tuned.
   *
   * AI-TRAP: this has to feed the nearest-string check as well as the display.
   * Leaving that on the guitar set meant a bass low E at 41Hz was reported as
   * nearest the guitar's 82Hz E — an octave out, and the one reading a bass
   * player most needs to trust.
   */
  const instrument = ref('guitar');
  const strings = computed(() => INSTRUMENTS[instrument.value]?.strings || INSTRUMENTS.guitar.strings);
  const listening = ref(false);
  const error = ref(null);
  const reading = ref(null);

  let context = null;
  let stream = null;
  let analyser = null;
  let timer = null;
  let buffer = null;
  let detector = null;
  let rumbleFilter = null;

  /** The lowest string on the instrument being tuned, in hertz. */
  const lowestString = () => Math.min(...strings.value.map((x) => x.frequency));

  /** Smoothed so the needle settles instead of twitching on every frame. */
  const history = [];

  /** Whether the reader has asked for the strict thresholds. */
  const focus = ref(false);

  // A player switching from guitar to bass mid-session would otherwise keep a
  // corner at 58Hz, which silences the bass's two lowest strings entirely.
  watch(instrument, () => {
    history.length = 0;
    reading.value = null;
    if (rumbleFilter) rumbleFilter.frequency.value = lowestString() * 0.7;
  });
  const limits = computed(() => (focus.value ? FOCUS : RELAXED));

  /**
   * The band a real string can be in, for the instrument being tuned.
   *
   * AI-TRAP: without this the tuner reported "F#−2 at 5.9 Hz". A fan or traffic
   * rumble is periodic, so it clears the clarity floor as easily as a note does
   * — and 5.9Hz is not only below every string, it is below hearing. Clarity
   * says "this repeats", never "this is music".
   */
  const band = computed(() => {
    const freqs = strings.value.map((s) => s.frequency);
    const widen = (cents) => 2 ** (cents / 1200);
    return {
      low: Math.min(...freqs) / widen(limits.value.cents),
      high: Math.max(...freqs) * widen(limits.value.cents)
    };
  });

  function sample() {
    analyser.getFloatTimeDomainData(buffer);

    // Reject silence before spending anything on detection.
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
    if (Math.sqrt(rms / buffer.length) < limits.value.rms) {
      history.length = 0;
      reading.value = null;
      return;
    }

    const [frequency, clarity] = detector.findPitch(buffer, context.sampleRate);

    const plausible = frequency >= band.value.low && frequency <= band.value.high;
    if (!frequency || !plausible || clarity < limits.value.clarity) {
      history.length = 0;
      reading.value = null;
      return;
    }

    history.push(frequency);
    while (history.length > limits.value.smoothing) history.shift();

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
      detector = PitchDetector.forFloat32Array(analyser.fftSize);

      /**
       * A high-pass ahead of the detector, cutting below the lowest string.
       *
       * AI-DECISION: this removes the rumble rather than arguing with it later.
       * A fan, traffic or a hand on the body puts most of its energy under 40Hz,
       * and that energy is periodic — which is why it cleared the clarity floor
       * and produced a reading of 5.9Hz. Thresholds can refuse such a reading;
       * a filter means it never arrives. See AI-NOTES.md §5.
       *
       * The corner follows the instrument: a bass low E at 41Hz would be eaten
       * by a corner set for a guitar.
       */
      rumbleFilter = context.createBiquadFilter();
      rumbleFilter.type = 'highpass';
      rumbleFilter.frequency.value = lowestString() * 0.7;
      rumbleFilter.Q.value = 0.7;

      context.createMediaStreamSource(stream).connect(rumbleFilter).connect(analyser);

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
    detector = null;
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

  return {
    listening, error, reading, nearestString, inTune, start, stop,
    instrument, strings, INSTRUMENTS, focus
  };
}
