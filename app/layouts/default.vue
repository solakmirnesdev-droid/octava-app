<script setup>
const auth = useAuthStore();
const { $api } = useNuxtApp();

// Fetched once for the whole layout; the rubric row is on every page.
const { data: genreData } = await useAsyncData('layout-genres', () =>
  $api('/genres').catch(() => ({ grouped: {} }))
);

/**
 * Icons chosen for what the page actually is, not for decoration: a waveform
 * for the tuner, a heart that matches the save action on a song page.
 */
const config = useRuntimeConfig();

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${config.public.siteUrl}/#website`,
          url: config.public.siteUrl,
          name: 'Octava',
          description: 'Akordi i tekstovi za gitaru — domaća i regionalna muzika.',
          inLanguage: 'bs',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${config.public.siteUrl}/pretraga?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
          }
        },
        {
          '@type': 'Organization',
          '@id': `${config.public.siteUrl}/#organization`,
          name: 'Octava',
          url: config.public.siteUrl
          // sameAs goes here once social profiles exist; listing none is
          // better than listing a profile that is not yours.
        }
      ]
    })
  }]
});

const browse = [
  { to: '/izvodjaci', label: 'Izvođači', icon: 'material-symbols:artist-rounded' },
  { to: '/akordi',    label: 'Akordi',   icon: 'material-symbols:music-note-rounded' },
  { to: '/stimer',    label: 'Štimer',   icon: 'material-symbols:tune-rounded' },
  { to: '/zatrazi',   label: 'Zatraži',  icon: 'material-symbols:add-circle-outline-rounded' }
];
</script>

<template>
  <div class="min-h-screen bg-surface text-ink">
    <header class="sticky top-0 z-10 border-b border-black/10 bg-surface/90 backdrop-blur">
      <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
        <NuxtLink to="/" class="text-lg font-semibold tracking-tight">Octava</NuxtLink>

        <!-- Second in the source so it reads first, but ordered last on a
             phone, where it takes the full width of its own row. -->
        <div class="order-last w-full sm:order-none sm:w-auto sm:flex-1">
          <SearchBox />
        </div>

        <nav
          class="ml-auto flex items-center gap-1 overflow-x-auto text-sm
                 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <!-- Browsing. Labels collapse on narrow screens; the icons carry the
               meaning there, which is also what stops this row wrapping. -->
          <NuxtLink
            v-for="item in browse" :key="item.to" :to="item.to"
            class="flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-black/70 hover:bg-black/5 hover:text-accent"
            active-class="text-accent"
            :title="item.label"
          >
            <Icon :name="item.icon" />
            <span>{{ item.label }}</span>
          </NuxtLink>

          <span class="mx-1 h-5 w-px shrink-0 bg-black/10" aria-hidden="true" />

          <!-- Account. Separated deliberately: these act on you, the others
               only move you around the catalogue. -->
          <NuxtLink
            v-if="auth.isAuthenticated" to="/sacuvano"
            class="flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-black/70 hover:bg-black/5 hover:text-accent"
            active-class="text-accent" title="Sačuvano"
          >
            <!-- Same heart as the save action on a song page: one concept,
                 one symbol. -->
            <Icon name="material-symbols:favorite-outline-rounded" />
            <span>Sačuvano</span>
          </NuxtLink>

          <NuxtLink
            v-if="!auth.isAuthenticated" to="/prijava"
            class="flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-black/70 hover:bg-black/5 hover:text-accent"
            title="Prijava"
          >
            <Icon name="material-symbols:login-rounded" />
            <span>Prijava</span>
          </NuxtLink>

          <button
            v-else
            class="flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-black/70 hover:bg-black/5 hover:text-accent"
            title="Odjava"
            @click="auth.logout()"
          >
            <Icon name="material-symbols:logout-rounded" />
            <span>Odjava</span>
          </button>
        </nav>
      </div>

      <!-- Wrapping this list costs three rows on a phone, which is most of what
           is left after the header. One scrollable row keeps every rubric
           reachable at a fraction of the height. -->
      <div class="border-t border-black/5">
        <div
          class="mx-auto flex max-w-5xl items-center gap-x-4 gap-y-1 overflow-x-auto px-5 py-2 text-sm
                 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible
                 [&::-webkit-scrollbar]:hidden"
        >
          <NuxtLink
            v-for="g in genreData?.grouped?.region || []" :key="g._id"
            :to="`/zanr/${g.slug}`"
            class="shrink-0 font-medium text-black/70 hover:text-accent"
            active-class="text-accent"
          >{{ g.name }}</NuxtLink>

          <span v-if="genreData?.grouped?.region?.length" class="shrink-0 text-black/15">|</span>

          <NuxtLink
            v-for="g in genreData?.grouped?.style || []" :key="g._id"
            :to="`/zanr/${g.slug}`"
            class="shrink-0 text-black/50 hover:text-accent"
            active-class="text-accent"
          >{{ g.name }}</NuxtLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-5 py-8">
      <slot />
    </main>

    <SiteFooter />
  </div>
</template>
