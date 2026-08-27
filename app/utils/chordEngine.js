/**
 * Generates guitar fingerings from chord intervals and the tuning.
 *
 * The old fingerings.js held 37 shapes typed out by hand, which covered the
 * open chords and nothing else — a song using G/B or Fmaj7 got no diagram at
 * all. Voicings are derivable: a chord is a set of pitch classes, a fretboard
 * maps (string, fret) to a pitch class, and the rest is a search over the
 * combinations a hand can actually hold.
 *
 * AI-DECISION: computed, not transcribed. Every root, quality and neck position
 * is covered without anyone maintaining a table, and each shape is checked for
 * playability rather than trusted. See AI-NOTES.md §4.
 *
 * Names follow the ex-Yugoslav alphabet used everywhere else here: H is the
 * twelfth degree, and there are no flats — A# never Bb.
 */

import { canonicalShapes, OPEN_ONLY } from './chordShapes.js';

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H'];

/** Standard tuning as MIDI numbers, low string first: E A D G H E. */
const TUNING = [40, 45, 50, 55, 59, 64];

const STRINGS = 6;
const MAX_SPAN = 4;        // frets a hand covers without shifting
const MAX_FINGERS = 4;
const HIGHEST_FRET = 15;   // past this the diagrams stop being useful

/**
 * Intervals in semitones from the root.
 *
 * `optional` lists degrees that may be dropped when six strings cannot hold
 * everything — the fifth is the usual casualty in ninths and thirteenths,
 * since it adds no colour. It is never optional where it is the characteristic
 * note: diminished, augmented and power chords keep it.
 */
/**
 * Intervals in semitones from the root, with the name and formula shown under
 * the diagram so a shape is more than a picture to copy.
 *
 * `optional` lists degrees that may be dropped when six strings cannot hold
 * everything — the fifth is the usual casualty in ninths and thirteenths, since
 * it adds no colour. It is never optional where it is the characteristic note:
 * diminished, augmented and power chords keep it.
 *
 * The quality name is a translation key rather than a word: this table is read
 * by both catalogues, and 'dur' printed on the English site is not a label, it
 * is a bug.
 */
export const QUALITIES = {
  "":       { labelKey: "major",       formula: "1 - 3 - 5",              steps: [0, 4, 7]             },
  "m":      { labelKey: "minor",       formula: "1 - b3 - 5",             steps: [0, 3, 7]             },
  "5":      { labelKey: "fifth",       formula: "1 - 5",                  steps: [0, 7]                },
  "6":      { labelKey: "sixth",       formula: "1 - 3 - 5 - 6",          steps: [0, 4, 7, 9],         optional: [7] },
  "m6":     { labelKey: "minor6",      formula: "1 - b3 - 5 - 6",         steps: [0, 3, 7, 9],         optional: [7] },
  "7":      { labelKey: "seventh",     formula: "1 - 3 - 5 - b7",         steps: [0, 4, 7, 10],        optional: [7] },
  "maj7":   { labelKey: "major7",      formula: "1 - 3 - 5 - 7",          steps: [0, 4, 7, 11],        optional: [7] },
  "m7":     { labelKey: "minor7",      formula: "1 - b3 - 5 - b7",        steps: [0, 3, 7, 10],        optional: [7] },
  "mmaj7":  { labelKey: "minorMajor7", formula: "1 - b3 - 5 - 7",         steps: [0, 3, 7, 11],        optional: [7] },
  "dim":    { labelKey: "dim",         formula: "1 - b3 - b5",            steps: [0, 3, 6]             },
  "dim7":   { labelKey: "dim7",        formula: "1 - b3 - b5 - bb7",      steps: [0, 3, 6, 9]          },
  "m7b5":   { labelKey: "halfDim",     formula: "1 - b3 - b5 - b7",       steps: [0, 3, 6, 10]         },
  "aug":    { labelKey: "aug",         formula: "1 - 3 - #5",             steps: [0, 4, 8]             },
  "7#5":    { labelKey: "augSeventh",  formula: "1 - 3 - #5 - b7",        steps: [0, 4, 8, 10]         },
  "sus2":   { labelKey: "sus2",        formula: "1 - 2 - 5",              steps: [0, 2, 7]             },
  "sus4":   { labelKey: "sus4",        formula: "1 - 4 - 5",              steps: [0, 5, 7]             },
  "7sus4":  { labelKey: "sevenSus4",   formula: "1 - 4 - 5 - b7",         steps: [0, 5, 7, 10],        optional: [7] },
  "add9":   { labelKey: "add9",        formula: "1 - 3 - 5 - 9",          steps: [0, 4, 7, 14],        optional: [7] },
  "madd9":  { labelKey: "minorAdd9",   formula: "1 - b3 - 5 - 9",         steps: [0, 3, 7, 14],        optional: [7] },
  "9":      { labelKey: "ninth",       formula: "1 - 3 - 5 - b7 - 9",     steps: [0, 4, 7, 10, 14],    optional: [7] },
  "maj9":   { labelKey: "major9",      formula: "1 - 3 - 5 - 7 - 9",      steps: [0, 4, 7, 11, 14],    optional: [7] },
  "m9":     { labelKey: "minor9",      formula: "1 - b3 - 5 - b7 - 9",    steps: [0, 3, 7, 10, 14],    optional: [7] },
  "11":     { labelKey: "eleventh",    formula: "1 - 5 - b7 - 9 - 11",    steps: [0, 7, 10, 14, 17],   optional: [7, 14] },
  "m11":    { labelKey: "minor11",     formula: "1 - b3 - 5 - b7 - 11",   steps: [0, 3, 7, 10, 17],    optional: [7, 14] },
  "13":     { labelKey: "thirteenth",  formula: "1 - 3 - b7 - 13",        steps: [0, 4, 10, 21],       optional: [7, 14] },
  "7b9":    { labelKey: "sevenFlat9",  formula: "1 - 3 - 5 - b7 - b9",    steps: [0, 4, 7, 10, 13],    optional: [7] },
  "7#9":    { labelKey: "sevenSharp9", formula: "1 - 3 - 5 - b7 - #9",    steps: [0, 4, 7, 10, 15],    optional: [7] }
};


