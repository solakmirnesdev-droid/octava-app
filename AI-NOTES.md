# AI-NOTES — octava-app

> **Entry file for every AI session on this project.** Read this first, before
> touching any code. Update it before you finish. It exists because context
> windows end and sessions reset — this file is the memory that survives.
>
> Single source of truth. [AGENTS.md](./AGENTS.md) points other tools here.

**Last updated:** 2026-08-27

---

## 1. What this project is

The public Octava site: a guitar songbook for ex-Yugoslav music. Server-rendered
Nuxt, reading everything from `octava-backend` over HTTP. Bosnian is the default
locale and English is a full translation, not an afterthought — the two catalogues
are kept at exact key parity.

Notation throughout is the ex-Yugoslav one: **H is the twelfth degree** and
accidentals are written as sharps. `Bb` and `B` are foreign spellings that get
normalised on the way in; they must never be *printed*.

---

## 2. Stack & commands

| | |
|---|---|
| **Language / runtime** | JavaScript (ESM), Node 24 |
| **Framework** | Nuxt 4 with `srcDir: app/` |
| **Package manager** | npm |
| **Styling** | Tailwind 4 |
| **State** | Pinia |

```bash
npm install          # install
npm run dev          # localhost:3000 (backend must be up on :4000)
npm run build        # production build
npx nuxt build       # same, for a quick compile check
```

There is no test runner in this repo. The backend has one (108 tests); anything
verifiable here is verified by running a node script against `app/utils/`.

---

## 3. Architecture map

```
app/
├── components/     ChordDiagram, ChordGrid, ChordTooltip, SearchBox, RatingStars…
├── pages/          akordi/, pjesma/[slug], izvodjac/[slug], zanr/[slug]
├── utils/          chordEngine, chordShapes, chordpro, avatar
├── stores/         Pinia
└── assets/css/     main.css — the only place colours are defined
i18n/
├── locales/        bs.json, en.json — 322 keys each, parity enforced
└── i18n.config.ts  plural rules
```

**Data flow:** page → `$api` → `octava-backend` on :4000. Nothing is persisted
client-side except saved songs.

**External services:** Cloudflare Turnstile, Google Identity Services, YouTube
(nocookie embeds). Chord fingerings are computed locally — no service involved.

---

## 4. UI & design conventions

**Design tokens:** `app/assets/css/main.css`. Only two named colours —
`--color-ink: #12100f` and `--color-accent: #b4472f` (warm terracotta).
Everything else is a black/white opacity step.

**Colour usage: never literal.** A component names the *role* a colour plays and
`main.css` decides what that role looks like per theme. There is no `text-black/40`
anywhere any more, and adding one back breaks dark mode silently.

| Role | Token | Replaces |
|---|---|---|
| Page ground | `bg-surface` | — |
| Card | `bg-panel` | `bg-white` |
| Hover / fill | `bg-raised`, `bg-sunken` | `bg-black/5`, `bg-black/10` |
| Hairlines | `border-line-soft`, `border-line`, `border-line-strong` | `border-black/5 · /10 · /15` |
| Text | `text-ink` → `text-body` → `text-muted` → `text-faint` → `text-dim` | the `/80`…`/15` ladder |

**The light half of the text ladder is tuned to WCAG AA, not to taste.** On
`#faf8f5` nothing below 0.538 opacity clears 4.5:1. Measured: ink 17.9 · body
8.97 · muted 6.57 · faint 4.53 — all AA. **`text-dim` is 1.83:1 and does not
pass**; it is furniture only — dividers, empty stars, a letter with no artists
behind it. Never put words a reader needs into it.
| On a solid | `text-on-ink`, `text-on-accent`, `fill-on-accent` | `text-white` |
| Accent | `text-accent`, `bg-accent-soft` | `bg-accent/10` |

Only three literal colours survive, all deliberate: the scrim over a video
thumbnail and a modal backdrop stay dark in both themes, and `app/utils/avatar.js`
holds its own palette and explains why.

**Typography:** `font-mono` for anything musical — chord symbols, tab lines,
fret numbers, formulas. `font-sans` for prose. Sizes bottom out at
`text-[10px]` for diagram furniture.

