<script setup>
const auth = useAuthStore();
const { $api } = useNuxtApp();
const localePath = useLocalePath();
const route = useRoute();

const { t } = useI18n();

/**
 * Below the sm breakpoint the six nav items collapse behind this. The button
 * itself is rendered at every width and hidden with CSS rather than v-if, so
 * the header measures the same on the server as it does after hydration and
 * nothing shifts.
 */
const menuOpen = ref(false);
const profileMenuOpen = ref(false);
const askingLogout = ref(false);
const busyLogout = ref(false);

async function signOut() {
  busyLogout.value = true;
  try {
    await auth.logout(t('nav.loggedOut'));
  } finally {
    busyLogout.value = false;
    askingLogout.value = false;
  }
}

function onClickOutside(e) {
  if (profileMenuOpen.value && !e.target.closest('[data-user-menu]')) {
    profileMenuOpen.value = false;
  }
}

// Lock body scrolling when the drawer is open on mobile
watch(menuOpen, (open) => {
  if (typeof document !== 'undefined') {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else if (!askingLogout.value) {
      document.body.style.overflow = '';
    }
  }
});

// Closing on navigation matters more than it looks: every drawer item is a
// link, so without this the panel stays open over the page you just opened.
watch(() => route.fullPath, () => {
  menuOpen.value = false;
  profileMenuOpen.value = false;
});

