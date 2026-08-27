/**
 * A short message that outlives a navigation.
 *
 * AI-DECISION: signing out used to blank the header and drop you on the home
 * page with nothing said about it. On a site where being signed in mostly means
 * a heart is filled in, that is indistinguishable from a page that reloaded —
 * people were not sure whether it had worked. A notice that survives the
 * redirect is the smallest honest answer. See AI-NOTES.md §5.
 *
 * useState rather than a module-level ref: a module-level one is shared between
 * requests on the server and would show one visitor's message to the next.
 */
export function useNotice() {
  const notice = useState('notice', () => null);

  /** `tone` is 'ok' or 'info'; anything else is treated as info. */
  const say = (message, tone = 'ok') => {
    notice.value = message ? { message, tone: tone === 'ok' ? 'ok' : 'info', at: Date.now() } : null;
  };

  const clear = () => { notice.value = null; };

  return { notice, say, clear };
}
