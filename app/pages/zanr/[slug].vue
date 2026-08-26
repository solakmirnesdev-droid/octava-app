<script setup>
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();

const page = computed(() => Number(route.query.page) || 1);
const sort = computed(() => route.query.sort || 'recent');

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

function go(nextPage) {
  router.push({ query: { ...route.query, page: nextPage } });
}

useSeoMeta({
  title: () => `${genre.value?.name} — akordi za gitaru | Octava`,
  description: () => genre.value?.description
    || `Akordi za pjesme iz rubrike ${genre.value?.name}.`
});

// Canonical and hreflang come from useLocaleHead in app.vue. A hard-coded
// canonical here pointed every English page at its Bosnian counterpart,
// which tells a search engine to index that one instead.
</script>

<template>
  <div v-if="genre">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight">{{ genre.name }}</h1>
      <p v-if="genre.description" class="mt-1 text-black/60">{{ genre.description }}</p>
      <p class="mt-1 text-sm text-black/40">{{ meta?.total || 0 }} pjesama</p>
    </header>

    <div class="mb-4 flex gap-4 border-b border-black/10 pb-2 text-sm">
      <NuxtLink
        v-for="option in [
          { key: 'recent', label: 'Najnovije' },
          { key: 'popular', label: 'Najtraženije' },
          { key: 'title', label: 'Abecedno' }
        ]"
        :key="option.key"
        :to="{ query: { ...route.query, sort: option.key, page: undefined } }"
        class="hover:text-accent"
        :class="sort === option.key ? 'font-medium text-accent' : 'text-black/50'"
      >
        {{ option.label }}
      </NuxtLink>
    </div>

    <SongList :songs="data?.songs || []" empty="U ovoj rubrici još nema pjesama." />

    <nav v-if="meta && meta.pages > 1" class="mt-8 flex items-center justify-center gap-3 text-sm">
      <button
        class="rounded border border-black/15 px-3 py-1.5 hover:border-accent disabled:opacity-30"
        :disabled="meta.page <= 1" @click="go(meta.page - 1)"
      >
        {{ $t('page.prev') }}
      </button>
      <span class="text-black/50">{{ meta.page }} / {{ meta.pages }}</span>
      <button
        class="rounded border border-black/15 px-3 py-1.5 hover:border-accent disabled:opacity-30"
        :disabled="meta.page >= meta.pages" @click="go(meta.page + 1)"
      >
        {{ $t('page.next') }}
      </button>
    </nav>
  </div>
</template>
