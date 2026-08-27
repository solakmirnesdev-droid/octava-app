<script setup>
/**
 * Language metadata for the whole app.
 *
 * Sets the html lang attribute per locale and emits the hreflang links that
 * tell a search engine the two versions are the same site in two languages
 * rather than duplicate content competing with each other. Without these the
 * split into /en is just two unrelated sites.
 */
const head = useLocaleHead();

/**
 * A fallback share card for the whole site. Song pages replace it with their
 * own; everything else — the home page, the listings, the tuner — would
 * otherwise paste into a chat as a bare line of text.
 */
defineOgImage('Default');

/**
 * Pins an explicitly chosen theme before anything is painted.
 *
 * AI-NOTE: this is *only* for an explicit override. The system preference needs
 * no JavaScript at all — main.css sets `color-scheme: light dark`, so
 * `light-dark()` already resolves the right half on the server-rendered HTML.
 * This runs in the head, ahead of the body, so a reader who picked dark on a
 * light machine never sees a white flash on the way in.
 */
useHead(() => ({
  htmlAttrs: head.value.htmlAttrs,
  link: head.value.link,
  meta: head.value.meta,
  script: [
    {
      key: 'theme',
      tagPosition: 'head',
      innerHTML:
        "try{var t=localStorage.getItem('octava-theme');" +
        "if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}"
    }
  ]
}));
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
