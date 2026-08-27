import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

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
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 700], subsets: ['latin', 'latin-ext'] }
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
      'pretraga':        { bs: '/pretraga',        en: '/search' },
      'zatrazi':         { bs: '/zatrazi',         en: '/request' },
      'sacuvano':        { bs: '/sacuvano',        en: '/saved' },
      'profil':          { bs: '/profil',         en: '/profile' },
      'prijava':         { bs: '/prijava',         en: '/login' },
      'registracija':    { bs: '/registracija',    en: '/register' },
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
    // Naming collections explicitly instead makes the module try to fetch them
    // from the Iconify service at build time, which silently produced empty
    // icons: correct size, correct colour, no paths inside.
    serverBundle: 'local',
    // Scanned from source so client-side navigation has them too, without
    // a request.
    clientBundle: { scan: true },
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
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
});
