<script setup>
const { t, locale } = useI18n();

useSeoMeta({
  title: t('meta.privacyTitle'),
  description: t('meta.privacyDesc')
});

// Canonical and hreflang come from useLocaleHead in app.vue. A hard-coded
// canonical here pointed every English page at its Bosnian counterpart,
// which tells a search engine to index that one instead.
</script>

<template>
  <article class="mx-auto max-w-2xl">
    <h1 class="text-2xl font-semibold tracking-tight">{{ $t('privacy.title') }}</h1>
    <!-- Formatted in the reader's locale: a fixed 'bs' printed Bosnian dates on
         the English page. -->
    <p class="mt-2 text-sm text-faint">
      {{ $t('privacy.updated', { date: new Date().toLocaleDateString(locale) }) }}
    </p>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('privacy.collectTitle') }}</h2>
    <i18n-t keypath="privacy.collect" tag="p" class="mt-2 text-body" scope="global">
      <template #email><strong>{{ $t('privacy.email') }}</strong></template>
      <template #username><strong>{{ $t('privacy.username') }}</strong></template>
      <template #password><strong>{{ $t('privacy.password') }}</strong></template>
    </i18n-t>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('privacy.cookiesTitle') }}</h2>
    <i18n-t keypath="privacy.cookies" tag="p" class="mt-2 text-body" scope="global">
      <template #httpOnly><span class="font-mono">httpOnly</span></template>
      <template #noTracking><strong>{{ $t('privacy.noTracking') }}</strong></template>
    </i18n-t>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('privacy.browserTitle') }}</h2>
    <p class="mt-2 text-body">{{ $t('privacy.browser') }}</p>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('privacy.micTitle') }}</h2>
    <p class="mt-2 text-body">{{ $t('privacy.mic') }}</p>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('privacy.rightsTitle') }}</h2>
    <p class="mt-2 text-body">{{ $t('privacy.rights') }}</p>

    <!-- TODO(Mirnes): a privacy policy without a contact address is not
         actionable — a reader has no way to exercise any of the rights above.
         This is the first thing to fill in. -->
    <p class="mt-8 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>{{ $t('privacy.noContactLead') }}</strong> {{ $t('privacy.noContact') }}
    </p>

    <p class="mt-6 text-sm text-faint">{{ $t('privacy.disclaimer') }}</p>
  </article>
</template>
