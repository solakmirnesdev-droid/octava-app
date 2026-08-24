import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  modules: ['@pinia/nuxt'],
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
