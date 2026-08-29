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

**Centralized UI Primitives & Utilities (`main.css`):**
- **Buttons:** `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`.
- **Form inputs:** `input-base`, `textarea-base`.
- **Cards:** `card-base`, `card-interactive` (with hover lift), `card-glass`, `card-gradient`.
- **Badges / Pills:** `badge-pill`, `badge-accent`, `badge-ok`, `badge-warn`, `badge-danger`.
- **Popovers / Menus:** `popover-surface`.
- **Micro-physics:** `transition-lift`, `transition-press`.

**Atomic Vue Components (`app/components/`):**
- `<AppButton>`: Polymorphic button (NuxtLink / a / button) with `variant`, `size`, `loading`, `icon`.
- `<AppBadge>`: Status pills with `variant` (`neutral|accent|ok|warn|danger`), `dot`, `pulse`, `icon`.
- `<AppCard>`: Uniform card surfaces with `variant` (`default|interactive|glass|gradient|sunken`).
- `<AppInput>`: Form text/search/email input with label, required asterisk, icon, and error handling.

**Pattern-match from:** `app/components/ChordDiagram.vue` (SVG + tokens),
`app/pages/izvodjac/[slug].vue` (page layout, sticky aside).

**Do NOT:** hardcode hex or px in a component, print a chord quality as a literal
word (it is a translation key — see §6), or add a locale key to one catalogue only.

---

## 5. Decision log

### 2026-08-27 — A capo is a movable nut, and it never changes the key
- **What:** `app/utils/capo.js`, `app/components/CapoControls.vue`, and a `capo`
  prop on ChordSheet and ChordGrid. Picking a fret redraws the chord symbols as
  the shapes you finger there.
- **The arithmetic:** a capo raises all six open strings equally, so
  `sounding = shape + capo` and therefore `shape = sounding - capo`.
- **The two controls do opposite things and must stay independent.**
  Transposing moves the sounding pitch — the singer changes key. A capo moves
  only the left hand. So `sounding = originalKey + semitones`, with the capo
  playing no part, and `displayed = sounding - capo`. A capo that shifted the
  key would be a second, worse transpose control.
- **The readout says both halves** ("Hvataš u Am, a zvuči u Dm") because that
  sentence is the whole theory, and without it nothing on screen distinguishes
  the two controls.
- **Stored chords are the sounding chords.** `originalKey` equals the written
  root in all 292 songs carrying a capo value, so the arrangement's `capo` is a
  suggestion, never an offset already baked into the symbols. The control starts
  at 0 for that reason: honouring a stored value on load would shift a song's
  chords the moment it opened, for no reason the reader could see.
- **Frets clamp, keys wrap.** Transposition wraps at twelve because the keys are
  a circle; the capo clamps at 0 and 7, because frets are a line with a nut at
  one end and crowd together past the seventh.

### 2026-08-27 — The songbook page is for paper, and only public-domain songs
- **What:** `app/pages/pjesmarica.vue` (`/pjesmarica`, `/songbook`) collects
  every `javno-vlasnistvo` song that actually has chords onto one page, with a
  contents index and a page break per song.
- **Why:** the site is useless exactly where the songs get played — a cottage, a
  fire, a bus. Transposing, auto-scroll and chord audio are screen features and
  none of them survive losing the network; paper needs no battery and no bars.
- **Only public-domain songs, deliberately.** Not a technical limit: a print
  button over somebody else's transcription would be the site quietly doing what
  it declines to do everywhere else. Songs with an empty arrangement are skipped
  too — a blank leaf is indistinguishable from a printing failure.
- **Static ChordSheet, no controls.** The interactive props are left off rather
  than hidden at print time, so the page cannot drift back into being a screen.

### 2026-08-27 — Toast notification with artist avatar on save
- **What:** `AppToast.vue` and `useToast.js` composable for floating feedback
  when saving a song or artist to favorites.
- **Why:** Tapping the heart saved the item silently with only an icon fill
  change, which offered weak feedback especially on mobile. A floating card
  shows the artist portrait (or deterministic initial avatar fallback), the
  title, artist name, and a confirmation badge.
- **Affects:** `AppToast.vue`, `useToast.js`, `layouts/default.vue`,
  `pages/pjesma/[slug].vue`, `pages/izvodjac/[slug].vue`.

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

### 2026-08-27 — Navbar max-width expanded to max-w-7xl and lg breakpoint
- **What:** navbar container widened to `max-w-7xl` with `lg` desktop navigation breakpoint, and `SearchBox` given `min-w-[180px]` with `min-w-[280px]` popup width.
- **Why:** 9 nav buttons plus search and brand in `max-w-5xl` overflowed or squished the search box down to ~70px on intermediate/tablet viewports, collapsing the autocomplete dropdown.
- **Affects:** `app/layouts/default.vue`, `app/components/SearchBox.vue`.

