/**
 * Two-column reading by default on wide screens (>= 1024px).
 *
 * A monospace chord sheet needs the full width of a phone/tablet for one column,
 * and automatically splits into 2 columns on desktop screens (>= 1024px) for optimal
 * reading without excessive vertical scrolling.
 */
export function useSheetColumns() {
  const wideEnough = useState('sheet-wide', () => false);

  let media = null;
  const sync = () => {
    if (media) wideEnough.value = media.matches;
  };

  onMounted(() => {
    media = window.matchMedia('(min-width: 768px)');
    sync();
    media.addEventListener('change', sync);
  });

  onBeforeUnmount(() => {
    media?.removeEventListener('change', sync);
  });

  // Always active by default whenever the viewport is wide enough (>= 768px)
  const active = computed(() => wideEnough.value);

  return { wideEnough, active };
}
