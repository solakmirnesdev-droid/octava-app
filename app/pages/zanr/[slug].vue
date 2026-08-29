<script setup>
import { initials, avatarStyle } from '~/utils/avatar';
import { flagOf } from '~/utils/countries';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
const { $api } = useNuxtApp();
const config = useRuntimeConfig();

const page = computed(() => Number(route.query.page) || 1);
const sort = computed(() => route.query.sort || 'recent');
const filterQuery = ref('');
const viewMode = ref('grid');

const { data, error } = await useAsyncData(
  () => `genre-${route.params.slug}-${page.value}-${sort.value}`,
  () => $api(`/genres/${route.params.slug}`, {
    params: { page: page.value, sort: sort.value }
  }),
  { watch: [page, sort] }
);

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: t('meta.genreNotFound'), fatal: true });
}

const genre = computed(() => data.value?.genre);
const meta = computed(() => data.value?.meta);
const topArtists = computed(() => data.value?.topArtists || []);
const spotlight = computed(() => data.value?.spotlight || []);
const relatedGenres = computed(() => data.value?.relatedGenres || []);
const stats = computed(() => data.value?.stats || { totalSongs: meta.value?.total || 0, totalArtists: 0 });

const filteredSongs = computed(() => {
  const list = data.value?.songs || [];
  const q = filterQuery.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter((s) =>
    s.title?.toLowerCase().includes(q) ||
    s.artist?.name?.toLowerCase().includes(q)
  );
});

const POPULAR_KEYS = ['Am', 'C', 'G', 'Em', 'D', 'F', 'Dm', 'A'];

