<script setup>
const config = useRuntimeConfig();

useSeoMeta({
  title: 'Politika privatnosti | Octava',
  description: 'Koje podatke Octava prikuplja, zašto, i kako ih možeš obrisati.'
});

useHead({ link: [{ rel: 'canonical', href: `${config.public.siteUrl}/privatnost` }] });
</script>

<template>
  <article class="mx-auto max-w-2xl">
    <h1 class="text-2xl font-semibold tracking-tight">Politika privatnosti</h1>
    <p class="mt-2 text-sm text-black/45">Posljednja izmjena: {{ new Date().toLocaleDateString('bs') }}</p>

    <h2 class="mt-8 text-lg font-semibold">Šta prikupljamo</h2>
    <p class="mt-2 text-black/70">
      Bez naloga ne prikupljamo ništa što bi te identifikovalo. Ako napraviš
      nalog, čuvamo <strong>email adresu</strong>, <strong>korisničko ime</strong> i
      <strong>lozinku u kriptovanom obliku</strong> — lozinka se ne čuva u
      čitljivom zapisu i ne možemo je pročitati. Uz to se veže spisak pjesama
      koje si sačuvao.
    </p>

    <h2 class="mt-8 text-lg font-semibold">Kolačići</h2>
    <p class="mt-2 text-black/70">
      Koristimo jedan kolačić, i to samo kad si prijavljen — služi da te sesija
      pamti. Postavljen je kao <span class="font-mono">httpOnly</span>, što znači
      da mu skripte u pregledniku ne mogu pristupiti.
      <strong>Nemamo kolačiće za praćenje ni reklame.</strong>
    </p>

    <h2 class="mt-8 text-lg font-semibold">Postavke u pregledniku</h2>
    <p class="mt-2 text-black/70">
      Veličina teksta i brzina klizanja pamte se lokalno, u tvom pregledniku.
      Ti podaci nikad ne stižu do nas i brišu se kad očistiš podatke stranice.
    </p>

    <h2 class="mt-8 text-lg font-semibold">Mikrofon</h2>
    <p class="mt-2 text-black/70">
      Štimer traži pristup mikrofonu samo dok je uključen. Zvuk se obrađuje
      isključivo u tvom pregledniku — ništa se ne snima, ne šalje niti čuva.
    </p>

    <h2 class="mt-8 text-lg font-semibold">Tvoja prava</h2>
    <p class="mt-2 text-black/70">
      Možeš zatražiti uvid u svoje podatke, njihovu ispravku ili brisanje
      naloga. Brisanjem naloga uklanjaju se email, korisničko ime i sačuvane
      pjesme.
    </p>

    <!-- TODO(Mirnes): a privacy policy without a contact address is not
         actionable — a reader has no way to exercise any of the rights above.
         This is the first thing to fill in. -->
    <p class="mt-8 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Nedostaje kontakt.</strong> Ovdje treba stajati adresa na koju se
      šalju zahtjevi vezani za podatke. Dok je nema, korisnik nema način da
      ostvari prava navedena iznad.
    </p>

    <p class="mt-6 text-sm text-black/45">
      Ovaj tekst opisuje kako sajt stvarno radi, ali nije pravni savjet.
      Prije puštanja u rad neka ga pregleda neko ko se time bavi.
    </p>
  </article>
</template>