### 2026-08-27 — Genre / Rubric page 2-column rich layout & SongList cards
- **What:** redesigned `zanr/[slug].vue` with a rich Hero Banner with watermark, Top 3 Spotlight hit cards, in-genre search filter, and a 2-column grid with a dedicated sidebar (Top Artists, Popular Keys, Related Genres). `SongList.vue` rows now include artist avatars, difficulty pill badges, and hover card styling.
- **Why:** a single flat list across 1280px created an empty void; the rich layout creates visual depth, active discovery, and engagement.
- **Affects:** `app/pages/zanr/[slug].vue`, `app/components/SongList.vue`, `octava-backend/src/controllers/genreController.js`.

### 2026-08-27 — Artists page portrait cards with avatars, flags, and overall rating
- **What:** redesigned `izvodjaci.vue` into a responsive 4-5 column portrait card grid with large avatars (`size-16 sm:size-20`), floating country flag badges, origin, song counts, and aggregated overall ratings.
- **Why:** 3-column flat rectangles were too wide, short, and lacked visual identity.
- **Affects:** `app/pages/izvodjaci.vue`, `octava-backend/src/controllers/artistController.js`.

### 2026-08-27 — Rating Toast popup with star badge and song context
- **What:** added toast feedback for rating actions (`StarRating.vue` & `RatingStars.vue`) using `AppToast.vue` with an amber star badge and explicit confirmation message (e.g. `Ocijenjeno sa 5 ★` or `Ocjena uklonjena`).
- **Why:** user requested immediate feedback popups for ratings similar to saving songs/artists.
- **Affects:** `app/components/AppToast.vue`, `app/components/StarRating.vue`, `app/components/RatingStars.vue`, `app/composables/useToast.js`.

### 2026-08-29 — Brand favicon and web icon suite
- **What:** Generated brand vector `favicon.svg`, multi-size `favicon.ico` (16, 32, 48), `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, and `site.webmanifest` in `public/`. Configured `<head>` in `nuxt.config.ts` and `app/app.vue` (and dashboard `index.html`).
- **Why:** The browser tab showed a generic globe icon because `public/` was empty and no favicon link tags were provided.
- **Visuals:** Uses the canonical terracotta rounded tile (`#b4472f`) with the white graphic equalizer icon matching the header brand logo.
- **Affects:** `public/`, `nuxt.config.ts`, `app/app.vue`, `octava-dashboard/public/`, `octava-dashboard/index.html`.

### 2026-08-29 — Centralized UI primitives and atomic component system
- **What:** Added centralized Tailwind 4 `@utility` classes in `main.css` (`btn-*`, `input-base`, `card-*`, `badge-*`, `popover-surface`, `transition-lift/press`) and atomic Vue components (`AppButton.vue`, `AppBadge.vue`, `AppCard.vue`, `AppInput.vue`). Refactored `prijava.vue`, `registracija.vue`, `zatrazi.vue`, `izvodjaci.vue`, `zanr/[slug].vue`, `SongList.vue`, and `default.vue`.
- **Why:** Replaces fragmented, ad-hoc inline styles with a single unified component and utility library, preventing drift in button paddings, border radiuses, card elevations, and hover animations.
- **Affects:** `app/assets/css/main.css`, `app/components/AppButton.vue`, `app/components/AppBadge.vue`, `app/components/AppCard.vue`, `app/components/AppInput.vue`, `app/components/SongList.vue`, `app/layouts/default.vue`, and auth/request/listing pages.

### 2026-08-29 — Redesigned review composer, cards, and comment replies
- **What:** Rebuilt `SongReviews.vue` and `ReviewComments.vue` using `AppCard`, `AppButton`, `AppBadge`, `input-base`, `textarea-base`, and `UserAvatar`. Added an author composer card with live character count (`draft.length / 4000`), highlighted "Tvoja recenzija" glass card with edit/delete quick actions, and sunken reply threads with collapsible animations.
- **Why:** Replaced plain, flat review inputs with modern, accessible cards reusing the design system.
- **Affects:** `app/components/SongReviews.vue`, `app/components/ReviewComments.vue`, `app/components/UserAvatar.vue`.

