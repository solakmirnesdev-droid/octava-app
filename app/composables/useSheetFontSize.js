/**
 * Reading size for the chord sheet, remembered between visits.
 *
 * Bounds are deliberate: below 12px the chord row above the lyric stops being
 * legible, and past 26px lines wrap hard enough on a phone that the shape of
 * the verse is lost. Anything outside that range is clamped rather than
 * refused, so a stale or hand-edited stored value cannot break the page.
 */
export const MIN_FONT_SIZE = 12;
export const MAX_FONT_SIZE = 26;
export const DEFAULT_FONT_SIZE = 15;

const STORAGE_KEY = 'octava_sheet_font';

const clamp = (value) =>
  Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(value) || DEFAULT_FONT_SIZE));

export function useSheetFontSize() {
  // Starts at the default on both sides of hydration; the stored preference is
  // applied after mount, since localStorage does not exist while rendering.
  const fontSize = useState('sheet-font-size', () => DEFAULT_FONT_SIZE);

  onMounted(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (saved) fontSize.value = clamp(saved);
  });

  function set(value) {
    fontSize.value = clamp(value);
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, String(fontSize.value));
  }

  return {
    fontSize,
    grow: () => set(fontSize.value + 1),
    shrink: () => set(fontSize.value - 1),
    reset: () => set(DEFAULT_FONT_SIZE),
    canGrow: computed(() => fontSize.value < MAX_FONT_SIZE),
    canShrink: computed(() => fontSize.value > MIN_FONT_SIZE),
    isDefault: computed(() => fontSize.value === DEFAULT_FONT_SIZE)
  };
}
