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

useHead(() => ({
  htmlAttrs: head.value.htmlAttrs,
  link: head.value.link,
  meta: head.value.meta
}));
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
