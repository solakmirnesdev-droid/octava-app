<script setup>
const { $api } = useNuxtApp();

const { data } = await useAsyncData('home', async () => {
  const [popular, recent] = await Promise.all([
    $api('/songs', { params: { sort: 'popular', limit: 10 } }).catch(() => ({ songs: [] })),
    $api('/songs', { params: { sort: 'recent', limit: 10 } }).catch(() => ({ songs: [] }))
  ]);
  return { popular: popular.songs || [], recent: recent.songs || [] };
});

useSeoMeta({
  title: 'Octava — akordi za gitaru',
  description: 'Akordi i tekstovi za gitaru. Domaća i regionalna muzika, sa mogućnošću transponovanja u bilo koji tonalitet.'
});
</script>

<template>
  <section class="mb-12">
    <h1 class="text-3xl font-semibold tracking-tight">Akordi za gitaru</h1>
    <p class="mt-2 text-black/60">Domaća i regionalna muzika, sa akordima iznad teksta.</p>
  </section>

  <section class="mb-10">
    <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-black/40">Najtraženije</h2>
    <SongList :songs="data?.popular || []" empty="Još nema objavljenih pjesama." />
  </section>

  <section>
    <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-black/40">Nedavno dodano</h2>
    <SongList :songs="data?.recent || []" empty="Još nema objavljenih pjesama." />
  </section>
</template>
