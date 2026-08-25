/**
 * Hands-free scrolling for playing along.
 *
 * Driven by requestAnimationFrame rather than a timer: at the speeds that are
 * actually useful here the page moves well under one pixel per frame, so an
 * interval stepping whole pixels would visibly stutter. The fractional
 * remainder is carried between frames and only whole pixels are applied, which
 * keeps slow speeds smooth and makes the rate independent of frame rate.
 */
export const MIN_SPEED = 1;
export const MAX_SPEED = 10;
export const DEFAULT_SPEED = 3;

const STORAGE_KEY = 'octava_scroll_speed';

/** Level 1 crawls for a slow ballad; level 10 keeps up with a fast verse. */
const pixelsPerSecond = (level) => level * 5;

const clamp = (value) =>
  Math.min(MAX_SPEED, Math.max(MIN_SPEED, Math.round(value) || DEFAULT_SPEED));

export function useAutoScroll() {
  const running = ref(false);
  const speed = useState('scroll-speed', () => DEFAULT_SPEED);

  let frame = null;
  let lastTime = null;
  let remainder = 0;
  let wakeLock = null;

  onMounted(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (saved) speed.value = clamp(saved);
  });

  const atBottom = () =>
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

  function tick(now) {
    if (lastTime === null) lastTime = now;
    const elapsed = (now - lastTime) / 1000;
    lastTime = now;

    const distance = pixelsPerSecond(speed.value) * elapsed + remainder;
    const whole = Math.floor(distance);
    remainder = distance - whole;

    if (whole > 0) window.scrollBy(0, whole);

    // Nothing left to scroll: stop rather than spin against the bottom.
    if (atBottom()) return stop();

    frame = requestAnimationFrame(tick);
  }

  /**
   * Wheel and touch are the honest signal of intent. Listening to 'scroll'
   * would fire on our own movement too, and telling the two apart by position
   * is fragile.
   */
  const onUserInput = () => stop();

  async function requestWakeLock() {
    // The whole point is that nobody touches the device while it plays, which
    // is exactly when the screen would dim. Unsupported browsers just carry on.
    try {
      wakeLock = await navigator.wakeLock?.request('screen');
    } catch {
      wakeLock = null;
    }
  }

  function start() {
    if (running.value) return;
    running.value = true;
    lastTime = null;
    remainder = 0;

    window.addEventListener('wheel', onUserInput, { passive: true });
    window.addEventListener('touchmove', onUserInput, { passive: true });
    requestWakeLock();

    frame = requestAnimationFrame(tick);
  }

  function stop() {
    running.value = false;
    if (frame) cancelAnimationFrame(frame);
    frame = null;

    window.removeEventListener('wheel', onUserInput);
    window.removeEventListener('touchmove', onUserInput);

    wakeLock?.release().catch(() => {});
    wakeLock = null;
  }

  const toggle = () => (running.value ? stop() : start());

  function setSpeed(level) {
    speed.value = clamp(level);
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, String(speed.value));
  }

  // Leaving the page mid-scroll must not leave a frame loop or a wake lock.
  onBeforeUnmount(stop);

  return {
    running,
    speed,
    toggle,
    stop,
    faster: () => setSpeed(speed.value + 1),
    slower: () => setSpeed(speed.value - 1),
    canGoFaster: computed(() => speed.value < MAX_SPEED),
    canGoSlower: computed(() => speed.value > MIN_SPEED)
  };
}
