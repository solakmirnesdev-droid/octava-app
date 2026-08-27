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
    <!-- 1. Rich Hero Banner with ambient gradient and watermark -->
    <header class="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-panel/90 via-panel/60 to-surface/80 p-6 sm:p-8 backdrop-blur-xs shadow-sm">
      <!-- Watermark musical background icon -->
      <Icon
        name="material-symbols:graphic-eq-rounded"
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-6 -right-6 select-none text-[140px] sm:text-[180px] text-ink/5"
      />

      <div class="relative z-10 max-w-3xl">
        <span class="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft px-3 py-0.5 text-xs font-semibold text-accent">
          <Icon name="material-symbols:label-outline-rounded" class="text-xs" />
          {{ $t('genre.rubrics') || 'Rubrika' }}
        </span>

        <h1 class="mt-3 text-2xl sm:text-4xl font-bold tracking-tight text-ink">
          {{ genre.name }}
        </h1>

        <p v-if="genre.description" class="mt-2 text-sm sm:text-base leading-relaxed text-muted">
          {{ genre.description }}
        </p>

        <!-- Metrics pill badges -->
        <div class="mt-5 flex flex-wrap items-center gap-3 text-xs">
          <span class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/80 px-3 py-1.5 font-medium text-body">
            <Icon name="material-symbols:music-note-rounded" class="text-accent" />
            {{ $t('genre.songCount', { n: stats.totalSongs }) }}
          </span>

          <span v-if="stats.totalArtists" class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/80 px-3 py-1.5 font-medium text-body">
            <Icon name="material-symbols:artist-rounded" class="text-warn" />
            {{ $t('genre.artistCount', { n: stats.totalArtists }) }}
          </span>

          <span class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/80 px-3 py-1.5 text-faint">
            <Icon name="material-symbols:filter-list-rounded" class="text-dim" />
            {{ $t('genre.' + (sort === 'popular' ? 'sortPopular' : sort === 'title' ? 'sortTitle' : 'sortRecent')) }}
          </span>
        </div>
      </div>
    </header>

    <!-- 2. Spotlight Cards: Top 3 Hitovi rubrike -->
    <section v-if="spotlight.length" aria-labelledby="spotlight-heading" class="space-y-3">
      <div class="flex items-center gap-2">
        <Icon name="material-symbols:local-fire-department-rounded" class="text-warn text-base" />
        <h2 id="spotlight-heading" class="text-xs font-semibold uppercase tracking-wider text-faint">
          {{ $t('genre.spotlight') }}
        </h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <NuxtLink
          v-for="(hit, idx) in spotlight"
          :key="hit._id"
          :to="localePath(`/pjesma/${hit.slug}`)"
          class="group relative flex items-center gap-3.5 rounded-xl border border-line bg-panel/75 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-md backdrop-blur-xs"
        >
          <!-- Rank badge -->
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ring-1 ring-line"
            :class="idx === 0 ? 'bg-warn-soft text-warn ring-warn/30' : idx === 1 ? 'bg-accent-soft text-accent ring-accent/30' : 'bg-surface text-faint'"
          >
            #{{ idx + 1 }}
          </span>

          <!-- Hit info -->
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              {{ hit.title }}
            </h3>
            <p class="truncate text-xs text-muted">
              <span v-if="hit.artist?.flag || flagOf(hit.artist?.country)" class="mr-1">
                {{ hit.artist?.flag || flagOf(hit.artist?.country) }}
              </span>
              {{ hit.artist?.name }}
            </p>
          </div>

          <!-- Views & Key -->
          <div class="shrink-0 text-right font-mono text-[11px] text-faint">
            <span v-if="hit.views" class="block">{{ formatViews(hit.views) }} 👁</span>
            <span v-if="hit.originalKey" class="block font-medium text-accent">{{ hit.originalKey }}</span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- 3. Main 2-Column Section (Main List + Sidebar) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <!-- Left Column: Song List & Controls (2 cols) -->
      <section class="lg:col-span-2 space-y-4">
        <!-- Controls: In-line search & Sorting tabs -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
          <!-- Sorting Tabs -->
          <div class="flex items-center gap-1.5 text-xs sm:text-sm">
            <NuxtLink
              v-for="option in [
                { key: 'recent', label: $t('genre.sortRecent') },
                { key: 'popular', label: $t('genre.sortPopular') },
                { key: 'title', label: $t('genre.sortTitle') }
              ]"
              :key="option.key"
              :to="{ query: { ...route.query, sort: option.key, page: undefined } }"
              class="rounded-lg px-3 py-1.5 transition-colors"
              :class="sort === option.key ? 'bg-raised font-medium text-accent shadow-xs' : 'text-muted hover:text-ink hover:bg-surface'"
            >
              {{ option.label }}
            </NuxtLink>
          </div>

          <!-- In-genre Filter Input -->
          <div class="relative w-full sm:w-56">
            <Icon
              name="material-symbols:search-rounded"
              class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-faint"
            />
            <input
              v-model="filterQuery"
              type="text"
              :placeholder="$t('genre.searchPlaceholder')"
              class="w-full rounded-lg border border-line bg-surface py-1 pl-8 pr-7 text-xs outline-none transition focus:border-accent focus:bg-panel"
            >
            <button
              v-if="filterQuery"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-faint hover:text-accent"
              @click="filterQuery = ''"
            >
              <Icon name="material-symbols:close-rounded" />
            </button>
          </div>
        </div>

        <!-- Song List -->
        <SongList
          :songs="filteredSongs"
          :empty="filterQuery ? $t('genre.emptyFilter') : 'U ovoj rubrici još nema pjesama.'"
        />

        <!-- Pagination (only when not actively searching in-page) -->
        <nav
          v-if="!filterQuery && meta && meta.pages > 1"
          class="mt-8 flex items-center justify-center gap-3 pt-4 text-sm"
        >
          <button
            class="rounded-lg border border-line-strong bg-panel/60 px-3.5 py-1.5 font-medium transition hover:border-accent disabled:opacity-30"
            :disabled="meta.page <= 1"
            @click="go(meta.page - 1)"
          >
            {{ $t('page.prev') }}
          </button>

          <span class="font-mono text-xs text-muted">{{ meta.page }} / {{ meta.pages }}</span>

          <button
            class="rounded-lg border border-line-strong bg-panel/60 px-3.5 py-1.5 font-medium transition hover:border-accent disabled:opacity-30"
            :disabled="meta.page >= meta.pages"
            @click="go(meta.page + 1)"
          >
            {{ $t('page.next') }}
          </button>
        </nav>
      </section>

      <!-- Right Column: Sidebar (1 col) -->
      <aside class="space-y-6">
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
                    :style="avatarStyle(artist.name)"
                    class="flex size-7 select-none items-center justify-center rounded-full text-[10px] font-semibold ring-1 ring-line-soft group-hover:ring-accent transition"
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
