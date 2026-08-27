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
  ok(back === sounding, `${sounding} @ capo ${fret}: oblik ${shape} +${fret} = ${back}`);
  checked++;
}
console.log(`  invarijanta provjerena na ${checked} kombinacija`);

// ── 2. Klasicni slucajevi iz prakse ──────────────────────────────────────────
const CLASSIC = [
  ['F',   1, 'E'  ],   // F barre -> E open, capo 1
  ['Hm',  2, 'Am' ],   // Bm barre -> Am open, capo 2
  ['D#',  1, 'D'  ],   // Eb -> D, capo 1
  ['C#m', 4, 'Am' ],   // C#m -> Am, capo 4
  ['A#',  3, 'G'  ],   // Bb -> G, capo 3
  ['G',   0, 'G'  ],   // vec otvoren
  ['E',   4, 'C'  ],   // E -> C, capo 4
  ['Fm',  1, 'Em' ]
];
for (const [sounding, fret, expected] of CLASSIC) {
  const got = shapeFor(sounding, fret);
  ok(got === expected, `${sounding} + capo ${fret} -> ocekivano ${expected}, dobijeno ${got}`);
}
console.log('  klasicni slucajevi: ' + CLASSIC.map(([s,f,e]) => `${s}/capo${f}=${e}`).join('  '));

// ── 3. Ocjena lakoce ─────────────────────────────────────────────────────────
ok(shapeEase('Am') === 2, 'Am je otvoren');
ok(shapeEase('G')  === 2, 'G je otvoren');
ok(shapeEase('H7') === 2, 'H7 je otvoren iako H dur nije');
ok(shapeEase('F')  === 1, 'F je jedna barre');
ok(shapeEase('Hm') === 1, 'Hm je jedna barre');
ok(shapeEase('D#m')=== 0, 'D#m je nezgodan');
ok(shapeEase('H')  === 0, 'H dur je barre');

// ── 4. Pjesma u F: kapodaster mora pomoci ────────────────────────────────────
const inF = '[F]a [A#]b [C]c [Dm]d';
const f0 = easeAt(['F','A#','C','Dm'], 0);
const f1 = easeAt(['F','A#','C','Dm'], 1);
const f3 = easeAt(['F','A#','C','Dm'], 3);
const f5 = easeAt(['F','A#','C','Dm'], 5);
// Pravilo iz prakse "F -> capo 1, sviraj E oblike" daje E A H C#m: H dur je
// barre a C#m jos gori. Ocjena to mora uhvatiti i ponuditi D odnosno C oblike.
ok(f1 < f0, `capo 1 na F-dur (${f1}%) je gori od capo 0 (${f0}%) — H i C#m su barre`);
ok(f3 === f5, `capo 3 (D oblici, ${f3}%) i capo 5 (C oblici, ${f5}%) su jednako laki`);
const best = suggestions(inF)[0];
ok(best.fret === 3 && best.ease === 88,
   `najbolji za F-dur: ${best.fret}. polje ${best.ease}% (${best.shapes.join(' ')}) — nizi prag pri neodluceno`);
console.log(`  F-dur: capo0=${f0}%  capo1=${f1}%  capo3=${f3}%  capo5=${f5}%  -> bira ${best.fret}. polje: ${best.shapes.join(' ')}`);

// ── 5. Pjesma vec u otvorenim akordima ───────────────────────────────────────
const openSong = '[Am]a [Dm]b [E]c';
const s = suggestions(openSong)[0];
ok(s.fret === 0 && s.ease === 100, `Am/Dm/E vec otvoreno -> ${s.fret}. polje ${s.ease}%`);

// ── 6. Transpose i kapodaster su nezavisni ───────────────────────────────────
// Pjesma u Am, transponovana +2 (zvuci Hm), kapodaster 2 -> oblici opet Am.
const sounding2 = transposeChord('Am', 2);
ok(sounding2 === 'Hm', 'Am +2 = Hm');
ok(shapeFor(sounding2, 2) === 'Am', 'Hm sa capo 2 se svira kao Am');
console.log(`  nezavisnost: Am --transpose+2--> ${sounding2} --capo2--> ${shapeFor(sounding2, 2)}`);

// ── 7. Redoslijed prijedloga ─────────────────────────────────────────────────
const list = suggestions('[F#]a [H]b [C#]c');
ok(list.length === MAX_CAPO + 1, 'ima ' + list.length + ' pozicija');
ok(list.every((x, i) => i === 0 || list[i-1].ease > x.ease || (list[i-1].ease === x.ease && list[i-1].fret < x.fret)),
   'sortirano po lakoci pa po nizem pragu');
console.log(`  F#/H/C#: ${list.slice(0,3).map(x => `${x.fret}.polje ${x.ease}% (${x.shapes.join(' ')})`).join('   ')}`);

console.log(`\n  ${pass} proslo, ${fail} palo`);
process.exit(fail ? 1 : 0);
