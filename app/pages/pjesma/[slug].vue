<script setup>
import { initials, avatarStyle } from '~/utils/avatar';
import { flagOf } from '~/utils/countries';

// Declared before the error branch below uses it: const is not hoisted,
// so a later declaration throws only on the 404 path — which ordinary
// testing never walks.
const { locale, t } = useI18n();
const route = useRoute();
const { $api } = useNuxtApp();
const config = useRuntimeConfig();

const auth = useAuthStore();
const favorites = useFavoritesStore();

// Fetched during SSR, so the chords are in the initial HTML. This is the whole
// reason the app renders on the server: search traffic lands directly here.
const { data, error } = await useAsyncData(
  // The version is part of the key: without it, switching would return the
  // cached payload of whichever chart was fetched first.
  () => `song-${route.params.slug}-${route.query.v || 'primary'}`,
  () => $api(`/songs/${route.params.slug}`, {
    params: route.query.v ? { arrangement: route.query.v } : undefined
  }),
  { watch: [() => route.query.v] }
);

if (error.value) {
  const status = error.value.statusCode || error.value.status;
  // Log the underlying failure; a generic 500 page hides why it broke.
  if (status !== 404) console.error('[song fetch]', error.value);

  throw createError({
    statusCode: status === 404 ? 404 : 500,
    statusMessage: status === 404 ? t('meta.songNotFound') : t('meta.loadError'),
    fatal: true
  });
}

const song = computed(() => data.value?.song);

const localePath = useLocalePath();
const toast = useToast();

const artistImgError = ref(false);
watch(() => song.value?._id, () => { artistImgError.value = false; });

const artistHasImage = computed(() => Boolean(song.value?.artist?.hasImage || song.value?.artist?.imageBytes));
const artistFlag = computed(() => song.value?.artist?.flag || flagOf(song.value?.artist?.country));

async function toggleFavorite() {
  if (!song.value) return;
  const wasSaved = favorites.has(song.value._id);
  await favorites.toggle(song.value._id);
  if (!wasSaved) {
    toast.show({
      title: song.value.title,
      artistName: song.value.artist?.name || '',
      artistId: song.value.artist?._id || '',
      hasImage: artistHasImage.value,
      message: t('song.songSaved'),
      type: 'song'
    });
  }
}

/**
 * Difficulty is stored as easy/medium/hard and translated here rather than in
 * the database, so the same record reads correctly in both catalogues.
 */
const DIFFICULTY_KEY = { easy: 'difficultyEasy', medium: 'difficultyMedium', hard: 'difficultyHard' };
const difficultyKey = computed(() => DIFFICULTY_KEY[song.value?.difficulty] || null);

const DIFFICULTY_CLASS = {
  easy:   'border-ok/25 bg-ok-soft text-ok',
  medium: 'border-warn/25 bg-warn-soft text-warn',
  hard:   'border-danger/25 bg-danger-soft text-danger'
};
const difficultyClass = computed(() => DIFFICULTY_CLASS[song.value?.difficulty] || '');

// Grouped by the reader's own locale: 1.849 in Bosnian, 1,849 in English.
const viewsLabel = computed(() => {
  const n = song.value?.views;
  if (typeof n !== 'number') return null;
  return { n, formatted: new Intl.NumberFormat(locale.value).format(n) };
});

// Transposition is deliberately component state, not a URL parameter: every
// key would otherwise be a separate crawlable URL with near-identical content.
const semitones = ref(0);
/**
 * Capo fret, 0 meaning none.
 *
 * AI-DECISION: starts at 0 even when the arrangement carries its own capo
 * value. Those 292 stored values came out of the import, not off a transcriber's
 * page, and the chords beside them are the sounding chords — so honouring one on
 * load would shift a song's displayed chords the moment it opened, for no reason
 * the reader could see. The stored value is offered in the suggestion list
 * instead, where it is a proposal rather than a silent edit.
 */
const capo = ref(0);
const { fontSize } = useSheetFontSize();
const showChords = ref(false);
const { active: splitColumns } = useSheetColumns();

import { transposeKey } from '~/utils/chordpro';
import { suggestions } from '~/utils/capo';

const soundingKey = computed(() => transposeKey(song.value?.originalKey, semitones.value));
const shapeKey = computed(() => transposeKey(song.value?.originalKey, semitones.value - capo.value));

const normalizedSemitones = computed(() => ((semitones.value % 12) + 12) % 12);
const capoHint = computed(() => {
  const fret = normalizedSemitones.value;
  if (fret < 1 || fret > 7) return null;
  return { fret, shapes: song.value?.originalKey };
});

