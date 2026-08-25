<script setup>
const { $api } = useNuxtApp();

const { data } = await useAsyncData('about-counts', () =>
  $api('/footer').catch(() => ({ counts: {} }))
);

useSeoMeta({
  title: 'O nama | Octava',
  description: 'Šta je Octava, kako nastaje sadržaj i kako se koriste alati — štimer, transponovanje i dijagrami hvatova.',
  ogTitle: 'O nama — Octava'
});

// Canonical and hreflang come from useLocaleHead in app.vue. A hard-coded
// canonical here pointed every English page at its Bosnian counterpart,
// which tells a search engine to index that one instead.
</script>

<template>
  <article class="mx-auto max-w-2xl">
    <h1 class="text-2xl font-semibold tracking-tight">O nama</h1>

    <p class="mt-4 text-black/70">
      Octava je pjesmarica za gitaru posvećena domaćoj i regionalnoj muzici —
      akordi ispisani iznad teksta, onako kako se pjesma stvarno svira.
    </p>

    <h2 class="mt-8 text-lg font-semibold">Zašto postoji</h2>
    <p class="mt-2 text-black/70">
      Velike svjetske pjesmarice slabo pokrivaju naš repertoar. Sevdalinke,
      starogradske i ex-Yu klasici uglavnom se prenose s koljena na koljeno i
      po forumima, u neujednačenom obliku. Octava im daje jedno mjesto, sa
      alatima koje gitarista zaista koristi dok svira.
    </p>

    <h2 class="mt-8 text-lg font-semibold">Naša notacija</h2>
    <p class="mt-2 text-black/70">
      Koristimo domaći sistem: <strong class="font-mono">H</strong> je dvanaesti
      stepen, a povisilice se pišu umjesto snizilica — pa je
      <span class="font-mono">A#</span>, ne <span class="font-mono">B♭</span>.
      Kod uvoza razumijemo i američki zapis, pa se pjesme iz stranih izvora
      preslikaju ispravno.
    </p>

    <h2 class="mt-8 text-lg font-semibold">Alati</h2>
    <ul class="mt-2 space-y-2 text-black/70">
      <li>
        <NuxtLink to="/stimer" class="text-accent hover:underline">Štimer</NuxtLink> —
        prepoznaje ton preko mikrofona i pokazuje odstupanje u centima. Zvuk se
        obrađuje u pregledniku i nigdje se ne šalje.
      </li>
      <li>
        <strong>Transponovanje</strong> — svih dvanaest tonaliteta, uz prikaz
        kojim kapodasterom se isto postiže bez mijenjanja hvatova.
      </li>
      <li>
        <NuxtLink to="/akordi" class="text-accent hover:underline">Dijagrami hvatova</NuxtLink> —
        pređeš mišem preko akorda i vidiš gdje idu prsti.
      </li>
      <li>
        <strong>Automatsko klizanje</strong> — stranica ide sama dok sviraš, sa
        podesivom brzinom.
      </li>
    </ul>

    <h2 class="mt-8 text-lg font-semibold">Sadržaj</h2>
    <p class="mt-2 text-black/70">
      Pjesme unosi i provjerava uredništvo. Ako neke nema, možeš je
      <NuxtLink to="/zatrazi" class="text-accent hover:underline">zatražiti</NuxtLink> —
      obrađujemo redom po broju glasova.
    </p>

    <p v-if="data?.counts?.songs" class="mt-8 font-mono text-sm text-black/45">
      Trenutno: {{ data.counts.songs }} pjesama, {{ data.counts.artists }} izvođača,
      {{ data.counts.genres }} rubrika.
    </p>
  </article>
</template>
