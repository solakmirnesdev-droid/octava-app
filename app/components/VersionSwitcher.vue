<script setup>
/**
 * Picks which transcription of a song to read.
 *
 * The choice lives in the query string rather than in component state, unlike
 * transposition: these are genuinely different charts, and "here is the easy
 * version" is a link somebody wants to send. The canonical tag ignores the
 * query, so the versions consolidate to one page for a search engine while
 * still being addressable by a person.
 *
 * Each version carries its own accuracy score, which is the whole reason more
 * than one is worth having — a wrong chart stops being the only chart.
 */
const props = defineProps({
  arrangements: { type: Array, default: () => [] },
  current: { type: String, default: null }
});

const route = useRoute();
const router = useRouter();

const many = computed(() => props.arrangements.length > 1);

function select(id) {
  const isPrimary = props.arrangements.find((a) => String(a._id) === String(id))?.isPrimary;
  // The primary sits on the bare URL: no reason to carry a parameter that
  // names the default.
  const query = { ...route.query };
  if (isPrimary) delete query.v;
  else query.v = id;
  router.push({ query });
}

const scoreOf = (a) => (a.ratingCount ? Number(a.rating).toFixed(1) : null);
</script>

<template>
  <div v-if="many" class="mb-6">
    <p class="mb-2 text-xs font-medium uppercase tracking-wide text-black/40">
      {{ $t('song.versions') }}
    </p>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="a in arrangements" :key="a._id"
        type="button"
        class="rounded border px-3 py-2 text-left text-sm transition"
        :class="String(a._id) === String(current)
          ? 'border-accent bg-accent/[0.06] text-accent'
          : 'border-black/15 bg-white text-black/70 hover:border-accent hover:text-accent'"
        :aria-pressed="String(a._id) === String(current)"
        @click="select(a._id)"
      >
        <span class="block font-medium">{{ a.label }}</span>
        <span class="mt-0.5 block text-xs text-black/45">
          {{ a.originalKey }}<template v-if="a.capo"> · {{ $t('song.capo') }} {{ a.capo }}</template>
          ·
          <template v-if="scoreOf(a)">
            ★ {{ $t('song.versionRating', { rating: scoreOf(a), n: a.ratingCount }) }}
          </template>
          <template v-else>{{ $t('song.versionNoRating') }}</template>
          <template v-if="a.isPrimary"> · {{ $t('song.versionPrimary') }}</template>
        </span>
      </button>
    </div>
  </div>
</template>
