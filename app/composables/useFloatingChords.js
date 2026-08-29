/**
 * Shared reactive state for the floating chords companion button.
 * Used to coordinate layout positioning between DancingChords and DancingMetronome.
 */
export function useFloatingChords() {
  const hasFloatingChords = useState('hasFloatingChords', () => false);
  return { hasFloatingChords };
}
