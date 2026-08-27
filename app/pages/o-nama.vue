<script setup>
const { t } = useI18n();
const localePath = useLocalePath();
const { $api } = useNuxtApp();

const { data } = await useAsyncData('about-counts', () =>
  $api('/footer').catch(() => ({ counts: {} }))
);

useSeoMeta({
  title: t('meta.aboutTitle'),
  description: t('meta.aboutDesc'),
  ogTitle: t('meta.aboutOg')
});

// Canonical and hreflang come from useLocaleHead in app.vue. A hard-coded
// canonical here pointed every English page at its Bosnian counterpart,
// which tells a search engine to index that one instead.
</script>

<template>
  <article class="mx-auto max-w-2xl">
    <h1 class="text-2xl font-semibold tracking-tight">{{ $t('about.title') }}</h1>

    <p class="mt-4 text-body">{{ $t('about.lead') }}</p>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('about.whyTitle') }}</h2>
    <p class="mt-2 text-body">{{ $t('about.why') }}</p>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('about.notationTitle') }}</h2>
    <!-- i18n-t, not a plain key: the note names keep their monospace, and the
         sentence around them is free to reorder in translation. -->
    <i18n-t keypath="about.notation" tag="p" class="mt-2 text-body" scope="global">
      <template #h><strong class="font-mono">H</strong></template>
      <template #sharp><span class="font-mono">A#</span></template>
      <template #flat><span class="font-mono">B♭</span></template>
    </i18n-t>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('about.toolsTitle') }}</h2>
    <ul class="mt-2 space-y-2 text-body">
      <li>
        <i18n-t keypath="about.tunerDesc" scope="global">
          <template #link>
            <NuxtLink :to="localePath('/stimer')" class="text-accent hover:underline">{{ $t('about.tuner') }}</NuxtLink>
          </template>
        </i18n-t>
      </li>
      <li>
        <i18n-t keypath="about.transposeDesc" scope="global">
          <template #name><strong>{{ $t('about.transpose') }}</strong></template>
        </i18n-t>
      </li>
      <li>
        <i18n-t keypath="about.diagramsDesc" scope="global">
          <template #link>
            <NuxtLink :to="localePath('/akordi')" class="text-accent hover:underline">{{ $t('about.diagrams') }}</NuxtLink>
          </template>
        </i18n-t>
      </li>
      <li>
        <i18n-t keypath="about.scrollDesc" scope="global">
          <template #name><strong>{{ $t('about.scroll') }}</strong></template>
        </i18n-t>
      </li>
    </ul>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('about.contentTitle') }}</h2>
    <i18n-t keypath="about.content" tag="p" class="mt-2 text-body" scope="global">
      <template #request>
        <NuxtLink :to="localePath('/zatrazi')" class="text-accent hover:underline">{{ $t('about.requestVerb') }}</NuxtLink>
      </template>
    </i18n-t>

    <p v-if="data?.counts?.songs" class="mt-8 font-mono text-sm text-faint">
      {{ $t('about.counts', { songs: data.counts.songs, artists: data.counts.artists, genres: data.counts.genres }) }}
    </p>
  </article>
</template>