/** Written forms people actually type, mapped onto the keys above. */
const ALIASES = {
  'maj': '', 'M': '', 'dur': '', 'min': 'm', 'mol': 'm', '-': 'm',
  'maj7': 'maj7', 'Maj7': 'maj7', 'M7': 'maj7', 'Δ': 'maj7', '7M': 'maj7',
  'mMaj7': 'mmaj7', 'mM7': 'mmaj7', 'm(maj7)': 'mmaj7',
  '°': 'dim', 'o': 'dim', '°7': 'dim7', 'o7': 'dim7',
  'ø': 'm7b5', 'ø7': 'm7b5', 'm7-5': 'm7b5', 'min7b5': 'm7b5', 'halfdim': 'm7b5',
  '+': 'aug', '+5': 'aug', '#5': 'aug', 'aug7': '7#5', '7+5': '7#5', '7+': '7#5',
  'sus': 'sus4', 'sus47': '7sus4', '7sus': '7sus4',
  'add2': 'add9', '2': 'add9', 'm add9': 'madd9',
  'min9': 'm9', 'min7': 'm7', 'min6': 'm6', 'min11': 'm11',
  'dom7': '7', 'dom9': '9'
};

/**
 * Splits "C#m7/G#" into root, quality and bass.
 *
 * AI-TRAP: the root must be read before the quality, and 'm' must not be
 * matched inside 'maj7' — test C, Cm, Cmaj7 and Cm7 whenever this changes.
 */
