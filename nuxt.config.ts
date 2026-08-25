import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  modules: ['@pinia/nuxt', '@nuxt/icon'],

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
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
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
      htmlAttrs: { lang: 'bs' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
});
