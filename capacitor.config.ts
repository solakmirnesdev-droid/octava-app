import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Sits here unused until `npm i -D @capacitor/cli @capacitor/core` and
 * `npx cap add ios|android` are run. Nothing reads it before that.
 *
 * AI-TRAP: webDir points at what `npm run build:native` produces, which is
 * .output/public — not dist/, and not .output/. `nuxt generate` writes the
 * static bundle one level deeper than people expect, and pointing Capacitor at
 * the parent copies a server build into the app that will never run.
 */
const config: CapacitorConfig = {
  appId: 'ba.octava.app',
  appName: 'Octava',
  webDir: '.output/public',

  server: {
    /*
     * Android serves the bundle over http://localhost, iOS over
     * capacitor://localhost. Both are origins the API has never heard of, so
     * whichever is in use has to be listed in the backend's CORS_ORIGIN or
     * every request is refused before it is read.
     */
    androidScheme: 'https'
  },

  ios: {
    // The chord sheet is a document; a rubber-band bounce reads as a bug on it.
    scrollEnabled: true,
    contentInset: 'always'
  }
};

export default config;