export function parseChord(symbol) {
  if (typeof symbol !== 'string') return null;
  const text = symbol.trim().replace(/[‘’]/g, "'");
  if (!text) return null;

  const m = /^([A-H])([#b]?)(.*)$/.exec(text);
  if (!m) return null;

  let root = NOTES.indexOf(m[1] === 'B' ? 'A#' : m[1]);   // foreign B reads as A#
  if (root < 0) return null;
  if (m[2] === '#') root = (root + 1) % 12;
  if (m[2] === 'b') root = (root + 11) % 12;

  let rest = m[3];
  let bass = null;

  const slash = rest.indexOf('/');
  if (slash >= 0) {
    const b = /^([A-H])([#b]?)$/.exec(rest.slice(slash + 1).trim());
    if (!b) return null;
    bass = NOTES.indexOf(b[1] === 'B' ? 'A#' : b[1]);
    if (bass < 0) return null;
    if (b[2] === '#') bass = (bass + 1) % 12;
    if (b[2] === 'b') bass = (bass + 11) % 12;
    rest = rest.slice(0, slash);
  }

  rest = rest.trim();
  const quality = Object.prototype.hasOwnProperty.call(QUALITIES, rest)
    ? rest
    : ALIASES[rest];
  if (quality === undefined) return null;

  return { root, quality, bass, symbol: text };
}

/** The canonical spelling, so 'Bb' and 'CMaj7' converge on one cache key. */
export function chordName({ root, quality, bass }) {
  return NOTES[root] + quality + (bass === null ? '' : '/' + NOTES[bass]);
}

/**
 * Can a hand hold this? Returns the barre if one is needed, or null if the
 * shape needs more fingers than exist.
 */
function playability(frets) {
  const fretted = [];
  for (let i = 0; i < STRINGS; i++) if (frets[i] > 0) fretted.push(i);
  if (fretted.length <= MAX_FINGERS) return { barre: null };

  const low = Math.min(...fretted.map((i) => frets[i]));
  const at = fretted.filter((i) => frets[i] === low);
  const from = at[0];
  const to = at[at.length - 1];

  // A barre presses every string it crosses, so an open string under it dies.
  for (let i = from; i <= to; i++) if (frets[i] === 0) return null;

  const above = fretted.filter((i) => frets[i] > low).length;
  if (above > MAX_FINGERS - 1) return null;

  return { barre: { fret: low, from, to } };
}

/** Generates every playable voicing of one chord, best first. */
export function voicings(parsed, limit = 8) {
  const { root, quality, bass } = parsed;
  const spec = QUALITIES[quality];
  if (!spec) return [];

  const optional = new Set(spec.optional || []);
  const wanted = new Set(spec.steps.map((s) => (root + s) % 12));
  const mustHave = new Set(
    spec.steps.filter((s) => !optional.has(s)).map((s) => (root + s) % 12)
  );

  // AI-TRAP: a slash chord's bass need not belong to the chord — C/H and Am/G
  // are ordinary. Requiring it to be a chord tone made G/B produce nothing.
  const bassNote = bass === null ? root : bass;
  const playable = new Set(wanted);
  playable.add(bassNote);

  const found = [];

  for (let base = 0; base + MAX_SPAN - 1 <= HIGHEST_FRET; base++) {
    const options = [];
    for (let s = 0; s < STRINGS; s++) {
      const list = [null];
      const lo = base === 0 ? 0 : base;
      for (let f = lo; f < lo + MAX_SPAN; f++) {
        if (f > HIGHEST_FRET) break;
        if (playable.has((TUNING[s] + f) % 12)) list.push(f);
      }
      if (base > 0 && playable.has(TUNING[s] % 12)) list.push(0);
      options.push(list);
    }

    // Sounding strings must be contiguous: a muted string in the middle of the
    // shape is a damping technique, not something to put in front of a learner.
    const walk = (s, frets) => {
      if (s === STRINGS) {
        const sounding = [];
        for (let i = 0; i < STRINGS; i++) if (frets[i] !== null) sounding.push(i);
        if (sounding.length < (quality === '5' ? 2 : 3)) return;
        if (sounding[sounding.length - 1] - sounding[0] + 1 !== sounding.length) return;

        if ((TUNING[sounding[0]] + frets[sounding[0]]) % 12 !== bassNote) return;

        const pcs = new Set(sounding.map((i) => (TUNING[i] + frets[i]) % 12));
        for (const need of mustHave) if (!pcs.has(need)) return;
        // Only the bass may sit outside the chord, and only once.
        for (const pc of pcs) if (!wanted.has(pc) && pc !== bassNote) return;

        const play = playability(frets);
        if (!play) return;

        found.push({ frets: frets.slice(), ...play, sounding, pcs: pcs.size });
        return;
      }
      for (const f of options[s]) {
        frets[s] = f;
        walk(s + 1, frets);
      }
      frets[s] = null;
    };
    walk(0, new Array(STRINGS).fill(null));
  }

  for (const v of found) {
    const fretted = v.frets.filter((f) => f !== null && f > 0);
    const low = fretted.length ? Math.min(...fretted) : 0;
    const high = fretted.length ? Math.max(...fretted) : 0;
    v.baseFret = low <= 1 ? 1 : low;
    v.position = low;

    // A stretch across frets is what actually makes a shape hard, so it weighs
    // more than anything else. Muting the top string is penalised far harder
    // than muting the bottom one: a thumb rests on the low E anyway, while
    // silencing the high E mid-strum is awkward and thins the chord out.
    const mutedLow = v.sounding[0];
    const mutedHigh = STRINGS - 1 - v.sounding[v.sounding.length - 1];

    v.score = (high - low) * 8
      + low * 4
      + (v.barre ? 4 : 0)
      + mutedLow * 2
      + mutedHigh * 12
      + fretted.length
      - v.pcs * 5;
  }

  found.sort((a, b) => a.score - b.score);

  // One shape per neck position: five ways to finger the same fret is noise.
  const out = [];
  const seenPos = new Set();
  const seenShape = new Set();
  for (const v of found) {
    const key = v.frets.join(',');
    if (seenShape.has(key) || seenPos.has(v.position)) continue;
    seenShape.add(key);
    seenPos.add(v.position);
    out.push({ frets: v.frets, barre: v.barre, baseFret: v.baseFret, position: v.position });
    if (out.length >= limit) break;
  }
  return out;
}

const cache = new Map();

/**
 * Every fingering for a chord symbol, cached. Empty array if unparseable.
 *
 * Three layers, in the order a player would think of them: the open shape they
 * learned first, then the movable forms up the neck, then whatever else the
 * search can find for positions the first two do not reach.
 */
export function fingeringsFor(symbol) {
  const parsed = parseChord(symbol);
  if (!parsed) return [];
  const key = chordName(parsed);
  if (cache.has(key)) return cache.get(key);

  const out = [];
  const seen = new Set();
  const add = (v) => {
    const k = v.frets.join(',');
    if (seen.has(k)) return;
    seen.add(k);
    out.push(v);
  };

  // Slash chords have no canonical form — the bass decides the shape.
  if (parsed.bass === null) {
    const open = OPEN_ONLY[NOTES[parsed.root] + parsed.quality];
    if (open) {
      const fretted = open.filter((f) => f !== null && f > 0);
      const low = fretted.length ? Math.min(...fretted) : 0;
      const play = playability(open);
      add({ frets: open, barre: play ? play.barre : null, baseFret: low <= 1 ? 1 : low, position: low, canonical: true });
    }
    for (const s of canonicalShapes(parsed.root, parsed.quality).sort((a, b) => a.position - b.position)) {
      add(s);
    }
  }

  for (const v of voicings(parsed, 12)) {
    if (out.length >= 8) break;
    if (out.some((o) => o.position === v.position)) continue;
    add(v);
  }

  out.sort((a, b) => (b.canonical ? 1 : 0) - (a.canonical ? 1 : 0) || a.position - b.position);
  const result = out.slice(0, 8);
  cache.set(key, result);
  return result;
}

/** The notes a chord is built from, for display under the diagram. */
export function chordNotes(symbol) {
  const parsed = parseChord(symbol);
  if (!parsed) return [];
  const spec = QUALITIES[parsed.quality];
  const seen = new Set();
  const out = [];
  for (const s of spec.steps) {
    const pc = (parsed.root + s) % 12;
    if (!seen.has(pc)) { seen.add(pc); out.push(NOTES[pc]); }
  }
  return out;
}

/**
 * One fingering, in the shape the diagram component expects.
 *
 * `variant` picks among the positions up the neck; it wraps, so a component
 * stepping through them never has to bounds-check. Unknown symbols return null
 * rather than a guess — an approximate shape drawn without warning is worse
 * than an honest gap.
 */
export function findFingering(symbol, variant = 0) {
  const parsed = parseChord(symbol);
  if (!parsed) return null;

  const all = fingeringsFor(symbol);
  if (!all.length) return null;

  const spec = QUALITIES[parsed.quality];
  const index = ((variant % all.length) + all.length) % all.length;

  return {
    ...all[index],
    name: chordName(parsed),
    qualityKey: spec?.labelKey || null,
    formula: spec?.formula || null,
    variant: index,
    variants: all.length
  };
}

/** How many positions exist for a symbol, for a variant picker. */
export function variantCount(symbol) {
  return fingeringsFor(symbol).length;
}

/**
 * The qualities worth putting on the reference page.
 *
 * All 27 are generated on demand, but a page listing every one of them for
 * every root is 324 diagrams — a dump, not a reference. These are the ones that
 * turn up in the songs here.
 */
export const COMMON_QUALITIES = [
  '', 'm', '7', 'm7', 'maj7', 'sus2', 'sus4', '6', 'm6', 'add9', 'dim', 'aug', '9', '5'
];

/** Every chord symbol on the reference page, grouped by root. */
export const CATALOGUE = NOTES.flatMap((root) => COMMON_QUALITIES.map((q) => root + q));

/**
 * Which finger presses which string, 1 = index to 4 = little.
 *
 * A barre is always the index finger, and the rest fall in order up the neck —
 * the way a hand naturally lands rather than the way a chart is drawn. Open and
 * muted strings get null.
 */
export function fingerNumbers({ frets, barre }) {
  const out = frets.map(() => null);

  const rest = [];
  frets.forEach((fret, i) => {
    if (fret === null || fret === 0) return;
    if (barre && fret === barre.fret && i >= barre.from && i <= barre.to) out[i] = 1;
    else rest.push({ fret, i });
  });

  rest.sort((a, b) => a.fret - b.fret || a.i - b.i);
  let next = barre ? 2 : 1;
  for (const { i } of rest) out[i] = next <= 4 ? next++ : 4;

  return out;
}
