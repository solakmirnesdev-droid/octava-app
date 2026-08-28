/**
 * Sorting text the way a reader of this catalogue expects.
 *
 * AI-TRAP: `localeCompare(x, 'bs')` does not do it, and fails silently. Browsers
 * ship no Bosnian collation — `Intl.Collator.supportedLocalesOf(['bs'])` returns
 * an empty array and `new Intl.Collator('bs').resolvedOptions().locale` answers
 * "en-US" — so asking for Bosnian quietly gets you English, where Č, Ć, Š, Ž and
 * Đ sort *before* C, S and Z rather than after. "Čivas" then lands above "Coma"
 * and a reader scanning under Č never reaches it.
 *
 * Croatian is the stand-in: it is supported everywhere, and for collation the
 * two languages are the same alphabet. utils/countries.js already reached this
 * conclusion for display names; this is the same fallback applied to ordering.
 */
const CHAIN = ['hr', 'sr-Latn', 'bs'];

/** Built once — constructing a Collator per comparison is what makes sorts slow. */
let collator = null;

function get() {
  if (collator) return collator;
  try {
    collator = new Intl.Collator(CHAIN, { sensitivity: 'base', numeric: true });
  } catch {
    collator = { compare: (a, b) => String(a).localeCompare(String(b)) };
  }
  return collator;
}

/** Drop-in for `a.localeCompare(b)` wherever the text is in our alphabet. */
export function compareText(a, b) {
  return get().compare(String(a ?? ''), String(b ?? ''));
}
