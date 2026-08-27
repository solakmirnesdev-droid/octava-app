/**
 * Stand-in portraits for users and artists with no photograph.
 *
 * Modern adaptive palette that looks stunning in both light and dark mode
 * using color-mix with transparency.
 */

const PALETTE = [
  '#3b82f6', // blue / cobalt
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1'  // indigo
];

/**
 * Up to two uppercase initials.
 * Bands keep their first two words ("Riblja Čorba" -> RČ) and single names
 * give one uppercase letter.
 */
export function initials(name) {
  if (!name) return '?';
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/**
 * A stable colour for a name.
 */
export function avatarColor(name) {
  let hash = 0;
  for (const ch of String(name || '')) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/**
 * Inline style for the fallback circle:
 * Uses color-mix with transparent so on light mode it is a subtle refined pastel tint,
 * and on dark mode it is a sleek translucent dark glowing badge with high contrast.
 */
export function avatarStyle(name) {
  const color = avatarColor(name);
  return {
    backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
    color: color,
    borderColor: `color-mix(in srgb, ${color} 38%, transparent)`
  };
}
