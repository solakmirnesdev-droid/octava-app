/**
 * Countries, named in whichever language the reader is using.
 *
 * AI-DECISION: the names come from Intl.DisplayNames rather than a table in the
 * repo. A hand-written list would need translating twice and would drift the
 * first time a country is renamed — "Sjeverna Makedonija" is exactly the kind of
 * thing a static list gets wrong for years. Only the codes live here.
 */

/**
 * The region opens with where this site's readers actually are.
 *
 * Not a value judgement about the rest — an alphabetical list that opens with
 * Afganistan makes the six countries almost everyone here will pick the six
 * hardest to reach.
 */
export const NEARBY = ['BA', 'HR', 'RS', 'ME', 'MK', 'SI'];

/** ISO 3166-1 alpha-2, minus the codes Intl has no name for. */
const CODES = [
  'AD', 'AE', 'AF', 'AG', 'AL', 'AM', 'AO', 'AR', 'AT', 'AU', 'AZ', 'BA', 'BB', 'BD', 'BE',
  'BF', 'BG', 'BH', 'BI', 'BJ', 'BN', 'BO', 'BR', 'BS', 'BT', 'BW', 'BY', 'BZ', 'CA', 'CD',
  'CF', 'CG', 'CH', 'CI', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CY', 'CZ', 'DE', 'DJ',
  'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FR', 'GA', 'GB',
  'GD', 'GE', 'GH', 'GM', 'GN', 'GQ', 'GR', 'GT', 'GW', 'GY', 'HN', 'HR', 'HT', 'HU', 'ID',
  'IE', 'IL', 'IN', 'IQ', 'IR', 'IS', 'IT', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM',
  'KP', 'KR', 'KW', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
  'MA', 'MC', 'MD', 'ME', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MR', 'MT', 'MU', 'MV', 'MW',
  'MX', 'MY', 'MZ', 'NA', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NZ', 'OM', 'PA', 'PE',
  'PG', 'PH', 'PK', 'PL', 'PS', 'PT', 'PW', 'PY', 'QA', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB',
  'SC', 'SD', 'SE', 'SG', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SY',
  'SZ', 'TD', 'TG', 'TH', 'TJ', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA',
  'UG', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VN', 'VU', 'WS', 'XK', 'YE', 'ZA', 'ZM', 'ZW'
];

/**
 * Countries that no longer exist, which the catalogue is full of.
 *
 * AI-TRAP: `Intl.DisplayNames.of('YU')` returns "Serbia" — the standard maps the
 * defunct code onto its successor state. Six artists here are coded YU because
 * that is what MusicBrainz holds for a Yugoslav-era release, and left alone they
 * would appear as a second pill also labelled "Srbija", beside the 43 genuinely
 * coded RS. Two pills with one name, and the name wrong on one of them.
 *
 * They also have no flag: 🇾🇺 is a valid pair of regional indicators that no font
 * draws, so it renders as two letters in boxes. `flagOf` returns null for these.
 */
export const HISTORIC = {
  YU: { bs: 'Jugoslavija', en: 'Yugoslavia' },
  CS: { bs: 'Srbija i Crna Gora', en: 'Serbia and Montenegro' },
  SU: { bs: 'Sovjetski Savez', en: 'Soviet Union' },
  DD: { bs: 'Istočna Njemačka', en: 'East Germany' }
};

/**
 * Regional indicator symbols sit at a fixed offset from A-Z, so BA becomes the
 * two code points a font renders as one flag.
 */
export function flagOf(code) {
  if (!code || code.length !== 2) return null;
  const upper = code.toUpperCase();
  // A code with no state behind it has no flag to draw.
  if (HISTORIC[upper]) return null;
  return String.fromCodePoint(...[...upper].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function safeFlag(flag, country) {
  if (country && HISTORIC[country.toUpperCase()]) return null;
  if (!flag) return country ? flagOf(country) : null;
  if (flag.includes('\uD83C\uDDFE\uD83C\uDDFA') || flag.includes('YU')) return null;
  return flag;
}

/**
 * Where Bosnian and Croatian genuinely part ways.
 *
 * Small on purpose. This is not a translation table — it is the handful of
 * names that would read as foreign, patched over an otherwise correct source.
 */
const BS_OVERRIDES = {
  NL: 'Holandija',
  CH: 'Švajcarska',
  US: 'Sjedinjene Države',
  ES: 'Španija',
  GR: 'Grčka',
  DK: 'Danska'
};

const PROBES = ['DE', 'BA', 'SE'];
const FALLBACKS = { bs: ['bs', 'hr', 'en'], en: ['en'] };

function looksTranslated(display, english) {
  // If not one probe differs from English, there is no data behind this locale.
  return PROBES.some((code) => display.of(code) !== english.of(code));
}

function namerFor(locale) {
  let english;
  try {
    english = new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return (code) => code;
  }

  const chain = FALLBACKS[locale] || [locale, 'en'];
  for (const candidate of chain) {
    try {
      const display = new Intl.DisplayNames([candidate], { type: 'region' });
      if (candidate === 'en' || looksTranslated(display, english)) {
        const overrides = locale === 'bs' ? BS_OVERRIDES : {};
        return (code) => overrides[code] || display.of(code) || code;
      }
    } catch {
      // Try the next one down the chain.
    }
  }

  return (code) => code;
}

/**
 * Every country, nearby ones first, the rest sorted by their name in `locale`.
 *
 * AI-TRAP: sorted with localeCompare, not with a plain comparison. "Švedska"
 * and "Srbija" order wrongly under the default one, which puts every accented
 * name at the end of the list where nobody looks for it.
 */
export function countries(locale = 'bs') {
  const name = namerFor(locale);

  const near = NEARBY.map((code) => ({ code, name: name(code), flag: flagOf(code), nearby: true }));
  const rest = CODES
    .filter((code) => !NEARBY.includes(code))
    .map((code) => ({ code, name: name(code), flag: flagOf(code), nearby: false }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  return [...near, ...rest];
}

/** One country's name, for showing a stored code back to the reader. */
export function countryName(code, locale = 'bs') {
  if (!code) return null;
  const upper = code.toUpperCase();
  const historic = HISTORIC[upper];
  if (historic) return historic[locale] || historic.en;
  return namerFor(locale)(upper);
}
