# Octava

Guitar chords and lyrics for Balkan music. Nuxt 4, server-rendered.

```bash
npm install
npm run dev
```

Runs on `http://localhost:3000`. `/api` is proxied to the backend on `4000`,
so the browser always talks to its own origin and the session cookie stays
first-party.

## Why SSR

Song pages are the entire search-traffic surface. They are rendered on the
server so the chords are present in the initial HTML rather than appearing
after hydration.
