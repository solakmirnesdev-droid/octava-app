/**
 * The reader's colour scheme choice.
 *
 * Three states, not two. "System" is a real preference — someone whose laptop
 * turns dark at sunset wants this site to do the same, and a plain on/off
 * switch throws that away the first time they touch it.
 *
 * AI-NOTE: the CSS does the actual work. `main.css` sets `color-scheme:
 * light dark` on :root, so with no attribute at all the operating system
 * decides and every `light-dark()` token follows. This composable only pins it
 * when the reader overrides that, which is why "system" *removes* the attribute
 * rather than writing a third value.
 */

export const THEME_KEY = 'octava-theme';
export const THEMES = ['system', 'light', 'dark'];

export function useTheme() {
  // Default to dark mode
  const mode = useState(THEME_KEY, () => 'dark');

  const apply = (value, animate) => {
    const el = document.documentElement;

    if (animate) el.classList.add('theme-switching');
    if (value === 'system') el.setAttribute('data-theme', 'dark');
    else el.setAttribute('data-theme', value);

    if (animate) {
      window.setTimeout(() => el.classList.remove('theme-switching'), 200);
    }
  };

  const set = (value) => {
    if (!THEMES.includes(value)) return;
    mode.value = value;

    try {
      if (value === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, value);
    } catch {
      // Private browsing can refuse storage. The choice still applies for this
      // page; it simply will not survive a reload.
    }

    apply(value, true);
  };

  /** Steps through the three states, for a single-button control. */
  const cycle = () => set(THEMES[(THEMES.indexOf(mode.value) + 1) % THEMES.length]);

  onMounted(() => {
    // The inline script in app.vue has already set the attribute before paint;
    // this only brings the Vue side into agreement with it.
    try {
      const stored = localStorage.getItem(THEME_KEY) || 'dark';
      if (THEMES.includes(stored)) mode.value = stored;
      else apply('dark', false);
    } catch {
      // ignored, as above
    }
  });

  return { mode, set, cycle };
}