### 2026-08-29 — Responsive song controls and playback toolbar
- **What:** Refactored song playback & pitch toolbar on `pjesma/[slug].vue`, `TransposeControls.vue`, and `CapoControls.vue` with responsive breakpoints, grouped segmented controls (Pitch & Capo / Display & Autoscroll / Action cluster), and full-width formatted capo theory footer ribbon.
- **Why:** Prevented uneven wrapping, button collisions, and awkward whitespace on mobile and tablet viewport widths.
- **Affects:** `app/pages/pjesma/[slug].vue`, `app/components/TransposeControls.vue`, `app/components/CapoControls.vue`.

### 2026-08-29 — Floating Dancing Chords Companion
- **What:** Replaced the intrusive inline chord diagrams block with a floating companion widget (`DancingChords.vue`) positioned right above the `DancingMetronome.vue` button. Features a playful rhythmic vibrato animation (`chordIdleDance` / `chordActiveDance`), chord count indicator badge, instrument selector (Gitara, Ukulele, Bas), clickable audio strum previews, position switchers, and outside-click dismiss.
- **Why:** Keeps chord reference diagrams easily accessible anywhere while scrolling through a song without disrupting the vertical lyrics layout.
- **Affects:** `app/components/DancingChords.vue`, `app/pages/pjesma/[slug].vue`.

### 2026-08-29 — Realistic Metronome Pendulum Needle Tilt Animation
- **What:** Updated `MetronomeIcon.vue` and `DancingMetronome.vue` so the pyramid casing remains grounded and stable while the pendulum wand (wand + sliding tempo bob + pivot anchor) swings back and forth left-right from the base anchor `(12, 17)`.
- **Why:** Delivers realistic mechanical metronome physics where the needle ticks left and right across the tempo scale.
- **Affects:** `app/components/MetronomeIcon.vue`, `app/components/DancingMetronome.vue`.

### 2026-08-29 — Automatic Default 2-Column Sheet Layout
- **What:** Removed manual two-column toggle icon from song controls toolbar. `useSheetColumns.js` and `ChordSheet.vue` now automatically split the song lyrics into two columns by default whenever viewport width is wide enough (`>= 1024px`), while retaining clean 1-column layout on phones and tablets.
- **Why:** Eliminates toolbar clutter while providing optimal reading width and minimal vertical scrolling by default on desktop screens.
- **Affects:** `app/composables/useSheetColumns.js`, `app/pages/pjesma/[slug].vue`.

### 2026-08-29 — Redesigned Artist Profile Card (Hero Bento Glass Aesthetic)
- **What:** Modernized the artist profile card in `izvodjac/[slug].vue` following 2026 music streaming patterns (Spotify/Apple Music): added ambient radial hero glow, glowing ring avatar with drop-shadowed flag badge, 3-column bento micro-tiles (Songs, Rating, Views), unified `AppButton` save CTA, interactive `AppBadge` genre tags, highlighted dominant musical keys with proportional pills, clean timeline rows, and refined attribution.
- **Why:** Replaces flat, plain form-like elements with a cohesive, premium editorial card.
- **Affects:** `app/pages/izvodjac/[slug].vue`.

### 2026-08-29 — Viewport-bounded Popover Heights
- **What:** Constrained `DancingChords.vue` and `DancingMetronome.vue` floating popover cards with `max-h-[calc(100dvh-10.5rem)]` and `overflow-y-auto` dynamically derived from their bottom trigger offset.
- **Why:** Prevents floating cards from overflowing and clipping past the top of the viewport on laptops, compact screens, or mobile browser address bars.
- **Affects:** `app/components/DancingChords.vue`, `app/components/DancingMetronome.vue`.

### 2026-08-29 — Balanced Responsive Redesign of StarRating Card
- **What:** Replaced the rigid 12-column 3-block grid in `StarRating.vue` with a fluid 2-zone responsive layout. The left wing houses the amber score badge (`★ 3.0`), title, count, inline verification badges (`Tonalitet`, `Tekst`, `Harmonizacija`), and live rating feedback subtitle; the right wing houses interactive stars with micro-animations and a sleek retract button.
- **Why:** Eliminated clumsy 2-line badge wrapping and vertical misalignment on medium viewports, keeping the card compact and visually balanced across all resolutions.
- **Affects:** `app/components/StarRating.vue`, `app/components/AutoScrollControl.vue`.

### 2026-08-29 — Floating Companion Buttons Pushed to Bottom of Viewport
- **What:** Positioned `DancingChords.vue` at the very bottom right (`bottom-4 sm:bottom-6 right-4 sm:right-6`) and `DancingMetronome.vue` directly above it (`bottom-[4.5rem] sm:bottom-[5.25rem] right-4 sm:right-6`). Updated popover max-heights to `max-h-[calc(100dvh-5rem)]` and `max-h-[calc(100dvh-7.5rem)]`.
- **Why:** Keeps floating action widgets unobtrusively anchored at the bottom corner of the viewport without taking up valuable middle-screen space.
- **Affects:** `app/components/DancingChords.vue`, `app/components/DancingMetronome.vue`.