function go(nextPage) {
  router.push({ query: { ...route.query, page: nextPage } });
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function formatViews(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(num);
}

useSeoMeta({
  title: () => `${genre.value?.name} — akordi za gitaru | Octava`,
  description: () => genre.value?.description
    || `Akordi za pjesme iz rubrike ${genre.value?.name}.`
});
</script>

<template>
  <div v-if="genre" class="space-y-8">
    <!-- 1. Rich 2026 Genre Studio Header Card (No Blank Void) -->
    <header class="relative overflow-hidden rounded-3xl border border-line bg-panel/85 p-5 sm:p-6 backdrop-blur-xl shadow-md ring-1 ring-white/5">
      <!-- Ambient decorative glow -->
      <div class="pointer-events-none absolute -top-16 -left-16 size-48 rounded-full bg-accent/15 blur-3xl" />
      <div class="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-accent/10 blur-3xl" />

      <!-- Watermark musical background icon -->
      <Icon
        name="material-symbols:music-note-rounded"
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-6 -right-4 select-none text-[130px] text-ink/3"
      />

      <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
        <!-- Genre Avatar / Icon Badge -->
        <div class="flex size-14 sm:size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-soft to-panel border border-accent/30 text-accent shadow-md ring-1 ring-accent/20">
          <Icon name="material-symbols:category-rounded" class="text-2xl sm:text-3xl" />
        </div>

        <!-- Genre Info & Inline Metric Pills -->
        <div class="min-w-0 flex-1 space-y-2">
          <!-- Top Row: Badge + Count -->
          <div class="flex flex-wrap items-center gap-2">
            <AppBadge variant="accent" icon="material-symbols:label-outline-rounded">
              {{ $t('genre.rubrics') }}
            </AppBadge>

            <span v-if="stats.totalSongs" class="inline-flex items-center gap-1 text-xs font-mono font-bold text-muted">
              <span>·</span>
              <span>{{ $t('genre.songCount', { n: stats.totalSongs }) }}</span>
            </span>
          </div>

          <!-- Title & Subtitle -->
          <div>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-ink">
              {{ genre.name }}
            </h1>
            <p class="mt-1 text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
              {{ genre.description || `Pregledaj sve akorde i tekstove pjesama iz rubrike ${genre.name} sa tačnim originalnim tonalitetima i dijagramima za gitaru.` }}
            </p>
          </div>

          <!-- Quick Metrics Bar directly under description -->
          <div class="pt-1 flex flex-wrap items-center gap-2 text-xs">
            <div class="inline-flex items-center gap-1.5 rounded-xl border border-line-soft bg-surface/80 px-2.5 py-1 font-medium text-body shadow-2xs">
              <Icon name="material-symbols:music-note-rounded" class="text-accent text-sm" />
              <span><strong>{{ stats.totalSongs }}</strong> {{ $t('page.songs').toLowerCase() }}</span>
            </div>

            <div v-if="topArtists.length" class="inline-flex items-center gap-1.5 rounded-xl border border-line-soft bg-surface/80 px-2.5 py-1 font-medium text-body shadow-2xs">
              <SingerIcon size="1.15em" class="text-accent" />
              <span><strong>{{ topArtists.length }}+</strong> {{ $t('page.artists').toLowerCase() }}</span>
            </div>

            <div class="inline-flex items-center gap-1.5 rounded-xl border border-line-soft bg-surface/60 px-2.5 py-1 font-mono text-[11px] text-faint">
              <Icon name="material-symbols:piano-rounded" class="text-accent text-xs" />
              <span>Tonaliteti: <strong class="text-accent font-bold">Am · Dm · C · G</strong></span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 3. Main 2-Column Section (Main List + Sidebar) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <!-- Left Column: Song List & Controls (2 cols) -->
      <section class="lg:col-span-2 space-y-4">
        <!-- Controls: Single In-line search + Sorting tabs + View Switcher -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
          <!-- Sorting Tabs -->
          <div class="inline-flex items-center rounded-xl border border-line bg-panel/80 p-0.5 text-xs">
            <NuxtLink
              v-for="option in [
                { key: 'recent', label: $t('genre.sortRecent') },
                { key: 'popular', label: $t('genre.sortPopular') },
                { key: 'title', label: $t('genre.sortTitle') }
              ]"
              :key="option.key"
              :to="{ query: { ...route.query, sort: option.key, page: undefined } }"
              class="rounded-lg px-3 py-1.5 transition-colors font-medium"
              :class="sort === option.key ? 'bg-panel font-bold text-accent shadow-xs' : 'text-muted hover:text-ink'"
            >
              {{ option.label }}
            </NuxtLink>
          </div>

          <!-- Right side: Single Search Input + View Mode Switcher -->
          <div class="flex items-center gap-2.5">
            <div class="relative w-full sm:w-64 md:w-72">
              <Icon
                name="material-symbols:search-rounded"
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint"
              />
              <input
                v-model="filterQuery"
                type="search"
                :placeholder="$t('genre.searchPlaceholder')"
                class="input-base pl-9 pr-8 py-2"
              >
              <button
                v-if="filterQuery"
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-faint hover:text-ink"
                @click="filterQuery = ''"
              >
                <Icon name="material-symbols:close-rounded" />
              </button>
            </div>

            <!-- View Switcher -->
            <div class="inline-flex items-center rounded-xl border border-line bg-panel/80 p-0.5 text-xs">
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors"
                :class="viewMode === 'grid' ? 'bg-panel font-semibold text-accent shadow-xs' : 'text-muted hover:text-ink'"
                :aria-label="$t('common.viewGrid')"
                @click="viewMode = 'grid'"
              >
                <Icon name="material-symbols:grid-view-rounded" class="text-sm" />
                <span class="hidden md:inline">{{ $t('common.viewGrid') }}</span>
              </button>
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors"
                :class="viewMode === 'list' ? 'bg-panel font-semibold text-accent shadow-xs' : 'text-muted hover:text-ink'"
                :aria-label="$t('common.viewList')"
                @click="viewMode = 'list'"
              >
                <Icon name="material-symbols:view-list-rounded" class="text-sm" />
                <span class="hidden md:inline">{{ $t('common.viewList') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Songs View (Grid / List) -->
        <SongList
          :songs="filteredSongs"
          :show-artist="true"
          :default-view="viewMode"
        />

        <!-- Pagination -->
        <nav
          v-if="!filterQuery && meta && meta.pages > 1"
          class="mt-8 flex items-center justify-center gap-3 pt-4 text-sm"
        >
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="meta.page <= 1"
            @click="go(meta.page - 1)"
          >
            {{ $t('page.prev') }}
          </AppButton>

          <span class="font-mono text-xs text-muted">{{ meta.page }} / {{ meta.pages }}</span>

          <AppButton
            variant="secondary"
            size="sm"
            :disabled="meta.page >= meta.pages"
            @click="go(meta.page + 1)"
          >
            {{ $t('page.next') }}
          </AppButton>
        </nav>
      </section>

      <!-- Right Column: Sidebar (1 col) -->
      <aside class="space-y-6">
        <!-- Top 3 Featured / Spotlight Hits Card -->
        <div v-if="(spotlight.length ? spotlight : (data?.songs || [])).length" class="rounded-2xl border border-line bg-panel/60 p-4 sm:p-5 backdrop-blur-xs shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <Icon name="material-symbols:local-fire-department-rounded" class="text-warn text-base" />
              <h2 class="text-xs font-semibold uppercase tracking-wider text-faint">
                {{ $t('genre.featuredSongs') }}
              </h2>
            </div>
            <span class="text-[11px] font-mono text-faint">Top 3</span>
          </div>

          <div class="space-y-2">
            <NuxtLink
              v-for="(hit, idx) in (spotlight.length ? spotlight : (data?.songs || []).slice(0, 3))"
              :key="hit._id"
              :to="localePath(`/pjesma/${hit.slug}`)"
              class="group flex items-center justify-between gap-3 rounded-xl border border-line/60 bg-surface/70 p-2.5 transition-all hover:border-accent hover:bg-panel hover:shadow-xs"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span
                  class="flex size-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold"
                  :class="idx === 0 ? 'bg-warn-soft text-warn font-extrabold' : idx === 1 ? 'bg-accent-soft text-accent' : 'bg-surface text-faint'"
                >
                  {{ idx + 1 }}
                </span>
                <div class="min-w-0">
                  <h3 class="truncate text-xs font-bold text-ink group-hover:text-accent transition-colors">
                    {{ hit.title }}
                  </h3>
                  <p v-if="hit.artist" class="truncate text-[11px] text-muted">
                    {{ hit.artist.name }}
                  </p>
                </div>
              </div>

              <div class="flex shrink-0 items-center gap-2 font-mono text-[11px]">
                <span v-if="hit.originalKey" class="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-bold text-accent">
                  {{ hit.originalKey }}
                </span>
                <span v-if="hit.views" class="text-faint hidden sm:inline">
                  {{ formatViews(hit.views) }} 👁
                </span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Top Artists in Genre -->
        <div v-if="topArtists.length" class="rounded-2xl border border-line bg-panel/60 p-4 sm:p-5 backdrop-blur-xs shadow-xs">
          <div class="flex items-center gap-2 mb-3.5">
            <Icon name="material-symbols:artist-rounded" class="text-accent text-base" />
            <h2 class="text-xs font-semibold uppercase tracking-wider text-faint">
              {{ $t('genre.topArtists') }}
            </h2>
          </div>

          <ul class="space-y-2">
            <li v-for="artist in topArtists" :key="artist._id">
              <NuxtLink
                :to="localePath(`/izvodjac/${artist.slug}`)"
                class="group flex items-center justify-between gap-3 rounded-xl p-2 transition hover:bg-raised"
              >
                <div class="flex min-w-0 items-center gap-2.5">
                  <!-- Artist Avatar -->
                  <img
                    v-if="artist.hasImage"
                    :src="`${config.public.apiBase}/artists/${artist._id}/image`"
                    :alt="artist.name"
                    class="size-7 rounded-full object-cover ring-1 ring-line group-hover:ring-accent transition"
                  >
                  <span
                    v-else
                    class="flex size-7 select-none items-center justify-center rounded-full border border-line bg-surface/90 font-mono text-[10px] font-bold text-muted ring-1 ring-line-soft group-hover:border-accent group-hover:text-accent transition"
                  >
                    {{ initials(artist.name) }}
                  </span>

                  <!-- Name and flag -->
                  <span class="truncate text-xs font-medium text-body group-hover:text-accent transition-colors">
                    <span v-if="artist.flag" class="mr-1">{{ artist.flag }}</span>{{ artist.name }}
                  </span>
                </div>

                <span class="shrink-0 font-mono text-[11px] text-faint">
                  {{ artist.songCount || 0 }}
                </span>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Popular Keys -->
        <div class="rounded-2xl border border-line bg-panel/60 p-4 sm:p-5 backdrop-blur-xs shadow-xs">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="material-symbols:piano-rounded" class="text-accent text-base" />
            <h2 class="text-xs font-semibold uppercase tracking-wider text-faint">
              {{ $t('genre.popularKeys') }}
            </h2>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="k in POPULAR_KEYS"
              :key="k"
              type="button"
              class="rounded-lg border border-line-strong bg-surface/70 px-2.5 py-1 font-mono text-xs text-muted transition hover:border-accent hover:text-accent"
              @click="filterQuery = filterQuery === k ? '' : k"
            >
              {{ k }}
            </button>
          </div>
        </div>

        <!-- Related Genres -->
        <div v-if="relatedGenres.length" class="rounded-2xl border border-line bg-panel/60 p-4 sm:p-5 backdrop-blur-xs shadow-xs">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="material-symbols:category-rounded" class="text-accent text-base" />
            <h2 class="text-xs font-semibold uppercase tracking-wider text-faint">
              {{ $t('genre.relatedGenres') }}
            </h2>
          </div>

          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="rel in relatedGenres"
              :key="rel._id"
              :to="localePath(`/zanr/${rel.slug}`)"
              class="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface/80 px-3 py-1 text-xs text-muted transition hover:border-accent hover:text-accent"
            >
              <span>{{ rel.name }}</span>
              <span class="font-mono text-[10px] text-dim">{{ rel.songCount }}</span>
            </NuxtLink>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
