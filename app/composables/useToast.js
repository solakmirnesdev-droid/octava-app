/**
 * Toast notifications for user actions (e.g. saving a song or artist).
 *
 * AI-DECISION: uses useState rather than a global module-level ref so state
 * is isolated per SSR request while being reactive across all components on client.
 */
export function useToast() {
  const toast = useState('app_toast', () => null);

  let timer = null;

  function show({
    title,
    artistName = '',
    artistId = '',
    hasImage = false,
    message = '',
    type = 'song',
    duration = 4000
  }) {
    toast.value = {
      id: Date.now(),
      title,
      artistName,
      artistId,
      hasImage,
      message,
      type
    };

    if (import.meta.client) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        toast.value = null;
      }, duration);
    }
  }

  function dismiss() {
    toast.value = null;
  }

  return { toast, show, dismiss };
}