### 2026-08-29 — Compact Chord Sizing and Non-Overlapping Left Popover Placement
- **What:** Added `compact` prop to `ChordDiagram.vue` for sharper, smaller fretboard grids and typography; shifted floating popovers in `DancingChords.vue` and `DancingMetronome.vue` to the left (`right-3 sm:right-20`) so open popups sit beside the buttons without obscuring them.
- **Why:** Keeps the full button stack visible and interactive while displaying a clean, compact companion panel.
- **Affects:** `app/components/ChordDiagram.vue`, `app/components/DancingChords.vue`, `app/components/DancingMetronome.vue`.

### 2026-08-29 — Glassmorphic Design for In-Lyric Chord Hover Tooltip
- **What:** Upgraded `ChordTooltip.vue` container with `rounded-2xl border border-line bg-panel/90 p-2.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10` and compact diagram proportions.
- **Why:** Harmonizes the in-text chord hover/click popover with the design system's glass aesthetic across song and profile cards.
- **Affects:** `app/components/ChordTooltip.vue`.

### 2026-08-29 — 3-Column Responsive Song Sheet Layout
- **What:** Replaced hardcoded `columns-2 max-w-3xl` in `ChordSheet.vue` with `columns-1 md:columns-2 xl:columns-3 max-w-full gap-8 md:gap-10 xl:gap-12`, expanded default layout `<main>` container to `max-w-6xl xl:max-w-7xl`, and adjusted `useSheetColumns.js` to activate from 768px.
- **Why:** When playing guitar or enlarging font sizes, 3 columns allow the song to spread across wide desktop/laptop screens and fit entirely within the viewport without requiring vertical scrolling while holding the instrument.
- **Affects:** `app/components/ChordSheet.vue`, `app/composables/useSheetColumns.js`, `app/layouts/default.vue`.

### 2026-08-29 — Metronome Needle Parked State & Synchronized Swing
- **What:** Updated `MetronomeIcon.vue` and `DancingMetronome.vue` so that when the metronome is turned off/stopped, the needle rests firmly parked at the far left latch position (`rotate(-28deg)`) with no animation. When started, the needle swings left-to-right (`-28deg` to `+28deg`) strictly synchronized with the metronome BPM (`animationDuration = (60 / bpm) + 's'`).
- **Why:** Eliminates false idle animations when the metronome is not running, and provides clear visual mechanical feedback when active.
- **Affects:** `app/components/MetronomeIcon.vue`, `app/components/DancingMetronome.vue`.

### 2026-08-29 — Profile Header Dropdown Menu
- **What:** Converted the desktop header Profile link into an interactive glassmorphic dropdown menu (`default.vue`) containing user avatar summary (username + email), "Uredi profil" (`/profil`), "Sačuvano" (`/sacuvano`), and "Odjavi se" with an `AppModal` confirmation prompt. Added click-outside, Escape key, and route-change close handlers.
- **Why:** Replaces flat header links with a modern profile hub for fast navigation to account settings, saved favorites, and sign-out.
- **Affects:** `app/layouts/default.vue`, `i18n/locales/bs.json`, `i18n/locales/en.json`.

### 2026-08-29 — Metronome Floating Badge Audio Beat Pulse Synchronization
- **What:** Replaced generic 1s CSS loop `animate-ping` with a reactive `:key="beat"` pulse ring on the `DancingMetronome.vue` active badge. Rings expand and flash on every audio click scheduled in Web Audio (gold on accent beat 0, coral on sub-beats).
- **Why:** Delivers precise real-time visual synchrony with every audible metronome beep.
- **Affects:** `app/components/DancingMetronome.vue`.

### 2026-08-29 — Navigation Tuner Label Rename ("Uštimaj")
- **What:** Changed `nav.tuner` in `i18n/locales/bs.json` from `"Štimer"` to `"Uštimaj"`.
- **Why:** Matches the active imperative verb pattern across the navigation items ("Zatraži", "Uštimaj").
- **Affects:** `i18n/locales/bs.json`.

### 2026-08-29 — Mobile Full-Height Slide-in Navigation Drawer
- **What:** Replaced in-flow vertical collapsing accordion with a full-height (`h-dvh`), left-to-right sliding drawer (`<Teleport to="body">`) with a frosted backdrop blur scrim (`bg-black/65 backdrop-blur-xs`), smooth cubic-bezier slide transitions, body scroll-lock management, drawer header with logo and close trigger, mobile search box, category tags, and account footer.
- **Why:** Delivers a modern mobile app feel without pushing or reflowing the page content underneath.
- **Affects:** `app/layouts/default.vue`.

