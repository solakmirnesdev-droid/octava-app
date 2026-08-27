<script setup>
// Declared before the error branch below uses it: const is not hoisted,
// so a later declaration throws only on the 404 path — which ordinary
// testing never walks.
const { locale, t } = useI18n();
const route = useRoute();
const { $api } = useNuxtApp();

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

async function toggleFavorite() {
  if (!song.value) return;
  const wasSaved = favorites.has(song.value._id);
  await favorites.toggle(song.value._id);
  if (!wasSaved) {
    toast.show({
      title: song.value.title,
      artistName: song.value.artist?.name || '',
      artistId: song.value.artist?._id || '',
      hasImage: Boolean(song.value.artist?.hasImage || song.value.artist?.imageBytes),
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
const { fontSize } = useSheetFontSize();
const showChords = ref(false);
const { columns, wideEnough, active: splitColumns, toggle: toggleColumns } = useSheetColumns();

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
 * song itself rather than one shared site image, because the whole point is
 * that the recipient sees which song it is before opening anything.
 */
// Plain values, not a computed: these props are serialised into the image URL,
// and a reactive ref serialises as a circular structure — a 500 on the page
// itself, not a broken picture.
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


// Canonical and hreflang come from useLocaleHead in app.vue. A hard-coded
// canonical here pointed every English page at its Bosnian counterpart,
// which tells a search engine to index that one instead.
</script>

<template>
  <article v-if="song">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight">{{ song.title }}</h1>
      <NuxtLink :to="localePath(`/izvodjac/${song.artist?.slug}`)" class="text-muted hover:text-accent">
        {{ song.artist?.name }}
      </NuxtLink>

      <ul v-if="song.genres?.length" class="mt-2 flex flex-wrap gap-1.5">
        <li v-for="genre in song.genres" :key="genre._id">
          <NuxtLink
            :to="localePath(`/zanr/${genre.slug}`)"
            class="rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-muted hover:border-accent hover:text-accent"
          >{{ genre.name }}</NuxtLink>
        </li>
      </ul>

      <!-- Both were already in the payload and neither was ever shown. The
           difficulty tells a beginner whether to attempt this at all; the view
           count is the only signal on the page that other people play it. -->
      <p v-if="difficultyKey || viewsLabel" class="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
        <span
          v-if="difficultyKey"
          class="rounded-full border px-2 py-0.5 font-medium"
          :class="difficultyClass"
          :title="$t('song.difficultyLabel')"
        >{{ $t(`song.${difficultyKey}`) }}</span>

        <span v-if="difficultyKey && viewsLabel" aria-hidden="true">·</span>

        <span v-if="viewsLabel">{{ $t('song.views', { n: viewsLabel.formatted }, viewsLabel.n) }}</span>
      </p>
    </header>

    <VersionSwitcher

      data-print="hide"

      :arrangements="song.arrangements || []"

      :current="song.arrangementId"

    />


    <StarRating data-print="hide"
      class="mb-5"
      :slug="song.slug"
      :arrangement-id="song.arrangementId"
    />

    <div data-print="hide" class="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-line py-2 sm:mb-8 sm:gap-x-6 sm:gap-y-3 sm:py-3">
      <TransposeControls v-model:semitones="semitones" :original-key="song.originalKey" />

      <FontSizeControl />

      <AutoScrollControl />

      <button
        v-if="wideEnough"
        class="rounded border px-2.5 py-1.5 transition"
        :class="columns
          ? 'border-accent bg-accent text-on-accent'
          : 'border-line-strong bg-panel text-muted hover:border-accent hover:text-accent'"
        :aria-pressed="columns"
        :title="$t('song.twoColumns')"
        @click="toggleColumns"
      >
        <Icon name="material-symbols:vertical-split-rounded" />
        <span class="sr-only">{{ $t('song.twoColumns') }}</span>
      </button>

      <button
        class="rounded border px-2.5 py-1.5 transition"
        :class="showChords
          ? 'border-accent bg-accent text-on-accent'
          : 'border-line-strong bg-panel text-muted hover:border-accent hover:text-accent'"
        :aria-pressed="showChords"
        :title="$t('song.allChords')"
        @click="showChords = !showChords"
      >
        <Icon name="material-symbols:grid-view-rounded" />
        <span class="sr-only">{{ $t('song.allChords') }}</span>
      </button>

      <span v-if="song.capo" class="order-last text-sm text-muted sm:order-none">
        {{ $t('song.capo') }}: {{ $t('song.capoFret', { n: song.capo }) }}
      </span>

      <button
        class="rounded border border-line-strong bg-panel px-2.5 py-1.5 text-muted transition hover:border-accent hover:text-accent"
        :title="$t('song.print')"
        @click="print()"
      >
        <Icon name="material-symbols:print-outline-rounded" />
        <span class="sr-only">{{ $t('song.print') }}</span>
      </button>

      <!-- AI-TRAP: both icon names are written out as literals and toggled
           with v-show, never bound as one expression. @nuxt/icon builds its
           client bundle by scanning source for literal names; a computed
           name renders a correctly sized SVG with no paths in it. -->
      <button
        v-if="auth.isAuthenticated"
        class="rounded border px-2.5 py-1.5 transition"
        :class="favorites.has(song._id)
          ? 'border-accent bg-accent text-on-accent'
          : 'border-line-strong bg-panel text-muted hover:border-accent hover:text-accent'"
        :aria-pressed="favorites.has(song._id)"
        :title="favorites.has(song._id) ? $t('song.saved') : $t('song.save')"
        @click="toggleFavorite"
      >
        <Icon v-show="favorites.has(song._id)" name="material-symbols:favorite-rounded" />
        <Icon v-show="!favorites.has(song._id)" name="material-symbols:favorite-outline-rounded" />
        <span class="sr-only">{{ favorites.has(song._id) ? $t('song.saved') : $t('song.save') }}</span>
      </button>

      <NuxtLink
        v-else
        :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
        class="rounded border border-line-strong bg-panel px-2.5 py-1.5 text-muted transition hover:border-accent hover:text-accent"
        :title="$t('song.save')"
      >
        <Icon name="material-symbols:favorite-outline-rounded" />
        <span class="sr-only">{{ $t('song.save') }}</span>
      </NuxtLink>
    </div>

    <ChordGrid data-print="hide"
      v-if="showChords"
      class="mb-8"
      :content="song.content"
      :semitones="semitones"
      :original-key="song.originalKey"
    />

    <!-- Said once, above the sheet: the dotted underline is the only thing on a

         chord that hints it does anything, and nobody reads an underline. -->

    <p class="mb-2 flex items-center gap-1.5 text-xs text-faint" data-print="hide">

      <Icon name="material-symbols:volume-up-outline-rounded" aria-hidden="true" />

      {{ $t('song.chordHear') }}

    </p>


    <ChordSheet
      :content="song.content"
      :semitones="semitones"
      :original-key="song.originalKey"
      :font-size="fontSize"
      :columns="splitColumns"
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
  </article>
</template>
