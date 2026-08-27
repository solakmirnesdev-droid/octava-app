<script setup>
const { t, locale } = useI18n();

useSeoMeta({
  title: t('meta.termsTitle'),
  description: t('meta.termsDesc')
});

// Canonical and hreflang come from useLocaleHead in app.vue.
</script>

<template>
  <article class="mx-auto max-w-2xl">
    <h1 class="text-2xl font-semibold tracking-tight">{{ $t('terms.title') }}</h1>
    <p class="mt-2 text-sm text-faint">
      {{ $t('terms.updated', { date: new Date().toLocaleDateString(locale) }) }}
    </p>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('terms.introTitle') }}</h2>
    <p class="mt-2 text-body">{{ $t('terms.intro') }}</p>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('terms.accountTitle') }}</h2>
    <p class="mt-2 text-body">{{ $t('terms.account') }}</p>
    <p class="mt-2 text-body">{{ $t('terms.accountAge') }}</p>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('terms.contentTitle') }}</h2>
    <p class="mt-2 text-body">{{ $t('terms.content') }}</p>
    <p class="mt-2 text-body">{{ $t('terms.contentRules') }}</p>
    <p class="mt-2 text-body">{{ $t('terms.contentModeration') }}</p>

    <!-- Given a prominence the other sections do not get, because on a chords
         site this is the section that actually decides whether the thing can
         exist. Burying it would be dishonest. -->
    <h2 class="mt-8 text-lg font-semibold">{{ $t('terms.copyrightTitle') }}</h2>
    <p class="mt-2 text-sm text-faint">{{ $t('terms.copyrightLead') }}</p>
    <div class="mt-2 rounded border border-line bg-panel px-4 py-3">
      <p class="text-body">{{ $t('terms.copyright') }}</p>
      <p class="mt-3 text-body">{{ $t('terms.copyrightNotice') }}</p>
    </div>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('terms.useTitle') }}</h2>
    <p class="mt-2 text-body">{{ $t('terms.use') }}</p>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('terms.availabilityTitle') }}</h2>
    <p class="mt-2 text-body">{{ $t('terms.availability') }}</p>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('terms.liabilityTitle') }}</h2>
    <p class="mt-2 text-body">{{ $t('terms.liability') }}</p>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('terms.endTitle') }}</h2>
    <p class="mt-2 text-body">{{ $t('terms.end') }}</p>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('terms.changesTitle') }}</h2>
    <p class="mt-2 text-body">{{ $t('terms.changes') }}</p>

    <h2 class="mt-8 text-lg font-semibold">{{ $t('terms.lawTitle') }}</h2>
    <p class="mt-2 text-body">{{ $t('terms.law') }}</p>

    <!-- TODO(Mirnes): the takedown promise in the copyright section is not
         actionable without an address to send a notice to. Of everything left
         on this page, this is the one that has to be filled in before launch. -->
    <p class="mt-8 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>{{ $t('terms.noContactLead') }}</strong> {{ $t('terms.noContact') }}
    </p>

    <p class="mt-6 text-sm text-faint">{{ $t('terms.disclaimer') }}</p>
  </article>
</template>