### 2026-08-29 — Song Studio Controls Toolbar Redesign & Redundant Chord Button Removal
- **What:** Overhauled the song page toolbar (`TransposeControls.vue`, `CapoControls.vue`, `FontSizeControl.vue`, `AutoScrollControl.vue`, and `[slug].vue`) from bulky text buttons into high-precision, tactile glassmorphic stepper pills (`bg-surface/80 border border-line-soft hover:border-line`). Removed duplicate chords grid toggle from the top toolbar because the floating `DancingChords.vue` companion button handles song chords on demand.
- **Why:** Replaces cluttered, heavy boxes with a lightweight, professional music studio toolbar designed for effortless touch and desktop interaction while holding a guitar.
- **Affects:** `app/components/TransposeControls.vue`, `app/components/CapoControls.vue`, `app/components/FontSizeControl.vue`, `app/components/AutoScrollControl.vue`, `app/pages/pjesma/[slug].vue`.

### 2026-08-29 — Dancing Chords Header Enlargement & Right Action Alignment
- **What:** Redesigned the header in `DancingChords.vue`: enlarged the fretboard icon container to `size-9.5` (`<ChordIcon size="1.45em" />`), updated the title from sentence case to `"Akordi u pjesmi"` (`song.songChords`), and neatly grouped the count badge (`{{ playable.length }}`) alongside the close `X` button on the far right.
- **Why:** Prevents multi-line title wrapping and awkwardly placed count indicators, creating a clean, balanced studio popover header.
- **Affects:** `app/components/DancingChords.vue`, `i18n/locales/bs.json`, `i18n/locales/en.json`.

### 2026-08-29 — Unrated Song Card Label ("Nije ocijenjeno")
- **What:** Replaced the dash `'—'` in `RatingStars.vue` for unrated songs with localized `"Nije ocijenjeno"` (`rating.unrated` in `bs.json` / `"Not rated"` in `en.json`).
- **Why:** Clarifies that a song has not yet received community votes rather than showing an ambiguous dash next to empty stars.
- **Affects:** `app/components/RatingStars.vue`, `i18n/locales/bs.json`, `i18n/locales/en.json`.

### 2026-08-29 — Singer / Artist Navigation Icon Update
- **What:** Redesigned `SingerIcon.vue` to depict a person/singer performing into a stage microphone rather than a standalone voice microphone capsule.
- **Why:** Avoids user confusion with voice recording / microphone permissions buttons and clearly represents musicians, artists, and singers.
- **Affects:** `app/components/SingerIcon.vue`, `app/layouts/default.vue`, `app/pages/izvodjaci.vue`, `app/pages/sacuvano.vue`.

### 2026-08-29 — Genre Page Hero Header Layout Revamp
- **What:** Replaced the wide 2-wall split header on `app/pages/zanr/[slug].vue` with a cohesive, balanced studio card: added a prominent genre category badge (`size-16` with gradient ring), curated lead description, and integrated metric chips (`[ songs ] [ artists ] [ tonalities ]`) inline directly below the title.
- **Why:** Eliminates the wide empty void in the middle of the genre banner across desktop screens and presents a rich, unified category overview.
- **Affects:** `app/pages/zanr/[slug].vue`.

### 2026-08-29 — Suppressed Native WebKit Search Cancel Button
- **What:** Added global CSS in `main.css` targeting `input[type="search"]::-webkit-search-cancel-button` to suppress the browser's default bold white cancel button.
- **Why:** Prevents duplicate clear `X` buttons from appearing inside search inputs alongside the custom Vue clear button.
- **Affects:** `app/assets/css/main.css`.

### 2026-08-29 — Tactile Audio Ripple Effect on Chord Diagram Play
- **What:** Added animated expanding acoustic orange ripple rings, speaker ping pulse, and subtle glowing dot drop-shadows to `ChordDiagram.vue` whenever a chord is clicked or strummed.
- **Why:** Provides immediate, satisfying visual feedback synchronized with the chord playback audio.
- **Affects:** `app/components/ChordDiagram.vue`, `app/components/ChordTooltip.vue`, `app/components/DancingChords.vue`, `app/pages/akordi/index.vue`.

### 2026-08-29 — Added Missing Stepper Icons to Client Icon Bundle
- **What:** Added `material-symbols:add-rounded`, `material-symbols:remove-rounded`, `material-symbols:volume-up-rounded`, and other dynamically referenced icons to `clientBundle.icons` in `nuxt.config.ts`.
- **Why:** Nuxt Icon with client bundling only precompiles icons explicitly listed in `clientBundle.icons`, causing `+` and `-` stepper icons to be missing on client render.
- **Affects:** `nuxt.config.ts`, `app/components/TransposeControls.vue`, `app/components/CapoControls.vue`, `app/components/AutoScrollControl.vue`.

