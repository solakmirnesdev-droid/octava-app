/**
 * Whether this bundle is running inside a native shell, and the token it needs
 * when it is.
 *
 * AI-DECISION: the web build keeps the httpOnly session cookie and changes in
 * no way. Cookies are the better mechanism where they work — a token in
 * localStorage is readable by any script that gets in, and the cookie is not.
 * They stop working in a Capacitor WebView: the page is served from
 * capacitor://localhost (iOS) or http://localhost (Android) while the API is on
 * a real domain, which makes the session cookie third-party, and iOS blocks
 * those outright. So native falls back to a bearer token and only native does.
 *
 * The API already accepts either — src/middleware/auth.js reads the
 * Authorization header first and the cookie second — so nothing on the server
 * has to change for this.
 */

const KEY = 'octava_token';

/**
 * AI-TRAP: detected at runtime, not baked in at build time. The same bundle is
 * loaded by `nuxt dev` in a browser while the native shell is being built, and
 * a build-time constant would have the browser reaching for a token it never
 * stored while its cookie sat there working.
 */
export function isNative() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Capacitor?.isNativePlatform?.())
    || window.location.protocol === 'capacitor:';
}

export function readToken() {
  if (!isNative()) return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    // A WebView with storage disabled: the request goes out unauthenticated and
    // the API answers 401, which is the same as being signed out.
    return null;
  }
}

export function writeToken(token) {
  if (!isNative()) return;
  try {
    if (token) window.localStorage.setItem(KEY, token);
    else window.localStorage.removeItem(KEY);
  } catch { /* nothing to do; the session simply will not survive a restart */ }
}

export const clearToken = () => writeToken(null);
