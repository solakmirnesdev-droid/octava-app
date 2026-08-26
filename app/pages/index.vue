<script setup>
const { t } = useI18n();
const { $api } = useNuxtApp();

const { data } = await useAsyncData('home', async () => {
  const [popular, recent] = await Promise.all([
    $api('/songs', { params: { sort: 'popular', limit: 10 } }).catch(() => ({ songs: [] })),
    $api('/songs', { params: { sort: 'recent', limit: 10 } }).catch(() => ({ songs: [] }))
  ]);
  return { popular: popular.songs || [], recent: recent.songs || [] };
});

useSeoMeta({
  title: t('meta.homeTitle'),
  description: t('meta.homeDesc')
});
</script>

<template>
  <section class="mb-12">
    <h1 class="text-3xl font-semibold tracking-tight">{{ $t('page.homeTitle') }}</h1>
    <p class="mt-2 text-black/60">{{ $t('page.homeLead') }}</p>
  </section>

  <section class="mb-10">
    <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-black/40">{{ $t('page.popular') }}</h2>
    <SongList :songs="data?.popular || []" empty="Još nema objavljenih pjesama." />
  </section>

  <section>
    <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-black/40">{{ $t('page.recent') }}</h2>
    <SongList :songs="data?.recent || []" empty="Još nema objavljenih pjesama." />
  </section>
</template>