### 2026-08-29 — Authentication Pages Studio Suite Redesign
- **What:** Overhauled `app/pages/prijava.vue`, `registracija.vue`, `zaboravljena-lozinka.vue`, and `nova-lozinka.vue` with elevated 2026 glassmorphic studio cards (`backdrop-blur-2xl bg-panel/90 rounded-3xl border border-line ring-1 ring-white/10 shadow-2xl`), ambient lighting backdrops, brand monogram badges, and integrated Google OAuth buttons inside the card container.
- **Why:** Replaces barebones raw unstyled floating forms with a state-of-the-art, trustworthy sign-in and registration experience consistent with the Octava design system.
- **Affects:** `app/pages/prijava.vue`, `app/pages/registracija.vue`, `app/pages/zaboravljena-lozinka.vue`, `app/pages/nova-lozinka.vue`.

### 2026-08-29 — In-Input Eye Icon for Password Reveal
- **What:** Replaced the external text toggle button ("Prikaži"/"Sakrij") in `PasswordField.vue` with an interactive eye icon (`material-symbols:visibility-outline-rounded` and `material-symbols:visibility-off-outline-rounded`) aligned inside the right side of the password input.
- **Why:** Delivers standard modern UX for password visibility without cluttering label headers or breaking horizontal alignments.
- **Affects:** `app/components/PasswordField.vue`, `nuxt.config.ts`.

### 2026-08-29 — Textarea & Input Icon Scale Alignment
- **What:** Upgraded input and textarea icons across `app/pages/zatrazi.vue` and `app/components/SongReviews.vue` from small 16px glyphs to prominent `text-xl` / `text-2xl` vectors, properly aligned with `pl-11`/`pl-12` padding, character counts, and height proportions.
- **Why:** Eliminates awkward clipping and cramped text fields, creating spacious, professional input cockpits.
- **Affects:** `app/pages/zatrazi.vue`, `app/components/SongReviews.vue`, `nuxt.config.ts`.

### 2026-08-29 — Interactive Mouse & Touch Dragging for Metronome Counterweight
- **What:** Added interactive pointer event handlers (`onWeightPointerDown`, `pointermove`, `pointerup`) to the mechanical metronome pendulum in `app/pages/metronom.vue`. Users can drag the terracotta counterweight up and down the metallic rod or click anywhere along the tempo scale track to adjust BPM from 40 to 240 smoothly with continuous visual feedback.
- **Why:** Delivers authentic physical feedback mimicking a real mechanical metronome while pausing swing during dragging for precise tempo placement.
- **Affects:** `app/pages/metronom.vue`.

### 2026-08-29 — Whole-Card Acoustic Ripple & Pulse on Chord Strum
- **What:** Upgraded chord play animations across `ChordTooltip.vue` and `ChordGrid.vue` so that when a chord is clicked or strummed, the entire outer card expands with a subtle physical pulse (`.chord-card-pulse`), glowing terracotta border ring, and expanding concentric shockwave ripples around the full perimeter of the card.
- **Why:** Replaces small internal-only animations with a satisfying tactile card-level ripple that mirrors the acoustic resonance of playing a real instrument.
- **Affects:** `app/components/ChordTooltip.vue`, `app/components/ChordDiagram.vue`, `app/components/ChordGrid.vue`.

### 2026-08-29 — AppModal Redesign to Match Studio System
- **What:** Overhauled `app/components/AppModal.vue` with `rounded-3xl border border-line bg-panel/95 backdrop-blur-2xl ring-1 ring-white/10 shadow-2xl`, ambient background glow, tone-aware icon monogram badges (`logout`, `warning`, `info`), and modern pill action buttons.
- **Why:** Replaced legacy blocky `rounded-xl` dialog with raw `bg-ink text-on-ink` buttons that looked unstyled and clashed with the rest of the application.
- **Affects:** `app/components/AppModal.vue`, `app/components/LogoutButton.vue`.

### 2026-08-29 — Auth Suite Brand Identity & Lighting Refinement
- **What:** Replaced generic lock icons across `prijava.vue`, `registracija.vue`, `zaboravljena-lozinka.vue`, and `nova-lozinka.vue` with the official Octava graphic-eq brand header and logo badge. Added a large, subtle graphic-eq watermark glowing behind the card blur. Softened heavy ambient light blobs from `blur-3xl` to crisp `blur-2xl` and calibrated card backdrop blur. Fixed missing `auth.password` i18n keys.
- **Why:** Delivers strong brand recognition and crisp visual hierarchy without muddy over-blurred background artifacts.
- **Affects:** `app/pages/prijava.vue`, `app/pages/registracija.vue`, `app/pages/zaboravljena-lozinka.vue`, `app/pages/nova-lozinka.vue`, `i18n/locales/bs.json`, `i18n/locales/en.json`.

