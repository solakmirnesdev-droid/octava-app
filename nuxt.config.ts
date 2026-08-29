import tailwindcss from '@tailwindcss/vite';

/**
 * Building for a native shell.
 *
 * AI-DECISION: a separate target, switched by an environment variable, rather
 * than a change to how the site builds. Server rendering is the reason this app
 * exists in the form it does — search traffic lands directly on a song page,
 * and the chords have to be in the initial HTML. A native build wants the
 * opposite: no server at all, one static bundle the shell can package. Both are
 * correct, for different destinations, so both are kept.
 *
 *   npm run build          # the site, server-rendered, unchanged
 *   npm run build:native   # .output/public, for Capacitor to copy
 *
 * AI-TRAP: NUXT_PUBLIC_API_BASE must be an ABSOLUTE url for the native build.
 * On the web it is '/api', proxied by Nitro to the API — and inside the shell
 * there is no Nitro and no shared origin, so a relative path resolves against
 * capacitor://localhost and every request fails as soon as somebody opens the
 * app away from a desk. The check below refuses the build rather than shipping
 * a bundle that cannot reach anything.
 */
const native = process.env.NUXT_NATIVE === '1';

if (native) {
  const base = process.env.NUXT_PUBLIC_API_BASE || '';
  if (!/^https?:\/\//.test(base)) {
    throw new Error(
      'NUXT_NATIVE=1 trazi apsolutni NUXT_PUBLIC_API_BASE (npr. https://octava.example/api) — '
      + `dobijeno: ${base || '(prazno)'}`
    );
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  // No server in a shell: the native target renders entirely in the WebView.
  ssr: !native,

  modules: ['@pinia/nuxt', '@nuxt/icon', '@nuxtjs/i18n', '@nuxt/fonts', 'nuxt-og-image'],

  /**
   * Songs here are shared by link far more than they are searched for — into
   * WhatsApp and Viber groups, onto Facebook. A link with no picture collapses
   * to a line of grey text there, so every song renders its own card.
   */
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    name: 'Octava'
  },

  /**
   * AI-TRAP: the latin-ext subset is what carries č ć ž š đ. Without it satori
   * renders every one of them as a NO GLYPH box in the shared-link picture —
   * the Bosnian catalogue's own titles, unreadable in exactly the place the
   * links get shared. nuxt-og-image v6 dropped its own `fonts` option and
   * reads the faces this module provides instead.
   */
  fonts: {
    /**
     * Both families are declared, and both are preloaded.
     *
     * AI-TRAP: JetBrains Mono was never listed here. It reaches the build
     * through --font-mono in main.css, so the module resolved it with its own
     * defaults — twelve subsets including Cyrillic, Greek and Vietnamese, none
     * of which this catalogue can contain, and **weight 400 only**. Meanwhile
     * `font-mono font-bold` appears 51 times, chord symbols among them, so
     * every bold monospace glyph on the site was a browser-synthesised fake.
     * Naming the family is what fixes that; the subsets list is what stops it
     * shipping ten alphabets to do it.
     *
     * AI-DECISION: `preload` is explicit because the module's default refuses
     * any face carrying a unicode-range, which is every face Google serves.
     * That default is right in general — it is what keeps a preload from
     * dragging in Cyrillic — and wrong here only because the subsets are now
     * narrowed to the two this site actually renders. Bosnian needs both: the
     * letters are latin, but č ć š ž đ live in latin-ext, so one text run
     * spans the pair.
     */
    defaults: { preload: true },
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 700], subsets: ['latin', 'latin-ext'] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 700], subsets: ['latin', 'latin-ext'] }
    ]
  },

  ogImage: {
    // Rendered once and cached rather than on every crawl of every song.
    defaults: { cacheMaxAgeSeconds: 60 * 60 * 24 * 7, width: 1200, height: 630 },
    // Stable across builds on purpose: the signature is part of the image URL,
    // and Facebook and WhatsApp cache that URL. An auto-generated secret gives
    // every deploy new URLs, so previously shared links lose their picture.
    secret: process.env.NUXT_OG_IMAGE_SECRET
  },

  /**
   * Two markets on one platform: the Balkan catalogue at the root, the
   * international one under /en.
   *
   * Automatic redirection by IP or Accept-Language is deliberately off.
   * Search engines crawl mostly from US addresses, so a site that switches
   * language by itself shows crawlers one version and hides the other — the
   * Bosnian catalogue would simply never be indexed. The visitor's language is
   * used to *offer* the other version, never to force it.
   */
  i18n: {
    defaultLocale: 'bs',
    // AI-TRAP: resolved relative to the i18n/ directory, not the project root.
    // './i18n/i18n.config.ts' looks right and silently resolves to
    // i18n/i18n/i18n.config.ts; the module then skips the file with only a
    // warning, and the Bosnian plural rule inside it never loads. Bosnian then
    // falls back to English pluralisation, which is right for 1 and 5 and
    // wrong for 21, 22 and 101 — rare enough to pass a casual look.
    vueI18n: './i18n.config.ts',
    strategy: 'prefix_except_default',
    // Off for the reason above; the suggestion banner handles this instead.
    detectBrowserLanguage: false,
    // Both versions carry hreflang links to each other, which is how a crawler
    // learns they are the same site rather than duplicates.
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',

    locales: [
      { code: 'bs', language: 'bs-BA', name: 'Bosanski', file: 'bs.json' },
      { code: 'en', language: 'en', name: 'English', file: 'en.json' }
    ],

    /**
     * Paths are translated, not just prefixed. An English visitor searches for
     * "chords", not "akordi", and the URL is one of the strongest signals a
     * search engine reads.
     */
    customRoutes: 'config',
    pages: {
      'pjesma/[slug]':   { bs: '/pjesma/[slug]',   en: '/song/[slug]' },
      'izvodjac/[slug]': { bs: '/izvodjac/[slug]', en: '/artist/[slug]' },
      'zanr/[slug]':     { bs: '/zanr/[slug]',     en: '/genre/[slug]' },
      'izvodjaci':       { bs: '/izvodjaci',       en: '/artists' },
      'akordi/index':    { bs: '/akordi',          en: '/chords' },
      'stimer':          { bs: '/stimer',          en: '/tuner' },
      'metronom':        { bs: '/metronom',        en: '/metronome' },
      'pjesmarica':      { bs: '/pjesmarica',      en: '/songbook' },
      'pretraga':        { bs: '/pretraga',        en: '/search' },
      'zatrazi':         { bs: '/zatrazi',         en: '/request' },
      'sacuvano':        { bs: '/sacuvano',        en: '/saved' },
      'profil':          { bs: '/profil',         en: '/profile' },
      'prijava':         { bs: '/prijava',         en: '/login' },
      'registracija':    { bs: '/registracija',    en: '/register' },
      'prepoznaj':       { bs: '/prepoznaj',       en: '/recognize' },
      'pretplata':       { bs: '/pretplata',       en: '/subscribe' },
      'o-nama':          { bs: '/o-nama',          en: '/about' },
      'privatnost':      { bs: '/privatnost',      en: '/privacy' },
      'uslovi':          { bs: '/uslovi',          en: '/terms' },
      'zaboravljena-lozinka': { bs: '/zaboravljena-lozinka', en: '/forgot-password' },
      'nova-lozinka':    { bs: '/nova-lozinka',     en: '/new-password' }
    }
  },

  /**
   * Icons are inlined as SVG from the locally installed Material Symbols
   * collection, not loaded as a webfont.
   *
   * A webfont would mean one blocking request to a third party, the whole
   * alphabet shipped for the handful of glyphs actually used, and icons
   * arriving after first paint — which is a layout shift on every page that
   * has one. Bundling from the local collection ships only the icons that
   * appear in the source, with no request at all.
   */
  icon: {
    mode: 'svg',
    // 'local' reads the @iconify-json packages already installed here.
    serverBundle: 'local',
    // Explicit list + scanning so every navigation and dynamic icon is pre-bundled.
    clientBundle: {
      scan: true,
      icons: [
        'material-symbols:mic-rounded',
        'material-symbols:library-music-rounded',
        'material-symbols:graphic-eq-rounded',
        'material-symbols:timer-rounded',
        'material-symbols:cloud-off-rounded',
        'material-symbols:note-add-rounded',
        'material-symbols:favorite-outline-rounded',
        'material-symbols:favorite-rounded',
        'material-symbols:star-rounded',
        'material-symbols:restart-alt-rounded',
        'material-symbols:search-rounded',
        'material-symbols:close-rounded',
        'material-symbols:menu-rounded',
        'material-symbols:login-rounded',
        'material-symbols:logout-rounded',
        'material-symbols:music-note-rounded',
        'material-symbols:visibility-outline-rounded',
        'material-symbols:artist-rounded',
        'material-symbols:language',
        'material-symbols:brightness-auto-outline',
        'material-symbols:light-mode-outline',
        'material-symbols:dark-mode-outline',
        'material-symbols:category-rounded',
        'material-symbols:piano-rounded',
        'material-symbols:local-fire-department-rounded',
        'material-symbols:play-arrow-rounded',
        'material-symbols:pause-rounded',
        'material-symbols:volume-up-outline-rounded',
        'material-symbols:print-outline-rounded',
        'material-symbols:grid-view-rounded',
        'material-symbols:view-list-rounded',
        'material-symbols:label-outline-rounded',
        'material-symbols:filter-list-rounded',
        'material-symbols:location-on-rounded',
        'material-symbols:history-rounded',
        'material-symbols:check-circle-rounded',
        'material-symbols:mic-rounded',
        'material-symbols:mic-off-rounded',
        'material-symbols:tune-rounded',
        'material-symbols:headphones-rounded',
        'material-symbols:person-rounded',
        'material-symbols:account-circle-outline-rounded',
        'material-symbols:badge-outline-rounded',
        'material-symbols:mail-outline-rounded',
        'material-symbols:lock-outline-rounded',
        'material-symbols:upload-rounded',
        'material-symbols:delete-outline-rounded',
        'material-symbols:check-rounded',
        'material-symbols:error-rounded',
        'material-symbols:warning-rounded',
        'material-symbols:mail-rounded',
        'material-symbols:key-rounded',
        'material-symbols:add-rounded',
        'material-symbols:remove-rounded',
        'material-symbols:volume-up-rounded',
        'material-symbols:add-notes-rounded',
        'material-symbols:queue-music-rounded',
        'material-symbols:edit-note-rounded',
        'material-symbols:playlist-remove-rounded',
        'material-symbols:keyboard-arrow-up-rounded',
        'material-symbols:keyboard-arrow-down-rounded',
        'material-symbols:chat-bubble-outline-rounded',
        'material-symbols:arrow-forward-rounded',
        'material-symbols:stop-rounded',
        'material-symbols:touch-app-rounded',
        'material-symbols:check-small-rounded',
        'material-symbols:search-off-rounded',
        'material-symbols:info-rounded',
        'material-symbols:visibility-off-outline-rounded',
        'material-symbols:visibility-off-rounded',
        'material-symbols:send-rounded',
        'material-symbols:edit-rounded',
        'material-symbols:rate-review-outline-rounded',
        'material-symbols:reply-rounded'
      ]
    },
    // Matches the surrounding text by default; override per use with a class.
    size: '1.25em',
    class: 'align-[-0.15em] shrink-0'
  },
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },

  devServer: { port: 3000 },

  runtimeConfig: {
    // Server-side calls go straight to the API, bypassing the browser proxy.
    apiBase: process.env.NUXT_API_BASE || 'http://localhost:4000/api',
    public: {
      // Client-side calls use the same origin, proxied by Nitro below.
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      // Empty until the keys exist; both widgets render nothing without them.
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY || ''
    }
  },

  // Proxy the API through Nitro in every environment, so the browser always
  // talks to its own origin. That keeps the session cookie first-party, which
  // avoids CORS entirely and survives third-party-cookie blocking.
  routeRules: {
    '/api/**': { proxy: `${process.env.NUXT_API_BASE || 'http://localhost:4000/api'}/**` }
  },

  app: {
    head: {
      // lang is set per locale by useLocaleHead in app.vue. Hard-coding it
      // here made the English pages declare themselves as Bosnian.
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#b4472f' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    }
  }
});
