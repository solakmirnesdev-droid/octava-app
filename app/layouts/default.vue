<script setup>
const auth = useAuthStore();
const { $api } = useNuxtApp();
const localePath = useLocalePath();
const route = useRoute();

/**
 * Below the sm breakpoint the six nav items collapse behind this. The button
 * itself is rendered at every width and hidden with CSS rather than v-if, so
 * the header measures the same on the server as it does after hydration and
 * nothing shifts.
 */
const menuOpen = ref(false);

// Closing on navigation matters more than it looks: every drawer item is a
// link, so without this the panel stays open over the page you just opened.
watch(() => route.fullPath, () => { menuOpen.value = false; });

onMounted(() => {
  const onKey = (e) => { if (e.key === 'Escape') menuOpen.value = false; };
  window.addEventListener('keydown', onKey);
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
});

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

/**
 * Labels are keys, not text: the English site renders this same array. Paths go
 * through localePath because the routes are translated, not merely prefixed —
 * a raw '/akordi' here drops an English visitor back onto the Bosnian site.
 */
const browse = [
  { to: '/izvodjaci', key: 'nav.artists', icon: 'material-symbols:artist-rounded' },
  { to: '/akordi',    key: 'nav.chords',  icon: 'material-symbols:music-note-rounded' },
  { to: '/stimer',    key: 'nav.tuner',   icon: 'material-symbols:tune-rounded' },
  { to: '/zatrazi',   key: 'nav.request', icon: 'material-symbols:add-circle-outline-rounded' }
];

const itemClass =
  'flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-body hover:bg-raised hover:text-accent';
</script>