### 2026-08-29 — Smooth Strum Glow Calibration (No Shake)
- **What:** Calibrated the chord strumming feedback across `ChordTooltip.vue`, `ChordGrid.vue`, and `ChordDiagram.vue`. Eliminated physical `scale` jumping / shaking so cards remain rock steady in place. Retained a prominent, elegant terracotta halo border ring (`border-accent ring-2 ring-accent/50 shadow-[0_0_24px_rgba(224,90,58,0.35)]`) and a rich inner acoustic glow across fretboard dots and diagram elements.
- **Why:** Delivers prominent visual acoustic feedback without dizzying motion or layout jumping.
- **Affects:** `app/components/ChordTooltip.vue`, `app/components/ChordDiagram.vue`, `app/components/ChordGrid.vue`.

### 2026-08-29 — Chords Directory Unified Studio Toolbar
- **What:** Overhauled the chords directory header and controls in `app/pages/akordi/index.vue`. Replaced the full-width search input with a compact, properly sized search box unified with the root note quick-filter chips on the same horizontal toolbar card. Moved the instrument switcher (`Gitara`, `Bas`, `Ukulele`) to the header right zone.
- **Why:** Removes massive empty space in the search bar and collapses 3 vertical rows into a sleek, unified studio cockpit.
- **Affects:** `app/pages/akordi/index.vue`.

### 2026-08-29 — Full Card Clickable Hitbox & Unified Strum Glow
- **What:** Removed narrow `max-w-[155px]` constraints inside `ChordDiagram.vue` so it spans 100% of parent card containers with full-bleed `w-full h-full` hit area. Connected `@play` and `ringingChord` state tracking across `app/pages/akordi/index.vue`, `ChordGrid.vue`, `ChordTooltip.vue`, and `DancingChords.vue` so clicking anywhere on the outer card plays the audio and illuminates the entire card with a steady terracotta halo ring. Positioned the audio speaker icon in the true top-right corner with `px-6` title breathing room.
- **Why:** Ensures clicking card edges, padding, and headers triggers audio playback with complete visual feedback without dead click zones or misaligned corner glyphs.
- **Affects:** `app/components/ChordDiagram.vue`, `app/pages/akordi/index.vue`, `app/components/ChordGrid.vue`, `app/components/DancingChords.vue`.

### 2026-08-29 — Artists Directory Visual Overhaul
- **What:** Modernized `/izvodjaci` cards and filter hub in `app/pages/izvodjaci.vue`. Replaced raw circle initials avatars with stylized rounded squircle gradient portraits with warm border highlights, encapsulated the country flag into a subtle backdrop badge, added origin pill badges, separated stats into distinct micro-badges, and wrapped the alphabet scrubber in a clean segmented track.
- **Why:** Removes harsh monochrome contrast and dead boxy space, giving the artist directory a rich studio aesthetic.
- **Affects:** `app/pages/izvodjaci.vue`.

### 2026-08-29 — Instant Hover Tooltip Positioning (No Slide From 0,0)
- **What:** Replaced `transition-all` on the fixed-position `ChordTooltip.vue` with targeted `transition-[border-color,box-shadow,background-color]`.
- **Why:** `transition-all` interpolated the `top` and `left` properties when mounting from the default `(0, 0)` coordinates to the anchor position, causing the tooltip to fly/dash across the screen on every hover.
- **Affects:** `app/components/ChordTooltip.vue`.

### 2026-08-29 — Song Recognition Studio Overhaul
- **What:** Overhauled `app/pages/prepoznaj.vue` from two disjointed boxes into a unified modern Audio Recognition Studio. Features a central listening orb with animated acoustic radar wave rings, background equalizer watermark, countdown indicators, rich track match cards with direct chord links, and studio feature guides.
- **Why:** Delivers a premium Shazam-grade recognition experience aligned with the rest of the Octava suite.
- **Affects:** `app/pages/prepoznaj.vue`.

