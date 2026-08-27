/**
 * Capo mathematics.
 *
 * A capo clamps every string at one fret, so it raises all six open strings by
 * the same interval. Fingering a shape with a capo at fret F sounds F semitones
 * above the same shape played open:
 *
 *     sounding = shape + capo          shape = sounding - capo
 *
 * AI-DECISION: moving the capo must never change what the song sounds like.
 * That is the whole point of the control — the singer's key is fixed and the
 * guitarist only wants easier shapes. A capo that transposed the sounding pitch
 * would be a second, worse copy of the transpose control. So the two axes are
 * strictly independent:
 *
 *     sounding = originalKey + semitones           (capo plays no part)
 *     displayed shape = sounding - capo
 *
 * See AI-NOTES.md §5.
 *
 * AI-TRAP: the chords stored in a song's content are the SOUNDING chords, and
 * `originalKey` names the sounding key — in all 292 songs that carry a capo
 * value, `originalKey` equals the written root. The arrangement's own `capo`
 * field is therefore only a suggestion for where to put it, never an offset
 * already baked into the symbols. Treating it as baked in would silently
 * falsify every one of those key labels.
 */
import { transposeChord, extractChords } from './chordpro.js';

/** Past this the frets crowd together and the guitar starts sounding thin. */
export const MAX_CAPO = 7;

/**
 * Shapes a hand finds in open position.
 *
 * Pitch classes, ex-Yugoslav notation: 0=C, 2=D, 4=E, 7=G, 9=A, 11=H.
 * These are the CAGED majors plus the three open minors — the vocabulary a
 * player has before they own a barre.
 */
const OPEN_MAJOR = [0, 2, 4, 7, 9];       // C  D  E  G  A
const OPEN_MINOR = [2, 4, 9];             // Dm Em Am
/** Dominant sevenths add H7, which is open even though H major is not. */
const OPEN_DOM7 = [0, 2, 4, 7, 9, 11];    // C7 D7 E7 G7 A7 H7
const OPEN_MIN7 = [2, 4, 9];              // Dm7 Em7 Am7

/** One barre each, and the two most players already have under their fingers. */
const NEAR_MAJOR = [5];                   // F
const NEAR_MINOR = [11];                  // Hm

const SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H'];

/** Pitch class of a chord root, or -1. Mirrors chordpro's input tolerance. */
function rootOf(symbol) {
  const m = /^([A-H])([#b]?)/.exec(String(symbol).trim());
  if (!m) return -1;
  const [, letter, accidental] = m;
  if (letter === 'H') return 11;
  if (letter === 'B') return accidental === 'b' ? 10 : 11;
  let base = SCALE.indexOf(letter);
  if (base === -1) return -1;
  if (accidental === '#') base += 1;
  else if (accidental === 'b') base -= 1;
  return ((base % 12) + 12) % 12;
}

/** Quality, coarse enough to score playability and no finer. */
function qualityOf(symbol) {
  const suffix = String(symbol).trim().replace(/^[A-H][#b]?/, '').split('/')[0];
  const minor = /^(m|min)(?!aj)/.test(suffix);
  const seventh = /(^|[^0-9])7/.test(suffix) && !/maj7|Δ/.test(suffix);
  if (minor) return seventh ? 'min7' : 'minor';
  if (seventh) return 'dom7';
  return 'major';
}

/**
 * How hard one chord shape is: 2 open, 1 one-barre, 0 awkward.
 *
 * Slash bass is ignored deliberately — an alternate bass rarely changes whether
 * the left hand can make the shape at all, which is what this is measuring.
 */
export function shapeEase(symbol) {
  const root = rootOf(symbol);
  if (root === -1) return 0;

  const quality = qualityOf(symbol);
  const open = { major: OPEN_MAJOR, minor: OPEN_MINOR, dom7: OPEN_DOM7, min7: OPEN_MIN7 }[quality];
  if (open.includes(root)) return 2;

  const near = quality === 'minor' || quality === 'min7' ? NEAR_MINOR : NEAR_MAJOR;
  return near.includes(root) ? 1 : 0;
}

/** The shape you finger to sound `symbol` with the capo at `fret`. */
export function shapeFor(symbol, fret) {
  return transposeChord(symbol, -fret);
}

/**
 * Score a whole song's shape set at one capo position, 0-100.
 *
 * Distinct chords, not weighted by how often each occurs: one awkward shape in
 * a song is one awkward shape whether it lands twice or twenty times, and the
 * player has to learn it either way.
 */
export function easeAt(soundingChords, fret) {
  const chords = [...new Set(soundingChords)];
  if (!chords.length) return 0;
  const total = chords.reduce((sum, c) => sum + shapeEase(shapeFor(c, fret)), 0);
  return Math.round((total / (chords.length * 2)) * 100);
}

/**
 * Every capo position worth offering, easiest first.
 *
 * Ties break toward the lower fret: two positions that play equally well are
 * not equal in practice, since a capo high up shortens the neck and thins the
 * tone. Fret 0 is always included — for a song already in open shapes, no capo
 * is the right answer and the list should be able to say so.
 */
export function suggestions(content, semitones = 0) {
  const sounding = extractChords(content).map((c) => transposeChord(c, semitones));
  if (!sounding.length) return [];

  return Array.from({ length: MAX_CAPO + 1 }, (_, fret) => ({
    fret,
    ease: easeAt(sounding, fret),
    shapes: [...new Set(sounding.map((c) => shapeFor(c, fret)))]
  })).sort((a, b) => b.ease - a.ease || a.fret - b.fret);
}
