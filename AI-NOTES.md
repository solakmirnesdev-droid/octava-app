# AI-NOTES — octava-app

> **Entry file for every AI session on this project.** Read this first, before
> touching any code. Update it before you finish. It exists because context
> windows end and sessions reset — this file is the memory that survives.
>
> Single source of truth. [AGENTS.md](./AGENTS.md) points other tools here.

**Last updated:** 2026-08-30

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

---

## 3. Architecture

```
app/
├── assets/css/main.css      # Theme variables & typography
├── components/              # Vue components (ChordDiagram, ChordSheet, etc.)
├── composables/             # Shared state & hooks (useFloatingChords, etc.)
├── layouts/                 # default.vue with navigation & shell
├── pages/                   # File-based routing
├── plugins/                 # Nuxt plugins (api, native, etc.)
├── stores/                  # Pinia stores (auth, etc.)
└── utils/                   # Pure business logic (chordpro, chordEngine, chordAudio)
```

---

## 4. UI Design System & Styling Rules

**Typography:** `font-mono` for anything musical — chord symbols, tab lines,
fret numbers, formulas. `font-sans` for prose. Sizes bottom out at
`text-[10px]` for diagram furniture.

**Centralized UI Primitives & Utilities (`main.css`):**
- **Buttons:** `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`.
- **Form inputs:** `input-base`, `textarea-base`.
- **Cards:** `card-base`, `card-interactive` (with hover lift), `card-glass`, `card-gradient`.
- **Badges / Pills:** `badge-pill`, `badge-accent`, `badge-ok`, `badge-warn`, `badge-danger`.
- **Popovers / Menus:** `popover-surface`.
- **Global Popups & Transitions:**
  - `<Transition name="popup">` or `<Transition name="popover">` (spring-like scale `0.92 -> 1` and opacity curve `200ms in / 160ms out`).
- **Micro-physics:** `transition-lift`, `transition-press`.

**Atomic Vue Components (`app/components/`):**
- `<AppButton>`: Polymorphic button (NuxtLink / a / button) with `variant`, `size`, `loading`, `icon`.
- `<AppBadge>`: Status pills with `variant` (`neutral|accent|ok|warn|danger`), `dot`, `pulse`, `icon`.
- `<AppCard>`: Uniform card surfaces with `variant` (`default|interactive|glass|gradient|sunken`).
- `<AppInput>`: Form text/search/email input with label, required asterisk, icon, and error handling.

---

## 5. Decision log

### 2026-08-30 — Unified floating tools dock (eliminated button overlapping)

- **What:** Wrapped `DancingMetronome` and `DancingChords` inside a unified flex column container (`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 flex flex-col items-end gap-2.5 sm:gap-3`) in `pages/pjesma/[slug].vue`.
- **Why:** Previously, both components used independent `fixed` viewports and relied on a fragile global composable state `hasFloatingChords` with hardcoded pixel bottom offsets (`bottom-[4.5rem]`). Hydration timing and state mismatches caused the Metronome button to render directly on top of the Chords button, partially obscuring the chord count badge. Flex stacking provides a deterministic, zero-overlap layout.
- **Affects:** `app/pages/pjesma/[slug].vue`, `app/components/DancingChords.vue`, `app/components/DancingMetronome.vue`.

### 2026-08-30 — Fixed popup overlap and added vibrating subtle shadow on play

- **What:**
  1. Increased popup vertical clearance gap (`GAP = 10px`) and added a `ResizeObserver` on `ChordTooltip.vue` to ensure the popup never overlaps or obscures the underlying chord text.
  2. Added a subtle warm accent shadow vibration effect (`@keyframes popup-shadow-vibrate`) that oscillates synchronously with the strings during audio playback.
- **Affects:** `app/components/ChordTooltip.vue`, `app/components/ChordSheet.vue`.

### 2026-08-30 — Added speaker icon pulse and ripple animation on play

- **What:** Added `@keyframes speaker-icon-pulse` and `@keyframes speaker-ring-pulse` to the speaker audio badge in `ChordDiagram.vue`.
- **Behavior:** When the audio tone plays on click, the speaker icon badge pulses with a soundwave bounce and a subtle expanding ripple ring, without distorting or vibrating the card container.
- **Affects:** `app/components/ChordDiagram.vue`.

### 2026-08-30 — Removed oversized ambient pulse halo from ChordDiagram

- **What:** Removed `-inset-6 sm:-inset-8` acoustic pulse/wash overlay layers and shockwave rings from `ChordDiagram.vue`.
- **Why:** The pulse overlay was bleeding outside the card boundaries, creating a huge tinted rectangular box artifact around tooltips and popup cards on click.
- **Affects:** `app/components/ChordDiagram.vue`.