const capoBestSuggestion = computed(() => {
  if (!song.value?.content) return null;
  const list = suggestions(song.value.content, semitones.value);
  const cur = list.find((r) => r.fret === capo.value);
  return list.find((r) => r.fret !== capo.value && r.ease > (cur?.ease || 0));
});

// These are what a search engine prints in its results, so they translate like
// anything else: the English catalogue was advertising itself in Bosnian.
// AI-TRAP: a literal | inside a translated message is vue-i18n's plural
// separator. 'X | Akordi za gitaru' parses as two plural forms, and calling
// t() on it with named arguments throws "Unexpected return type in composer"
// — a 500 on the page, not a formatting glitch. Escape it as {'|'} in the
// locale file, which is what song.metaTitle does.
const metaArgs = computed(() => ({
  title: song.value?.title || '',
  artist: song.value?.artist?.name || '',
  key: song.value?.originalKey || ''
}));

const title = computed(() => (song.value ? t('song.metaTitle', metaArgs.value) : 'Octava'));
const description = computed(() => (song.value ? t('song.metaDescription', metaArgs.value) : ''));

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'article'
});

/**
 * The picture that appears when the link is pasted into a chat. Built from the
 * song itself rather than one shared site image, because the point is that the
 * recipient sees which song it is before opening anything.
 *
 * Plain values, not a computed: these props are serialised into the image URL,
 * and a reactive ref serialises as a circular structure — which fails the page
 * itself, not just the picture.
 */
defineOgImage('Song', {
  title: song.value?.title || '',
  artist: song.value?.artist?.name || '',
  musicalKey: song.value?.originalKey || '',
  capo: song.value?.capo || 0,
  capoLabel: song.value?.capo ? `${t('song.capo')} ${t('song.capoFret', { n: song.value.capo })}` : '',
  difficulty: difficultyKey.value ? t(`song.${difficultyKey.value}`) : ''
});


/**
 * Tells Google which part of the sheet is withheld, and why that is not cloaking.
 *
 * AI-DECISION: without this, a paywall that serves less to a signed-out visitor
 * than to a subscriber can be read as cloaking, and Google's guidance is explicit
 * that such pages are dropped from results. Declaring the withheld part instead
 * is the sanctioned way to keep a paywall and stay indexed — the `cssSelector`
 * has to match the wrapper the locked sheet renders inside, so the class name
 * below and the one in the template are one thing, not two.
 *
 * AI-TRAP: `isAccessibleForFree` follows the request, not the site. A subscriber
 * genuinely is reading the whole page, and claiming otherwise would describe a
 * page that does not exist.
 */
const PAYWALL_SELECTOR = '.paywall';

useHead(computed(() => (song.value ? {
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title.value,
      description: description.value,
      isAccessibleForFree: !song.value.locked,
      ...(song.value.locked
        ? {
            hasPart: {
              '@type': 'WebPageElement',
              isAccessibleForFree: false,
              cssSelector: PAYWALL_SELECTOR
            }
          }
        : {})
    })
  }]
} : {})));


// Canonical and hreflang come from useLocaleHead in app.vue. A hard-coded
// canonical here pointed every English page at its Bosnian counterpart,
// which tells a search engine to index that one instead.
</script>

