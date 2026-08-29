import { isNative } from '~/utils/native';

/**
 * Marks the document when the app is running inside a native shell.
 *
 * AI-DECISION: a marker on <html> rather than a build-time flag, so the safe
 * area rules in main.css can be scoped to the shell and cost the website
 * nothing. env(safe-area-inset-*) is zero in a browser, so applying it
 * unconditionally would be harmless today and wrong the moment a desktop
 * browser starts reporting one.
 */
export default defineNuxtPlugin(() => {
  if (isNative()) document.documentElement.dataset.native = 'true';
});