### 2026-08-29 — Global Mobile Responsiveness & Studio Polish
- **What:** Globally optimized mobile viewports, touch targets, and ergonomics:
  1. Set base 16px font size on touch inputs (`text-base sm:text-sm`) in `@utility input-base` and form controls to prevent iOS Safari auto-zoom distortion on focus.
  2. Added CSS fade masks (`[mask-image:linear-gradient(...)]`) to horizontal scroll tracks (genre pill bar, alphabet scrubber, chord root notes) for clear swipe affordance.
  3. Added mobile quick-search launcher button on `<sm` viewports and enhanced `/pretraga` into a dedicated full-page search studio.
  4. Added click-outside dismiss listeners for Transpose and Capo popovers.
  5. Refined mobile navigation drawer with structured account summary and touch-friendly navigation tiles.
- **Why:** Delivers a seamless, native-app feel across all mobile devices (from 320px screens to large tablets).
- **Affects:** `app/assets/css/main.css`, `app/layouts/default.vue`, `app/components/SearchBox.vue`, `app/pages/pretraga.vue`, `app/components/TransposeControls.vue`, `app/components/CapoControls.vue`, `app/pages/izvodjaci.vue`, `app/pages/akordi/index.vue`, `app/pages/profil.vue`.

### 2026-08-29 — StarRating SSR Prefetching (Eliminate Cumulative Layout Shift)
- **What:** Converted `StarRating.vue` from client-side `onMounted(load)` to asynchronous SSR prefetching using `await useAsyncData(...)`.
- **Why:** `onMounted(load)` initialized `rating` as `null` during server rendering, causing `<StarRating>` to be absent in the initial SSR HTML. Once mounted on the client, the card popped into existence after hydration, pushing the controls toolbar and chord sheet down by ~75px (Cumulative Layout Shift). With SSR prefetching, the complete card is embedded in the initial server HTML with 0 layout shift.
- **Affects:** `app/components/StarRating.vue`, `app/pages/pjesma/[slug].vue`.

### 2026-08-29 — Linear Transposition Ribbon ("Lenta") (-5 to +6)
- **What:** Replaced the multi-row grid dropdown in `TransposeControls.vue` with a single-row horizontal ribbon ("lenta") ordered linearly from `-5` to `+6`. On open, it automatically smooth-scrolls to center the currently active key with edge swipe affordances.
- **Why:** Delivers a continuous, tape-like scrubber ("lenta") matching musical pitch intuition without multi-row grid fragmentation.
- **Affects:** `app/components/TransposeControls.vue`.

### 2026-08-29 — Enhanced Multi-layered Acoustic Resonance Ripple
- **What:** Increased the scale, glow radius, and concentric ring structure of the playback ripple in `ChordDiagram.vue` (`size-40`/`size-48` glow wave, dual staggered expanding ripple rings with up to `2.6x` scale expansion).
- **Why:** Produces an expressive acoustic visual response across the entire chord card when strumming.
- **Affects:** `app/components/ChordDiagram.vue`.

### 2026-08-29 — Chord Catalogue Instrument Switcher Redesign
- **What:** Redesigned the instrument switcher segmented control in `akordi/index.vue`: integrated dedicated fretboard icons (`<GuitarIcon>`, `<BassIcon>`, `<UkuleleIcon>`), separated tuning letters into dedicated inner tag pills (`bg-black/20 font-black` when selected, `bg-panel/80` when unselected), and improved container glassmorphic padding.
- **Why:** Replaces plain squished text with a polished, distinct studio instrument selector.
- **Affects:** `app/pages/akordi/index.vue`.

---

## 6. Traps & gotchas

### Strumming a diagram under a capo plays the wrong chord
- **Symptom:** with a capo set, pressing a chord would sound the shape rather
  than the chord the guitar in your hands actually makes — press Am at capo 5
  and hear Am instead of Dm.
- **Cause:** a diagram's fret numbers are measured from the capo, not the nut. A
  string marked open is stopped at the capo's fret. Strumming the numbers as
  written ignores that.
- **Fix:** `strum(frets, { capo })` adds the capo fret to every string before
  converting to MIDI. Verified: the Am shape at capo 5 sounds D F A, and the
  open strings become A D G C E A.
- **Why it matters:** the sound is the one thing a player checks against their
  own singing, and this failure is silent on screen.
- **Files:** `app/utils/chordAudio.js`, `app/components/ChordSheet.vue`.

### "Capo 1 for a song in F" is a rule of thumb that scores badly
- **Symptom:** the first version of the capo test asserted that a song in F
  plays more easily at fret 1. The scorer disagreed, and the scorer was right.
- **Cause:** F/B flat/C/Dm at fret 1 gives E, A, H, C#m — H major is a barre and
  C#m is worse. The rule only holds for the bare I chord.
- **The real answer** is fret 3 (D G A Hm) or fret 5 (C F G Am), both 88%, tie
  broken to the lower fret. Keep the scorer, not the rule.
- **Files:** `app/utils/capo.js`.

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
