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

const itemClass =
  'flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-semibold text-muted hover:text-ink hover:bg-panel border border-transparent hover:border-line transition-all duration-150 outline-none whitespace-nowrap';
</script>

<template>
  <div class="min-h-screen bg-surface text-ink">
    <SiteNotice />
    <AppToast />
    <!-- <LanguageSuggestion data-print="hide" /> -->

    <header class="sticky top-0 z-40 border-b border-line/70 bg-surface/85 backdrop-blur-xl shadow-2xs">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-x-4 px-4 sm:px-6 py-2.5 sm:py-3.5">
        <!-- 1. LEFT ZONE: Brand Logo + Search + Core Browsing -->
        <div class="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <!-- Mobile Menu Toggle Button (Visible on < lg) -->
          <button
            type="button"
            class="flex size-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-muted hover:border-line hover:bg-panel hover:text-ink lg:hidden outline-none transition-all"
            :aria-label="menuOpen ? $t('nav.closeMenu') : $t('nav.openMenu')"
            :aria-expanded="menuOpen"
            aria-controls="mobile-menu"
            @click="menuOpen = !menuOpen"
          >
            <Icon v-show="!menuOpen" name="material-symbols:menu-rounded" class="text-2xl" />
            <Icon v-show="menuOpen" name="material-symbols:close-rounded" class="text-2xl" />
          </button>

          <!-- Octava Brand Logo (Left-aligned) -->
          <NuxtLink
            :to="localePath('/')"
            class="group flex items-center gap-2.5 outline-none shrink-0"
          >
            <div class="flex size-9 sm:size-9.5 items-center justify-center rounded-xl bg-accent text-on-accent shadow-xs shadow-accent/20 transition-transform duration-150 group-hover:scale-105">
              <Icon name="material-symbols:graphic-eq-rounded" class="text-xl" />
            </div>
            <span class="text-xl sm:text-2xl font-black tracking-tight text-ink group-hover:text-accent transition-colors">
              Octava
            </span>
          </NuxtLink>

          <!-- Desktop Search Box -->
          <div class="hidden sm:block w-44 md:w-52 lg:w-60">
            <SearchBox />
          </div>

          <!-- Left Navigation Items (SVG Left, Text Right) -->
          <nav class="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0 ml-1">
            <NuxtLink
              :to="localePath('/izvodjaci')"
              :class="itemClass" active-class="!text-accent !bg-accent-soft/80 !border-accent/30 !font-bold shadow-2xs" :title="$t('nav.artists')"
            >
              <SingerIcon size="1.25em" />
              <span>{{ $t('nav.artists') }}</span>
            </NuxtLink>

            <NuxtLink
              :to="localePath('/akordi')"
              :class="itemClass" active-class="!text-accent !bg-accent-soft/80 !border-accent/30 !font-bold shadow-2xs" :title="$t('nav.chords')"
            >
              <ChordIcon size="1.25em" />
              <span>{{ $t('nav.chords') }}</span>
            </NuxtLink>
          </nav>
        </div>

        <!-- 2. RIGHT ZONE: Tools & User Account (SVG Left, Text Right) -->
        <div class="flex items-center gap-1.5 xl:gap-2 shrink-0">
          <!-- Desktop Right Tools Navigation -->
          <nav class="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0">
            <NuxtLink
              :to="localePath('/stimer')"
              :class="itemClass" active-class="!text-accent !bg-accent-soft/80 !border-accent/30 !font-bold shadow-2xs" :title="$t('nav.tuner')"
            >
              <TunerIcon size="1.25em" />
              <span>{{ $t('nav.tuner') }}</span>
            </NuxtLink>

            <NuxtLink
              :to="localePath('/metronom')"
              :class="itemClass" active-class="!text-accent !bg-accent-soft/80 !border-accent/30 !font-bold shadow-2xs" :title="$t('nav.metronome')"
            >
              <MetronomeIcon size="1.25em" />
              <span>{{ $t('nav.metronome') }}</span>
            </NuxtLink>

            <NuxtLink
              :to="localePath('/zatrazi')"
              :class="itemClass" active-class="!text-accent !bg-accent-soft/80 !border-accent/30 !font-bold shadow-2xs" :title="$t('nav.request')"
            >
              <RequestIcon size="1.25em" />
              <span>{{ $t('nav.request') }}</span>
            </NuxtLink>

            <span class="mx-0.5 h-4 w-px shrink-0 bg-line/80" aria-hidden="true" />
          </nav>

          <!-- Account Area -->
          <div class="flex items-center gap-1.5 shrink-0">
            <NuxtLink
              v-if="auth.isAuthenticated" :to="localePath('/sacuvano')"
              :class="itemClass" active-class="!text-accent !bg-accent-soft/80 !border-accent/30 !font-bold shadow-2xs" :title="$t('nav.saved')"
            >
              <Icon name="material-symbols:favorite-outline-rounded" class="text-lg" />
              <span>{{ $t('nav.saved') }}</span>
            </NuxtLink>

            <NuxtLink
              v-if="auth.isAuthenticated" :to="localePath('/profil')"
              :class="itemClass" active-class="!text-accent !bg-accent-soft/80 !border-accent/30 !font-bold shadow-2xs" :title="$t('nav.profile')"
            >
              <UserAvatar
                :name="auth.user?.username || '?'" :user-id="auth.user?.id"
                :has-avatar="auth.user?.hasAvatar" size="sm"
              />
              <span>{{ $t('nav.profile') }}</span>
            </NuxtLink>

            <LogoutButton v-if="auth.isAuthenticated" />

            <NuxtLink
              v-else :to="localePath('/prijava')"
              class="flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-panel/80 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-ink hover:border-accent hover:text-accent hover:shadow-xs transition-all duration-150 outline-none"
              :title="$t('nav.login')"
            >
              <Icon name="material-symbols:login-rounded" class="text-base sm:text-lg" />
              <span>{{ $t('nav.login') }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- The drawer. In flow rather than overlaid, so it pushes the page down
           instead of covering it and needs no scroll lock or focus trap. -->
      <div v-show="menuOpen" id="mobile-menu" class="border-t border-line-soft lg:hidden">
        <nav class="mx-auto grid max-w-7xl gap-0.5 px-3 py-2 text-sm">
          <div class="mb-2 sm:hidden">
            <SearchBox />
          </div>

          <NuxtLink
            :to="localePath('/izvodjaci')"
            class="flex items-center gap-3 rounded px-2 py-2.5 text-body hover:bg-raised hover:text-accent"
            active-class="text-accent"
          >
            <SingerIcon size="1.35em" />
            <span>{{ $t('nav.artists') }}</span>
          </NuxtLink>

          <NuxtLink
            :to="localePath('/akordi')"
            class="flex items-center gap-3 rounded px-2 py-2.5 text-body hover:bg-raised hover:text-accent"
            active-class="text-accent"
          >
            <ChordIcon size="1.35em" />
            <span>{{ $t('nav.chords') }}</span>
          </NuxtLink>

          <NuxtLink
            :to="localePath('/stimer')"
            class="flex items-center gap-3 rounded px-2 py-2.5 text-body hover:bg-raised hover:text-accent"
            active-class="text-accent"
          >
            <TunerIcon size="1.35em" />
            <span>{{ $t('nav.tuner') }}</span>
          </NuxtLink>

          <NuxtLink
            :to="localePath('/metronom')"
            class="flex items-center gap-3 rounded px-2 py-2.5 text-body hover:bg-raised hover:text-accent"
            active-class="text-accent"
          >
            <MetronomeIcon size="1.35em" />
            <span>{{ $t('nav.metronome') }}</span>
          </NuxtLink>

          <NuxtLink
            :to="localePath('/zatrazi')"
            class="flex items-center gap-3 rounded px-2 py-2.5 text-body hover:bg-raised hover:text-accent"
            active-class="text-accent"
          >
            <RequestIcon size="1.35em" />
            <span>{{ $t('nav.request') }}</span>
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

          <!-- Temporarily hidden: Language & Theme Switchers
          <div class="mt-1 flex items-center gap-1 border-t border-line px-2 pt-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
          -->
        </nav>
      </div>

      <!-- Modern Secondary Category Pill Strip -->
      <div class="border-t border-line/60 bg-panel/35 backdrop-blur-xs">
        <div
          class="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-4 sm:px-6 py-1.5 text-xs
                 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap
                 [&::-webkit-scrollbar]:hidden"
        >
          <NuxtLink
            v-for="g in genreData?.grouped?.region || []" :key="g._id"
            :to="localePath(`/zanr/${g.slug}`)"
            class="shrink-0 rounded-full border border-transparent px-3 py-1 font-semibold text-body transition-all duration-150 hover:border-line hover:bg-panel hover:text-accent outline-none"
            active-class="!border-accent/40 !bg-accent-soft !text-accent !font-bold shadow-2xs"
          >{{ g.name }}</NuxtLink>

          <span v-if="genreData?.grouped?.region?.length" class="mx-1 h-3.5 w-px shrink-0 bg-line/80" aria-hidden="true" />

          <NuxtLink
            v-for="g in genreData?.grouped?.style || []" :key="g._id"
            :to="localePath(`/zanr/${g.slug}`)"
            class="shrink-0 rounded-full border border-transparent px-3 py-1 font-medium text-muted transition-all duration-150 hover:border-line hover:bg-panel hover:text-accent outline-none"
            active-class="!border-accent/40 !bg-accent-soft !text-accent !font-bold shadow-2xs"
          >{{ g.name }}</NuxtLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-7">
      <slot />
    </main>

    <SiteFooter />
  </div>
</template>
