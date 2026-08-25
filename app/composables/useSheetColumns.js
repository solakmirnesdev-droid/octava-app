/**
 * Two-column reading, remembered between visits.
 *
 * Only offered from the large breakpoint up. A monospace chord sheet needs the
 * full width of a phone for one column; splitting it there would wrap every
 * line and destroy the alignment the whole format depends on.
 */
const STORAGE_KEY = 'octava_sheet_columns';

export function useSheetColumns() {
  const columns = useState('sheet-columns', () => false);
  // Server render cannot know the viewport, so the toggle is hidden until the
  // client has measured it. Guessing would mean a layout shift on load.
  const wideEnough = useState('sheet-wide', () => false);

  let media = null;
  const sync = () => { wideEnough.value = media.matches; };

  onMounted(() => {
    columns.value = localStorage.getItem(STORAGE_KEY) === '1';

    media = window.matchMedia('(min-width: 1024px)');
    sync();
    media.addEventListener('change', sync);
  });

  onBeforeUnmount(() => media?.removeEventListener('change', sync));

  function toggle() {
    columns.value = !columns.value;
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, columns.value ? '1' : '0');
  }

  // The sheet only actually splits when both the preference and the room exist.
  const active = computed(() => columns.value && wideEnough.value);

  return { columns, wideEnough, active, toggle };
}