onMounted(() => {
  window.addEventListener('click', onClickOutside);
  const onKey = (e) => {
    if (e.key === 'Escape') {
      menuOpen.value = false;
      profileMenuOpen.value = false;
    }
  };
  window.addEventListener('keydown', onKey);
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('click', onClickOutside);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  });
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
          <!-- Mobile Quick Search Trigger Button (Visible only on < sm) -->
          <NuxtLink
            :to="localePath('/pretraga')"
            class="flex size-9 sm:hidden items-center justify-center rounded-xl border border-line-soft bg-panel/80 text-muted hover:border-line hover:text-ink transition-all shadow-2xs"
            :title="$t('nav.search') || 'Pretraga'"
          >
            <Icon name="material-symbols:search-rounded" class="text-lg" />
            <span class="sr-only">{{ $t('nav.search') || 'Pretraga' }}</span>
          </NuxtLink>

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
              :to="localePath('/prepoznaj')"
              :class="itemClass" active-class="!text-accent !bg-accent-soft/80 !border-accent/30 !font-bold shadow-2xs" :title="$t('nav.recognize')"
            >
              <ListenIcon size="1.25em" />
              <span>{{ $t('nav.recognize') }}</span>
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
          <div class="relative flex items-center gap-1.5 shrink-0" data-user-menu>
            <!-- Profile Dropdown Trigger Button -->
            <button
              v-if="auth.isAuthenticated"
              type="button"
              :class="[
                itemClass,
                profileMenuOpen ? '!text-accent !bg-accent-soft/80 !border-accent/30 !font-bold shadow-2xs' : ''
              ]"
              :aria-expanded="profileMenuOpen"
              class="cursor-pointer select-none"
              @click="profileMenuOpen = !profileMenuOpen"
            >
              <UserAvatar
                :name="auth.user?.username || '?'"
                :user-id="auth.user?.id"
                :has-avatar="auth.user?.hasAvatar"
                size="sm"
              />
              <span class="hidden sm:inline">{{ auth.user?.username || $t('nav.profile') }}</span>
              <Icon
                name="material-symbols:keyboard-arrow-down-rounded"
                class="text-base text-muted transition-transform duration-200"
                :class="{ 'rotate-180 text-accent': profileMenuOpen }"
              />
            </button>

            <!-- Profile Dropdown Menu (Glassmorphism) -->
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 translate-y-2 scale-95"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 translate-y-2 scale-95"
            >
              <div
                v-if="profileMenuOpen && auth.isAuthenticated"
                class="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-line bg-panel/95 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 z-50 overflow-hidden space-y-1"
                role="menu"
              >
                <!-- User Profile Header -->
                <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface/70 border border-line-soft">
                  <UserAvatar
                    :name="auth.user?.username || '?'"
                    :user-id="auth.user?.id"
                    :has-avatar="auth.user?.hasAvatar"
                    size="md"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-ink truncate">{{ auth.user?.username || 'Korisnik' }}</p>
                    <p class="text-[11px] text-muted truncate font-mono">{{ auth.user?.email || '' }}</p>
                  </div>
                </div>

                <div class="pt-0.5 space-y-0.5">
                  <!-- 1. Edit Profile (Uredi profil) -->
                  <NuxtLink
                    :to="localePath('/profil')"
                    class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-body hover:bg-surface hover:text-accent transition-colors"
                    role="menuitem"
                    @click="profileMenuOpen = false"
                  >
                    <Icon name="material-symbols:person-outline-rounded" class="text-base text-muted" />
                    <span>{{ $t('nav.editProfile') }}</span>
                  </NuxtLink>

                  <!-- 2. Saved (Sačuvano) -->
                  <NuxtLink
                    :to="localePath('/sacuvano')"
                    class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-body hover:bg-surface hover:text-accent transition-colors"
                    role="menuitem"
                    @click="profileMenuOpen = false"
                  >
                    <Icon name="material-symbols:favorite-outline-rounded" class="text-base text-muted" />
                    <span>{{ $t('nav.saved') }}</span>
                  </NuxtLink>

                  <div class="my-1 border-t border-line-soft" />

                  <!-- 3. Logout (Odjavi se) -->
                  <button
                    type="button"
                    class="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-danger hover:bg-danger-soft transition-colors cursor-pointer text-left"
                    role="menuitem"
                    @click="profileMenuOpen = false; askingLogout = true"
                  >
                    <Icon name="material-symbols:logout-rounded" class="text-base text-danger" />
                    <span>{{ $t('nav.logout') }}</span>
                  </button>
                </div>
              </div>
            </Transition>

            <!-- Login button when unauthenticated -->
            <AppButton
              v-if="!auth.isAuthenticated"
              :to="localePath('/prijava')"
              variant="secondary"
              size="sm"
              icon="material-symbols:login-rounded"
              :title="$t('nav.login')"
            >
              <span class="hidden sm:inline">{{ $t('nav.login') }}</span>
            </AppButton>
          </div>
        </div>
      </div>

      <!-- Modern Secondary Category Pill Strip with Smooth Fade Mask -->
      <div class="border-t border-line/60 bg-panel/35 backdrop-blur-xs">
        <div
          class="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-4 sm:px-6 py-1.5 text-xs
                 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap
                 [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]"
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

    <main class="mx-auto max-w-6xl xl:max-w-7xl px-4 sm:px-6 py-6 sm:py-7">
      <slot />
    </main>

    <SiteFooter />

    <!-- Full-height Mobile Slide-in Navigation Drawer (Left to Right) -->
    <Teleport to="body">
      <div v-if="menuOpen" class="fixed inset-0 z-50 lg:hidden">
        <!-- Backdrop Scrim with fade -->
        <Transition
          appear
          enter-active-class="transition-opacity duration-300 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            class="fixed inset-0 bg-black/65 backdrop-blur-xs"
            @click="menuOpen = false"
          />
        </Transition>

        <!-- Drawer Content Sliding from Left to Right -->
        <Transition
          appear
          enter-active-class="transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)"
          enter-from-class="-translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition-transform duration-200 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="-translate-x-full"
        >
          <aside
            id="mobile-drawer"
            class="fixed inset-y-0 left-0 flex h-dvh w-[85vw] max-w-xs sm:max-w-sm flex-col border-r border-line bg-surface shadow-2xl backdrop-blur-2xl z-10"
            role="dialog"
            aria-modal="true"
            :aria-label="$t('nav.openMenu')"
          >
            <!-- Drawer Header -->
            <div class="flex items-center justify-between px-4 py-3.5 border-b border-line-soft shrink-0">
              <NuxtLink
                :to="localePath('/')"
                class="group flex items-center gap-2.5 outline-none"
                @click="menuOpen = false"
              >
                <div class="flex size-8.5 items-center justify-center rounded-xl bg-accent text-on-accent shadow-xs shadow-accent/20 transition-transform duration-150 group-hover:scale-105">
                  <Icon name="material-symbols:graphic-eq-rounded" class="text-lg" />
                </div>
                <span class="text-xl font-black tracking-tight text-ink group-hover:text-accent transition-colors">
                  Octava
                </span>
              </NuxtLink>

              <button
                type="button"
                class="flex size-8.5 items-center justify-center rounded-xl border border-line-soft bg-panel/80 text-muted hover:border-line hover:bg-raised hover:text-ink transition-colors cursor-pointer outline-none"
                :aria-label="$t('nav.closeMenu')"
                @click="menuOpen = false"
              >
                <Icon name="material-symbols:close-rounded" class="text-xl" />
              </button>
            </div>

            <!-- Drawer Scrollable Body -->
            <div class="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-4">
              <!-- Mobile Search -->
              <div class="sm:hidden">
                <SearchBox />
              </div>

              <!-- Main Navigation Links -->
              <nav class="space-y-1">
                <p class="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted/70">
                  Navigacija
                </p>

                <NuxtLink
                  :to="localePath('/izvodjaci')"
                  class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-body hover:bg-raised hover:text-accent transition-all duration-150"
                  active-class="!bg-accent-soft/80 !text-accent !font-bold border border-accent/20 shadow-2xs"
                  @click="menuOpen = false"
                >
                  <SingerIcon size="1.35em" />
                  <span>{{ $t('nav.artists') }}</span>
                </NuxtLink>

                <NuxtLink
                  :to="localePath('/akordi')"
                  class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-body hover:bg-raised hover:text-accent transition-all duration-150"
                  active-class="!bg-accent-soft/80 !text-accent !font-bold border border-accent/20 shadow-2xs"
                  @click="menuOpen = false"
                >
                  <ChordIcon size="1.35em" />
                  <span>{{ $t('nav.chords') }}</span>
                </NuxtLink>

                <NuxtLink
                  :to="localePath('/stimer')"
                  class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-body hover:bg-raised hover:text-accent transition-all duration-150"
                  active-class="!bg-accent-soft/80 !text-accent !font-bold border border-accent/20 shadow-2xs"
                  @click="menuOpen = false"
                >
                  <TunerIcon size="1.35em" />
                  <span>{{ $t('nav.tuner') }}</span>
                </NuxtLink>

                <NuxtLink
                  :to="localePath('/metronom')"
                  class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-body hover:bg-raised hover:text-accent transition-all duration-150"
                  active-class="!bg-accent-soft/80 !text-accent !font-bold border border-accent/20 shadow-2xs"
                  @click="menuOpen = false"
                >
                  <MetronomeIcon size="1.35em" />
                  <span>{{ $t('nav.metronome') }}</span>
                </NuxtLink>

                <NuxtLink
                  :to="localePath('/prepoznaj')"
                  class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-body hover:bg-raised hover:text-accent transition-all duration-150"
                  active-class="!bg-accent-soft/80 !text-accent !font-bold border border-accent/20 shadow-2xs"
                  @click="menuOpen = false"
                >
                  <ListenIcon size="1.35em" />
                  <span>{{ $t('nav.recognize') }}</span>
                </NuxtLink>

                <NuxtLink
                  :to="localePath('/zatrazi')"
                  class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-body hover:bg-raised hover:text-accent transition-all duration-150"
                  active-class="!bg-accent-soft/80 !text-accent !font-bold border border-accent/20 shadow-2xs"
                  @click="menuOpen = false"
                >
                  <RequestIcon size="1.35em" />
                  <span>{{ $t('nav.request') }}</span>
                </NuxtLink>
              </nav>

              <!-- Genre Categories Section -->
              <div v-if="genreData?.grouped?.region?.length || genreData?.grouped?.style?.length" class="space-y-2 pt-2 border-t border-line-soft">
                <p class="px-2 text-[11px] font-bold uppercase tracking-wider text-muted/70">
                  {{ $t('genre.rubrics') || 'Rubrike' }}
                </p>
                <div class="flex flex-wrap gap-1.5 px-1">
                  <NuxtLink
                    v-for="g in [...(genreData?.grouped?.region || []), ...(genreData?.grouped?.style || [])]"
                    :key="g._id"
                    :to="localePath(`/zanr/${g.slug}`)"
                    class="rounded-full border border-line-soft bg-panel/70 px-2.5 py-1 text-xs font-medium text-body hover:border-line hover:bg-panel hover:text-accent transition-all"
                    active-class="!border-accent/40 !bg-accent-soft !text-accent !font-bold"
                    @click="menuOpen = false"
                  >
                    {{ g.name }}
                  </NuxtLink>
                </div>
              </div>
            </div>

            <!-- Drawer Bottom Account Footer -->
            <div class="border-t border-line-soft p-3 bg-panel/40 shrink-0">
              <div v-if="auth.isAuthenticated" class="space-y-2">
                <div class="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-surface/80 border border-line-soft">
                  <UserAvatar
                    :name="auth.user?.username || '?'"
                    :user-id="auth.user?.id"
                    :has-avatar="auth.user?.hasAvatar"
                    size="sm"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-ink truncate">{{ auth.user?.username || 'Korisnik' }}</p>
                    <p class="text-[11px] text-muted truncate font-mono">{{ auth.user?.email || '' }}</p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-1.5">
                  <NuxtLink
                    :to="localePath('/profil')"
                    class="flex items-center justify-center gap-1.5 rounded-xl border border-line-soft bg-surface py-2 text-xs font-semibold text-body hover:text-accent hover:border-line transition-colors"
                    @click="menuOpen = false"
                  >
                    <Icon name="material-symbols:person-outline-rounded" class="text-base" />
                    <span>{{ $t('nav.profile') }}</span>
                  </NuxtLink>

                  <NuxtLink
                    :to="localePath('/sacuvano')"
                    class="flex items-center justify-center gap-1.5 rounded-xl border border-line-soft bg-surface py-2 text-xs font-semibold text-body hover:text-accent hover:border-line transition-colors"
                    @click="menuOpen = false"
                  >
                    <Icon name="material-symbols:favorite-outline-rounded" class="text-base" />
                    <span>{{ $t('nav.saved') }}</span>
                  </NuxtLink>
                </div>

                <button
                  type="button"
                  class="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-danger hover:bg-danger-soft transition-colors cursor-pointer"
                  @click="menuOpen = false; askingLogout = true"
                >
                  <Icon name="material-symbols:logout-rounded" class="text-base" />
                  <span>{{ $t('nav.logout') }}</span>
                </button>
              </div>

              <div v-else>
                <AppButton
                  :to="localePath('/prijava')"
                  variant="primary"
                  block
                  icon="material-symbols:login-rounded"
                  :title="$t('nav.login')"
                  @click="menuOpen = false"
                >
                  <span>{{ $t('nav.login') }}</span>
                </AppButton>
              </div>
            </div>
          </aside>
        </Transition>
      </div>
    </Teleport>

    <!-- Logout Confirmation Modal -->
    <AppModal
      v-model="askingLogout"
      :title="$t('nav.logoutTitle')"
      :description="$t('nav.logoutBody', { name: auth.user?.username || '' })"
      :confirm-label="$t('nav.logout')"
      :cancel-label="$t('common.cancel')"
      :busy="busyLogout"
      @confirm="signOut"
    />
  </div>
</template>