<template>
  <article v-if="song">
    <header class="mb-6">
      <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{{ song.title }}</h1>

      <div v-if="song.artist" class="mt-2.5 flex items-center gap-2.5">
        <NuxtLink
          :to="localePath(`/izvodjac/${song.artist.slug}`)"
          class="group inline-flex items-center gap-2.5 text-body hover:text-accent transition-colors"
        >
          <!-- Artist Avatar: Image with fallback initials -->
          <span class="relative inline-flex shrink-0">
            <img
              v-if="artistHasImage && !artistImgError"
              :src="`${config.public.apiBase}/artists/${song.artist._id}/image`"
              :alt="song.artist.name"
              class="size-8 sm:size-9 rounded-full object-cover ring-1 ring-line group-hover:ring-accent transition-all"
              @error="artistImgError = true"
            >
            <span
              v-else
              class="flex size-8 sm:size-9 select-none items-center justify-center rounded-full border border-line bg-surface/90 font-mono text-xs font-bold text-muted ring-1 ring-line-soft group-hover:border-accent group-hover:text-accent transition-all"
              aria-hidden="true"
            >
              {{ initials(song.artist.name) }}
            </span>
          </span>

          <!-- Artist Name and Flag -->
          <span class="text-base font-medium text-body group-hover:text-accent transition-colors">
            <span v-if="artistFlag" class="mr-1.5" :title="song.artist.country">{{ artistFlag }}</span>{{ song.artist.name }}
          </span>
        </NuxtLink>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <ul v-if="song.genres?.length" class="flex flex-wrap gap-1.5">
          <li v-for="genre in song.genres" :key="genre._id">
            <NuxtLink
              :to="localePath(`/zanr/${genre.slug}`)"
              class="rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-muted hover:border-accent hover:text-accent transition"
            >{{ genre.name }}</NuxtLink>
          </li>
        </ul>

        <span v-if="song.genres?.length && (difficultyKey || viewsLabel)" class="text-dim" aria-hidden="true">·</span>

        <p v-if="difficultyKey || viewsLabel" class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span
            v-if="difficultyKey"
            class="rounded-full border px-2 py-0.5 font-medium"
            :class="difficultyClass"
            :title="$t('song.difficultyLabel')"
          >{{ $t(`song.${difficultyKey}`) }}</span>

          <span v-if="difficultyKey && viewsLabel" class="text-dim" aria-hidden="true">·</span>

          <span v-if="viewsLabel">{{ $t('song.views', { n: viewsLabel.formatted }, viewsLabel.n) }}</span>
        </p>
      </div>
    </header>

    <VersionSwitcher
      data-print="hide"
      :arrangements="song.arrangements || []"
      :current="song.arrangementId"
    />

    <StarRating
      data-print="hide"
      class="mb-5"
      :slug="song.slug"
      :arrangement-id="song.arrangementId"
      :song-title="song.title"
      :artist-name="song.artist?.name"
      :artist-id="song.artist?._id"
    />

    <!-- Modern 2026 Sleek Glassmorphic Song Studio Controls Strip -->
    <div
      data-print="hide"
      class="mb-4 rounded-2xl border border-line/80 bg-panel/85 p-2 sm:p-2.5 backdrop-blur-xl shadow-md ring-1 ring-white/5 space-y-2"
    >
      <!-- Row 1: Primary Controls Toolbar (Pitch, Display, Actions) -->
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 sm:gap-3">
        <!-- Pitch Controls (Transpose & Capo) -->
        <div class="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-3">
          <TransposeControls v-model:semitones="semitones" :original-key="song.originalKey" />
          <span class="hidden sm:inline-block h-5 w-px bg-line/70" aria-hidden="true" />
          <CapoControls
            v-model:capo="capo"
            :semitones="semitones"
            :original-key="song.originalKey"
            :content="song.content"
          />
        </div>

        <!-- Display, Scroll & Action Buttons -->
        <div class="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 border-t lg:border-t-0 border-line-soft/80 pt-2 lg:pt-0">
          <div class="flex items-center gap-1.5 sm:gap-2.5">
            <FontSizeControl />
            <span class="hidden sm:inline-block h-5 w-px bg-line/70" aria-hidden="true" />
            <AutoScrollControl />
          </div>

          <span class="hidden sm:inline-block h-5 w-px bg-line/70" aria-hidden="true" />

          <!-- Action Buttons Group -->
          <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <!-- Print Button -->
            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-xl border border-line-soft bg-surface/80 text-muted transition-all duration-150 outline-none hover:border-line hover:bg-panel hover:text-accent shadow-2xs cursor-pointer"
              :title="$t('song.print')"
              @click="print()"
            >
              <svg viewBox="0 0 24 24" class="size-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9V3.5h12V9" stroke-width="1.5" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="6.5" rx="1" fill="currentColor" fill-opacity="0.12" />
                <path d="M9 16.5h6M9 18.5h4" stroke-width="1.2" />
                <circle cx="18" cy="11.5" r="1" fill="currentColor" />
              </svg>
              <span class="sr-only">{{ $t('song.print') }}</span>
            </button>

            <!-- Favorite Button -->
            <button
              v-if="auth.isAuthenticated"
              type="button"
              class="flex size-8 items-center justify-center rounded-xl border transition-all duration-150 outline-none shadow-2xs cursor-pointer"
              :class="favorites.has(song._id)
                ? 'border-accent/50 bg-accent-soft text-accent ring-1 ring-accent/30'
                : 'border-line-soft bg-surface/80 text-muted hover:border-line hover:bg-panel hover:text-accent'"
              :aria-pressed="favorites.has(song._id)"
              :title="favorites.has(song._id) ? $t('song.saved') : $t('song.save')"
              @click="toggleFavorite"
            >
              <svg viewBox="0 0 24 24" class="size-4 shrink-0" :fill="favorites.has(song._id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
              </svg>
              <span class="sr-only">{{ favorites.has(song._id) ? $t('song.saved') : $t('song.save') }}</span>
            </button>

            <NuxtLink
              v-else
              :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
              class="flex size-8 items-center justify-center rounded-xl border border-line-soft bg-surface/80 text-muted transition-all duration-150 outline-none hover:border-line hover:bg-panel hover:text-accent shadow-2xs"
              :title="$t('song.save')"
            >
              <svg viewBox="0 0 24 24" class="size-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
              </svg>
              <span class="sr-only">{{ $t('song.save') }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Row 2: Status & Capo Theory Footer -->
      <div
        v-if="capo > 0 || semitones !== 0 || capoBestSuggestion"
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 rounded-xl border border-line-soft bg-surface/60 px-3 py-1.5 text-xs font-mono"
      >
        <div class="flex items-center gap-2">
          <span v-if="capo > 0" class="text-muted">
            Sviraš oblike iz <strong class="text-accent">{{ shapeKey }}</strong>, zvuči kao <strong class="text-ink">{{ soundingKey }}</strong>
          </span>
          <span v-else-if="capoHint" class="text-muted">
            Isto zvuči: kapodaster na <strong>{{ capoHint.fret }}.</strong> pragu, sviraj oblike iz <strong class="font-mono text-ink">{{ capoHint.shapes }}</strong>
          </span>
          <span v-else-if="semitones !== 0" class="text-muted">
            Transponovano: {{ semitones > 0 ? `+${semitones}` : semitones }} polutonova od originala ({{ song.originalKey }})
          </span>
        </div>

        <div v-if="capoBestSuggestion && capo === 0" class="text-xs text-accent font-semibold">
          Lakše na <strong>{{ capoBestSuggestion.fret }}.</strong> polju: {{ capoBestSuggestion.shapes.join(' ') }}
        </div>
      </div>
    </div>

    <!-- Acoustic Playback Audio Hint -->
    <div class="mb-4 flex items-center gap-2 text-xs text-muted" data-print="hide">
      <span class="flex size-5 items-center justify-center rounded-md bg-accent-soft text-accent">
        <Icon name="material-symbols:volume-up-rounded" class="text-xs" />
      </span>
      <span>{{ $t('song.chordHear') }}</span>
    </div>

    <!--
      One sheet, and for a signed-out visitor every chord in it is already [X]
      and every word already x — the server sent nothing else. The wrapper is
      what the JSON-LD above names as the withheld part, and the blur inside
      ChordSheet is decoration over content that has already gone, never the
      thing protecting it.
    -->
    <div :class="song.locked ? 'paywall' : ''">
      <ChordSheet
        :content="song.content"
        :semitones="semitones"
        :capo="capo"
        :original-key="song.originalKey"
        :font-size="fontSize"
        :columns="splitColumns"
        :locked="song.locked"
      />
    </div>

    <!--
      The offer that follows the sheet, not a cover over hidden text.
    -->
    <SongPaywall
      v-if="song.locked"
      :reason="auth.isAuthenticated ? 'subscription_required' : 'login_required'"
    />

    <!-- Below the chords: the chart is what the page is for, and a player at
         the top would push it off the first screen. -->
    <SongVideo
      v-if="song.youtubeId"
      data-print="hide"
      :video-id="song.youtubeId"
      :title="song.title"
    />

    <!-- Under the chords and set small: the reader who needs this is a
         minority, and a form for them would sit in front of everyone else. -->
    <div data-print="hide" class="mt-4 flex justify-end">
      <ReportProblem :slug="song.slug" :arrangement-id="song.arrangementId" />
    </div>

    <!-- Below the chords, deliberately: someone opening this page came to
         play, and what other people thought is worth reading after that. -->
    <!-- AI-TRAP: not `hydrate-on-visible`. Deferring hydration here leaves the
           component frozen in its server-rendered state — the section renders,
           shows "Učitavanje…" and never resolves, because onMounted never runs
           and nothing fetches. Verified on the page, not assumed. -->
    <SongReviews data-print="hide" :slug="song.slug" />

    <RelatedSongs data-print="hide" :slug="song.slug" />

    <!-- Floating Interactive Tools Dock (Right Side: Clean Flex Column Stack) -->
    <div
      data-print="hide"
      class="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-40 flex flex-col items-end gap-2.5 sm:gap-3 pointer-events-none"
    >
      <DancingMetronome class="pointer-events-auto" />
      <DancingChords
        v-model="showChords"
        :content="song.content"
        :semitones="semitones"
        :capo="capo"
        :original-key="song.originalKey"
        :locked="song.locked"
        class="pointer-events-auto"
      />
    </div>
  </article>
</template>