<template>
  <div class="min-h-screen bg-surface text-ink">
    <SiteNotice />
    <LanguageSuggestion data-print="hide" />

    <header class="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center gap-x-3 px-5 py-2.5 sm:gap-x-4 sm:py-3">
        <NuxtLink :to="localePath('/')" class="shrink-0 text-lg font-semibold tracking-tight">Octava</NuxtLink>

        <SearchBox />

        <!-- Everything below sm lives behind this one control. Hidden with CSS
             at sm and up, never with v-if, so the header height is identical
             before and after hydration. -->
        <button
          type="button"
          class="-mr-2 flex size-11 shrink-0 items-center justify-center rounded text-body hover:bg-raised hover:text-accent sm:hidden"
          :aria-label="menuOpen ? $t('nav.closeMenu') : $t('nav.openMenu')"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          @click="menuOpen = !menuOpen"
        >
          <!-- AI-TRAP: both names are written out as literals and toggled, never
               bound as one dynamic expression. @nuxt/icon builds its client
               bundle by scanning source for literal names; a computed name is
               invisible to that scan and renders a correctly sized SVG with no
               paths in it - a blank button that looks like a styling bug. -->
          <Icon v-show="!menuOpen" name="material-symbols:menu-rounded" class="text-2xl" />
          <Icon v-show="menuOpen" name="material-symbols:close-rounded" class="text-2xl" />
        </button>

        <nav class="ml-auto hidden items-center gap-1 text-sm sm:flex">
          <NuxtLink
            v-for="item in browse" :key="item.to" :to="localePath(item.to)"
            :class="itemClass" active-class="text-accent" :title="$t(item.key)"
          >
            <Icon :name="item.icon" />
            <span>{{ $t(item.key) }}</span>
          </NuxtLink>

          <span class="mx-1 h-5 w-px shrink-0 bg-sunken" aria-hidden="true" />

          <ThemeSwitcher />

          <LanguageSwitcher />

          <!-- Account. Separated deliberately: these act on you, the others
               only move you around the catalogue. -->
          <NuxtLink
            v-if="auth.isAuthenticated" :to="localePath('/sacuvano')"
            :class="itemClass" active-class="text-accent" :title="$t('nav.saved')"
          >
            <!-- Same heart as the save action on a song page: one concept,
                 one symbol. -->
            <Icon name="material-symbols:favorite-outline-rounded" />
            <span>{{ $t('nav.saved') }}</span>
          </NuxtLink>

          <NuxtLink
            v-if="auth.isAuthenticated" :to="localePath('/profil')"
            :class="itemClass" active-class="text-accent" :title="$t('nav.profile')"
          >
            <UserAvatar
              :name="auth.user?.username || '?'" :user-id="auth.user?.id"
              :has-avatar="auth.user?.hasAvatar" size="sm"
            />
            <span>{{ $t('nav.profile') }}</span>
          </NuxtLink>

          <NuxtLink
            v-if="!auth.isAuthenticated" :to="localePath('/prijava')"
            :class="itemClass" :title="$t('nav.login')"
          >
            <Icon name="material-symbols:login-rounded" />
            <span>{{ $t('nav.login') }}</span>
          </NuxtLink>

          <LogoutButton v-else />
        </nav>
      </div>

      <!-- The drawer. In flow rather than overlaid, so it pushes the page down
           instead of covering it and needs no scroll lock or focus trap. -->
      <div v-show="menuOpen" id="mobile-menu" class="border-t border-line-soft sm:hidden">
        <nav class="mx-auto grid max-w-5xl gap-0.5 px-3 py-2 text-sm">
          <NuxtLink
            v-for="item in browse" :key="item.to" :to="localePath(item.to)"
            class="flex items-center gap-3 rounded px-2 py-2.5 text-body hover:bg-raised hover:text-accent"
            active-class="text-accent"
          >
            <Icon :name="item.icon" class="text-lg" />
            <span>{{ $t(item.key) }}</span>
          </NuxtLink>

          <span class="my-1 h-px bg-sunken" aria-hidden="true" />

          <NuxtLink
            v-if="auth.isAuthenticated" :to="localePath('/sacuvano')"
            class="flex items-center gap-3 rounded px-2 py-2.5 text-body hover:bg-raised hover:text-accent"
            active-class="text-accent"
          >
            <Icon name="material-symbols:favorite-outline-rounded" class="text-lg" />
            <span>{{ $t('nav.saved') }}</span>
          </NuxtLink>


          <NuxtLink

            v-if="auth.isAuthenticated" :to="localePath('/profil')"

            class="flex items-center gap-3 rounded px-2 py-2.5 text-body hover:bg-raised hover:text-accent"

            active-class="text-accent"

          >

            <Icon name="material-symbols:account-circle-outline" class="text-lg" />

            <span>{{ $t('nav.profile') }}</span>

          </NuxtLink>

          <NuxtLink
            v-if="!auth.isAuthenticated" :to="localePath('/prijava')"
            class="flex items-center gap-3 rounded px-2 py-2.5 text-body hover:bg-raised hover:text-accent"
          >
            <Icon name="material-symbols:login-rounded" class="text-lg" />
            <span>{{ $t('nav.login') }}</span>
          </NuxtLink>

          <LogoutButton v-else block />

          <div class="mt-1 flex items-center gap-1 border-t border-line px-2 pt-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </nav>
      </div>

      <!-- Wrapping this list costs three rows on a phone, which is most of what
           is left after the header. One scrollable row keeps every rubric
           reachable at a fraction of the height. -->
      <div class="border-t border-line-soft">
        <div
          class="mx-auto flex max-w-5xl items-center gap-x-4 gap-y-1 overflow-x-auto px-5 py-1.5 text-sm
                 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:py-2
                 [&::-webkit-scrollbar]:hidden"
        >
          <NuxtLink
            v-for="g in genreData?.grouped?.region || []" :key="g._id"
            :to="localePath(`/zanr/${g.slug}`)"
            class="shrink-0 font-medium text-body hover:text-accent"
            active-class="text-accent"
          >{{ g.name }}</NuxtLink>

          <span v-if="genreData?.grouped?.region?.length" class="shrink-0 text-dim">|</span>

          <NuxtLink
            v-for="g in genreData?.grouped?.style || []" :key="g._id"
            :to="localePath(`/zanr/${g.slug}`)"
            class="shrink-0 text-muted hover:text-accent"
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