**Pattern-match from:** `app/components/ChordDiagram.vue` (SVG + tokens),
`app/pages/izvodjac/[slug].vue` (page layout, sticky aside).

**Do NOT:** hardcode hex or px in a component, print a chord quality as a literal
word (it is a translation key — see §6), or add a locale key to one catalogue only.

---

## 5. Decision log

### 2026-08-27 — One dialog for both surfaces
- **What:** `AppModal.vue`, byte-identical in octava-app and octava-dashboard,
  replacing seven window.confirm/prompt calls and two hand-rolled overlays.
- **Why:** a native confirm cannot be styled, ignores the theme the reader
  chose, and on a phone renders as a system sheet that looks like it came from
  somewhere else. More to the point it is a yes/no with no room to say what is
  about to happen — which is exactly what a destructive action needs. Purging a
  song now shows the title beside the field that asks you to type it; a
  window.prompt could not.
- **Identical on purpose,** imports and all, so a fix in one is a copy away from
  the other. It uses explicit `import { ref, … } from 'vue'` even though Nuxt
  would auto-import them, because that is what makes the file portable.
- **Affects:** `LogoutButton`, `SongReviews`, `ReviewComments`, `ReportProblem`
  in the app; `ArrangementsPanel`, `BulkBar`, `TrashView`, `ArtistsView`,
  `SecurityView`, `ModerationView` in the dashboard.

### 2026-08-27 — The light text ladder was raised to meet AA
- **What:** `--text-faint` 0.40 → 0.54 and `--text-muted` 0.55 → 0.64.
- **Why:** faint was 2.83:1 against the 4.5:1 AA needs, and it carried real
  content at 85 sites — labels, hints, footer headings. Raising it forced muted
  up too, because 0.54 and the old 0.55 are the same colour.
- **Cost, accepted deliberately:** a visibly darker light mode and less
  separation between the steps — 8.97 / 6.57 / 4.53 rather than 8.97 / 4.69 /
  2.83. A hierarchy nobody can read is not one.
