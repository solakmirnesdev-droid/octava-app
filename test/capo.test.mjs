import { transposeChord, extractChords } from '../app/utils/chordpro.js';
import { shapeFor, shapeEase, easeAt, suggestions, MAX_CAPO } from '../app/utils/capo.js';

let pass = 0, fail = 0;
const ok = (c, m) => c ? (pass++, 0) : (fail++, console.log('  FAIL  ' + m));

// ── 1. The invariant: shape + capo === sounding, always ──────────────────────
const ALL = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','H'];
const QUAL = ['', 'm', '7', 'm7', 'maj7', 'sus4', 'dim'];
let checked = 0;
for (const root of ALL) for (const q of QUAL) for (let fret = 0; fret <= MAX_CAPO; fret++) {
  const sounding = transposeChord(root + q, 0);          // normalized spelling
  const shape = shapeFor(sounding, fret);
  const back = transposeChord(shape, fret);
  ok(back === sounding, `${sounding} @ capo ${fret}: shape ${shape} +${fret} = ${back}`);
  checked++;
}
console.log(`  invariant checked across ${checked} combinations`);

// ── 2. Classic real-world cases ──────────────────────────────────────────────
const CLASSIC = [
  ['F',   1, 'E'  ],   // F barre -> E open, capo 1
  ['Hm',  2, 'Am' ],   // Hm barre -> Am open, capo 2
  ['D#',  1, 'D'  ],   // D# -> D, capo 1
  ['C#m', 4, 'Am' ],   // C#m -> Am, capo 4
  ['A#',  3, 'G'  ],   // A# -> G, capo 3
  ['G',   0, 'G'  ],   // already open
  ['E',   4, 'C'  ],   // E -> C, capo 4
  ['Fm',  1, 'Em' ]
];
for (const [sounding, fret, expected] of CLASSIC) {
  const got = shapeFor(sounding, fret);
  ok(got === expected, `${sounding} + capo ${fret} -> expected ${expected}, got ${got}`);
}
console.log('  classic cases: ' + CLASSIC.map(([s,f,e]) => `${s}/capo${f}=${e}`).join('  '));

// ── 3. Ease rating ───────────────────────────────────────────────────────────
ok(shapeEase('Am') === 2, 'Am is open');
ok(shapeEase('G')  === 2, 'G is open');
ok(shapeEase('H7') === 2, 'H7 is open even though H major is not');
ok(shapeEase('F')  === 1, 'F is a single barre');
ok(shapeEase('Hm') === 1, 'Hm is a single barre');
ok(shapeEase('D#m')=== 0, 'D#m is awkward');
ok(shapeEase('H')  === 0, 'H major is a barre');

// ── 4. Song in F: the capo has to help ───────────────────────────────────────
const inF = '[F]a [A#]b [C]c [Dm]d';
const f0 = easeAt(['F','A#','C','Dm'], 0);
const f1 = easeAt(['F','A#','C','Dm'], 1);
const f3 = easeAt(['F','A#','C','Dm'], 3);
const f5 = easeAt(['F','A#','C','Dm'], 5);
// The rule of thumb "F -> capo 1, play E shapes" gives E A H C#m: H major is a
// barre and C#m is worse still. The rating has to catch that and offer D or C
// shapes instead.
ok(f1 < f0, `capo 1 on F major (${f1}%) is worse than capo 0 (${f0}%) — H and C#m are barres`);
ok(f3 === f5, `capo 3 (D shapes, ${f3}%) and capo 5 (C shapes, ${f5}%) are equally easy`);
const best = suggestions(inF)[0];
ok(best.fret === 3 && best.ease === 88,
   `best for F major: fret ${best.fret} at ${best.ease}% (${best.shapes.join(' ')}) — lower fret wins ties`);
console.log(`  F major: capo0=${f0}%  capo1=${f1}%  capo3=${f3}%  capo5=${f5}%  -> picks fret ${best.fret}: ${best.shapes.join(' ')}`);

// ── 5. Song already in open chords ───────────────────────────────────────────
const openSong = '[Am]a [Dm]b [E]c';
const s = suggestions(openSong)[0];
ok(s.fret === 0 && s.ease === 100, `Am/Dm/E already open -> fret ${s.fret} at ${s.ease}%`);

// ── 6. Transpose and capo are independent ────────────────────────────────────
// Song in Am, transposed +2 (sounds Hm), capo 2 -> shapes are Am again.
const sounding2 = transposeChord('Am', 2);
ok(sounding2 === 'Hm', 'Am +2 = Hm');
ok(shapeFor(sounding2, 2) === 'Am', 'Hm with capo 2 is played as Am');
console.log(`  independence: Am --transpose+2--> ${sounding2} --capo2--> ${shapeFor(sounding2, 2)}`);

// ── 7. Suggestion order ──────────────────────────────────────────────────────
const list = suggestions('[F#]a [H]b [C#]c');
ok(list.length === MAX_CAPO + 1, 'has ' + list.length + ' positions');
ok(list.every((x, i) => i === 0 || list[i-1].ease > x.ease || (list[i-1].ease === x.ease && list[i-1].fret < x.fret)),
   'sorted by ease, then by lower fret');
console.log(`  F#/H/C#: ${list.slice(0,3).map(x => `fret ${x.fret} ${x.ease}% (${x.shapes.join(' ')})`).join('   ')}`);

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
