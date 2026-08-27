<script setup>
const props = defineProps({
  slug: { type: String, required: true },
  arrangementId: { type: String, default: null },
  songTitle: { type: String, default: '' },
  artistName: { type: String, default: '' },
  artistId: { type: String, default: '' }
});

const { $api } = useNuxtApp();
const auth = useAuthStore();
const localePath = useLocalePath();
const route = useRoute();
const { t } = useI18n();
const { show: showToast } = useToast();

const rating = ref(null);
const hovered = ref(0);
const saving = ref(false);
const failed = ref(false);

// Fetched on the client: the average is not part of what a search engine
// should index for this page, and it changes far more often than the chords.
onMounted(load);

async function load() {
  try {
    rating.value = await $api(`/songs/${props.slug}/rating`, {
      params: props.arrangementId ? { arrangementId: props.arrangementId } : undefined
    }).then((r) => r.rating);
  } catch {
    rating.value = null;
  }
}

/** What the stars show: your hover, then your vote, then the average. */
const displayed = computed(() => {
  if (hovered.value) return hovered.value;
  if (rating.value?.mine) return rating.value.mine;
  return Math.round(rating.value?.average || 0);
});

const isMine = computed(() => Boolean(rating.value?.mine));

const hoverLabel = computed(() => {
  if (!hovered.value) return '';
  return t(`rating.star${hovered.value}`);
});

async function submit(value) {
  if (!auth.isAuthenticated) return;

  saving.value = true;
  failed.value = false;
  try {
    // Sending the same value again withdraws it, so the control is its own
    // undo rather than needing a separate one.
    const wasMine = rating.value?.mine === value;
    const method = wasMine ? 'DELETE' : 'POST';
    const result = await $api(`/songs/${props.slug}/rating`, {
      method,
      body: { value, arrangementId: props.arrangementId }
    });
    rating.value = result.rating;

    // Trigger toast notification
    showToast({
      title: props.songTitle || props.slug,
      artistName: props.artistName,
      artistId: props.artistId,
      type: 'rating',
      ratingValue: wasMine ? null : value,
      message: wasMine ? t('rating.retractedToast') : t('rating.ratedToast', { n: value })
    });
  } catch {
    failed.value = true;
  } finally {
    saving.value = false;
    hovered.value = 0;
  }
}
</script>

<template>
  <div
    v-if="rating"
    class="rounded-xl border border-line bg-panel/70 p-3.5 sm:p-4 backdrop-blur-xs transition-colors"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <!-- Left: Title, Score and Live Feedback/Hint -->
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span class="text-xs font-semibold uppercase tracking-wider text-faint">
            {{ $t('rating.title') }}
          </span>

          <span v-if="rating.count > 0" class="flex items-center gap-1 font-mono text-xs">
            <span class="font-bold text-ink">{{ rating.average.toFixed(1) }}</span>
            <span class="text-faint">/ 5</span>
            <span class="text-dim">·</span>
            <span class="text-muted">{{ $t('rating.count', rating.count, { n: rating.count }) }}</span>
          </span>
          <span v-else class="text-xs text-faint">
            — {{ $t('rating.count', 0, { n: 0 }) }}
          </span>
        </div>

        <p class="mt-1 text-xs transition-colors">
          <span v-if="hovered" class="font-medium text-warn">
            {{ hoverLabel }}
          </span>
          <span v-else-if="isMine" class="font-medium text-accent">
            {{ $t('rating.yourRating') }}: {{ rating.mine }} / 5
          </span>
          <span v-else class="text-muted">
            {{ $t('rating.hint') }}
          </span>
        </p>
      </div>

      <!-- Right: Interactive Stars Container & Actions -->
      <div class="flex flex-wrap items-center gap-3 self-start sm:self-auto">
        <!-- 5 Interactive Stars -->
        <div
          class="flex items-center gap-0.5 rounded-lg border border-line-strong/50 bg-surface/90 p-1"
          role="radiogroup"
          :aria-label="$t('rating.title')"
          @mouseleave="hovered = 0"
        >
          <button
            v-for="star in 5" :key="star"
            type="button"
            role="radio"
            :aria-checked="rating.mine === star"
            :aria-label="$t('rating.star', { n: star })"
            :disabled="saving || !auth.isAuthenticated"
            class="group relative flex size-7 items-center justify-center rounded transition-all duration-150 active:scale-90 disabled:cursor-default"
            :class="[
              star <= displayed
                ? (isMine && !hovered ? 'text-accent' : 'text-warn')
                : 'text-dim hover:text-warn/60',
              auth.isAuthenticated && 'hover:scale-125 hover:bg-raised'
            ]"
            @mouseenter="auth.isAuthenticated && (hovered = star)"
            @click="submit(star)"
          >
            <Icon name="material-symbols:star-rounded" class="text-xl" />
          </button>
        </div>

        <!-- Auth / Reset Action -->
        <div v-if="failed" role="alert" class="text-xs font-medium text-danger">
          {{ $t('rating.failed') }}
        </div>

        <div v-else-if="isMine">
          <button
            type="button"
            class="text-xs text-faint hover:text-accent hover:underline transition"
            :title="$t('rating.remove')"
            @click="submit(rating.mine)"
          >
            {{ $t('rating.remove') }}
          </button>
        </div>

        <div v-else-if="!auth.isAuthenticated">
          <NuxtLink
            :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
            class="rounded border border-line-strong bg-panel px-2.5 py-1 text-xs text-muted hover:border-accent hover:text-accent transition"
          >
            {{ $t('rating.signInToRate') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