- **Also:** four places using `text-dim` for actual words moved to `text-faint`
  (the footer contact line, the "edited" marker on reviews and comments, the
  tuner's ±50 cent labels).
- **Affects:** `app/assets/css/main.css`, and the same block in the dashboard.

### 2026-08-27 — Dark mode through semantic tokens and `light-dark()`
- **What:** 541 literal colour utilities across 39 files collapsed onto 16 named
  roles. Each role is declared once with `light-dark(light, dark)`; which half
  applies is decided by `color-scheme` on :root.
- **Why:** `text-black/40` compiles to a literal `rgb(0 0 0 / 0.4)` that no
  variable can flip, so dark mode was impossible without touching every file
  anyway. Naming the role rather than the colour means the next theme — or a
  contrast fix — is one line in one file.
- **Alternatives rejected:** Tailwind's `dark:` variant, which would have meant a
  second class on all 541 sites and no single place to reason about the palette.
  A `@media (prefers-color-scheme)` block plus a `[data-theme]` block, which
  states every token twice and drifts.
- **Note:** the system preference needs *no JavaScript* — the server-rendered
  HTML already resolves correctly, so nothing can flash the wrong theme. The
  inline script in `app.vue` exists only to pin an explicit override.
- **Affects:** `app/assets/css/main.css`, `app/composables/useTheme.js`,
  `app/components/ThemeSwitcher.vue`, `app/app.vue`, and 37 components.

### 2026-08-27 — Chord fingerings are computed, not transcribed
- **What:** `app/utils/chordEngine.js` derives voicings from chord intervals and
  the tuning; `app/utils/chordShapes.js` states the movable CAGED forms that
  players actually expect. 324 chords, ~2300 fingerings, 7 per chord average.
- **Why:** the old `fingerings.js` was 37 shapes typed by hand. A song using
  `G/B` or `Fmaj7` got no diagram at all, and every new quality meant more
  hand-typing. Fingerings are functional facts about the instrument, so they are
  derivable — and a derived library can be *audited*, which a typed one cannot.
- **Alternatives rejected:** scraping pesmarica.rs — their compiled catalogue is
  their work, separate from the individual chords, and it would give worse
  coverage than generating. Pure search with no canonical layer — see §6.
- **Affects:** `app/utils/chordEngine.js`, `app/utils/chordShapes.js`,
  `ChordDiagram.vue`, `ChordGrid.vue`, `pages/akordi/index.vue`.
  `app/utils/fingerings.js` was deleted after verifying all 37 old shapes survive.

### 2026-08-27 — Initials instead of a shared silhouette
- **What:** artists without a photograph get their initials on a tinted circle,
  coloured deterministically from the name.
- **Why:** all 139 artists shared one grey icon, so a list read as a page that
  had failed to load. Real photographs are not obtainable — press images carry
  rights and there is no source to pull from.
- **Alternatives rejected:** a free hue from a name hash, which lands on colours
  that fight the terracotta accent. The palette is eight fixed muted tones.
- **Affects:** `app/utils/avatar.js`, `pages/izvodjac/[slug].vue`, `SearchBox.vue`.

---

## 6. Traps & gotchas

### An ASCII quote inside a template literal ends the HTML attribute
- **Symptom:** the dashboard would not compile — "Unterminated template" in
  ArtistsView, pointing at a line that looked fine.
- **Cause:** `:description="… `„${name}" …`"`. The straight quote closing the
  Bosnian pair terminated the attribute long before Vue saw the backtick.
- **Fix:** the typographic closing quote, which is the right character anyway.
- **Files:** `views/ArtistsView.vue`, `components/ArrangementsPanel.vue`.

### A scroll lock counter cannot live inside the component
- **Symptom:** scrolling came back while a dialog was still covering the page.
- **Cause:** the counter was declared in `<script setup>`, so every AppModal had
  its own. Several are mounted at once — the layout renders one LogoutButton for
  the desktop nav and another for the mobile drawer — and Teleport lifts each
  dialog out of its hidden container, so more than one can be live.
- **Fix:** the count lives on `document.body.dataset.modalCount`.
- **Files:** `components/AppModal.vue`.

### A dialog whose leave transition never finishes freezes the page
- **Symptom:** in a tab that is not compositing, `transitionend` never fires, so
  Vue never removes the element. A `fixed inset-0` overlay at opacity 0 then
  swallows every click with nothing on screen to explain it.
- **Fix:** the leave state also sets `pointer-events-none`, so a stalled overlay
  is at worst invisible rather than page-breaking.
- **Files:** `components/AppModal.vue`.

### Theme tokens must stay translucent where they composite
- **Symptom:** none yet — this is the reason the palette looks the way it does.
- **Cause:** `bg-raised` and the `border-line` weights sit both on cards and on
  the page ground. An opaque value would be right on one and visibly wrong on the
  other, and it would also change light mode, which this work deliberately left
  pixel-identical.
- **Fix:** only `--surface`, `--panel`, `--text-strong`, `--accent` and the
  `on-*` pairs are opaque. Everything else is `rgb(… / α)` on both sides.
- **Files:** `app/assets/css/main.css`.

### @nuxt/icon needs a restart when a component introduces new icons
- **Symptom:** three theme icons rendered as correctly sized but empty SVGs, and
  the server log carried `[Icon] failed to load icon`. The names were valid and
  present in `@iconify-json/material-symbols`.
- **Cause:** the icon bundle is built by scanning source. The running dev server
  had scanned before `ThemeSwitcher.vue` existed, so it had never seen them.
- **Fix:** restart `nuxt dev`. Worth knowing because the failure looks exactly
  like the *other* icon trap — a dynamic `:name` binding — and sends you editing
  correct code.
- **Files:** `app/components/ThemeSwitcher.vue`.

### A generated chord library still needs a canonical layer
- **Symptom:** the search happily returned `x x 3 2 1 1` for F and a thin
  three-string shape for Hm, instead of the barre everyone actually plays.
- **Cause:** "playable" and "the shape people expect" are different properties.
  Scoring weights that fixed F broke C and G, and vice versa.
- **Fix:** `chordShapes.js` states the expected form outright; the search fills
  in the positions around it. `canonical` shapes sort ahead of generated ones —
  sorting purely by fret position reintroduces the bug.
- **Files:** `app/utils/chordShapes.js`, `chordEngine.js` (`fingeringsFor`).

### Hand-typed chord shapes are wrong more often than they look
- **Symptom:** 84 fingerings did not contain the notes of the chord they claimed.
  `Cm11` sounded identical to `Cm7`; `Cdim7` was a plain diminished triad.
- **Cause:** every one was a movable form typed from memory. The generated ones
  cannot fail this way — they are built from the interval set.
- **Fix:** an audit that plays every fingering back and checks the pitch classes.
  Re-run it after touching `chordShapes.js`; it must report zero.
- **Files:** `app/utils/chordShapes.js`.

### A slash chord's bass need not belong to the chord
- **Symptom:** `G/B` produced no fingering at all.
- **Cause:** the search required every sounding note to be a chord tone, but
  `C/H`, `Am/G` and `D/F#` are ordinary chords whose bass sits outside the triad.
- **Fix:** the bass note is allowed as the one permitted outsider.
- **Files:** `chordEngine.js` (`voicings`).

### The tab line may not run digits together above fret 9
- **Symptom:** a shape up the neck printed as `x10910 8`, which reads as nonsense.
- **Fix:** join with spaces as soon as any fret reaches two digits.
- **Files:** `ChordDiagram.vue`.

### Accent-folding must not delete non-Latin scripts
- **Symptom:** a duplicate-detection pass grouped every Cyrillic-titled song
  under one key and would have deleted all but one.
- **Cause:** the fold ended with `replace(/[^a-z0-9]/g, '')`, which reduces a
  Cyrillic title to an empty string.
- **Fix:** strip Latin accents, keep letters of any script (`\p{L}`).
- **Files:** `octava-backend/src/utils/foldTitle.js`, `scripts/seed/dedupe.js`.

### Fixing the database is only half of a duplicate fix
- **Symptom:** 19 duplicate groups were cleaned, and the next import would have
  recreated every one of them.
- **Cause:** `rebuild.js` and `seed-from-titles.js` guarded with
  `Song.findOne({ title, artist })` — an exact match, so "Bele ruze" and
  "Bele ruže" were two different songs to them.
- **Fix:** both now compare on `foldTitle()`. Re-running `dedupe.js` afterwards
  must report zero groups; it does.
- **Files:** `scripts/seed/rebuild.js`, `scripts/seed/seed-from-titles.js`.

---

## 7. Open threads

- [ ] **Artist photographs — blocked on Mirnes.** 0 of 139 have one. Initials
      stand in. Upload lives in the dashboard (WebP, ≤10 KB).
- [ ] **Two songs point at an artist that no longer exists** — `jos-jednu-zoru`
      and `provjera-realm`, both `artist=6a8cdb4bf1c8dba32c0bb647`. They render
      with an empty artist name. Look like test fixtures; not deleted, because
      they hold real content and deletion is not reversible.
- [ ] **No ratings in the database**, so every star row shows "—".
- [ ] Turnstile is running on Cloudflare's *test* keys; real ones needed before
      the site is public.
- [ ] `octava-backend` and `octava-dashboard` have no AI-NOTES.md or AGENTS.md.

---

## 8. Anchor comments in code

| Tag | Use for |
|---|---|
| `AI-NOTE:` | Context a reader needs to not break this code |
| `AI-DECISION:` | Why it was built this way — link the AI-NOTES section |
| `AI-TRAP:` | A footgun; what happens if you "fix" it naively |
| `AI-TODO:` | Deliberate incomplete work, with what's missing |

```bash
rg 'AI-(NOTE|DECISION|TRAP|TODO):'
```

---

## 9. Session protocol

**Start:** read this file, then `rg 'AI-(NOTE|DECISION|TRAP|TODO):'` over the
area you are touching, then check §7.

**Before ending** — or when Mirnes says "do a recap": add a §5 entry for every
non-obvious choice with its *why*, a §6 entry for every trap that cost time,
update §4 if a visual pattern changed, update §7, drop anchor comments, bump the
date. Record failed approaches too — they are the entry most often forgotten.

The bar: a future session would make a worse decision without it.
