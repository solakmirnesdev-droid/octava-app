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
