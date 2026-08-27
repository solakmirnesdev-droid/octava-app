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
    class="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-r from-panel/95 via-panel/80 to-surface/90 p-4 sm:p-5 backdrop-blur-md shadow-xs transition-all"
  >
    <!-- Background gold star watermark -->
    <Icon
      name="material-symbols:star-rounded"
      class="pointer-events-none absolute -bottom-6 -right-6 select-none text-[120px] text-warn/4"
      aria-hidden="true"
    />

    <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
      <!-- 1. Left Zone: Score Pill, Title & Feedback (4 cols) -->
      <div class="lg:col-span-4 flex items-center gap-3.5 min-w-0">
        <div class="flex shrink-0 items-center gap-1.5 rounded-2xl border border-warn/30 bg-warn-soft/80 px-3.5 py-2 text-warn shadow-2xs">
          <Icon name="material-symbols:star-rounded" class="text-lg" />
          <span class="font-mono text-lg sm:text-xl font-bold leading-none">
            {{ rating.count > 0 ? rating.average.toFixed(1) : '–' }}
          </span>
        </div>

        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-bold text-ink tracking-tight">
              {{ $t('rating.title') }}
            </h3>
            <span class="rounded-full border border-line-soft bg-surface/70 px-2 py-0.5 text-[10px] font-mono text-faint">
              {{ rating.count > 0 ? $t('rating.count', rating.count, { n: rating.count }) : '0 ocjena' }}
            </span>
          </div>

          <p class="mt-0.5 text-xs text-muted truncate">
            <span v-if="hovered" class="font-semibold text-warn">
              {{ hoverLabel }}
            </span>
            <span v-else-if="isMine" class="inline-flex items-center gap-1 font-semibold text-accent">
              <Icon name="material-symbols:check-circle-rounded" class="text-xs" />
              Tvoja ocjena: {{ rating.mine }} / 5 ★
            </span>
            <span v-else>
              {{ $t('rating.hint') }}
            </span>
          </p>
        </div>
      </div>

      <!-- 2. Middle Zone: Accuracy Quality Badges (4 cols) -->
      <div class="lg:col-span-4 hidden lg:flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-body">
        <span class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/80 px-2.5 py-1 shadow-2xs">
          <!-- Musical Key / Tuning Note SVG -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 text-accent shrink-0" aria-hidden="true">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" fill="currentColor" />
            <circle cx="18" cy="16" r="3" fill="currentColor" />
          </svg>
          <span>Originalni tonalitet</span>
        </span>

        <span class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/80 px-2.5 py-1 shadow-2xs">
          <!-- Document / Lyrics Checkmark SVG -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 text-ok shrink-0" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="m9 15 2 2 4-4" />
          </svg>
          <span>Tačan tekst</span>
        </span>

        <span class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/80 px-2.5 py-1 shadow-2xs">
          <!-- Chords / Harmonic Bars Wave SVG -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 text-warn shrink-0" aria-hidden="true">
            <path d="M4 14v-4m4 7V7m4 12V5m4 10V9m4 4v-2" />
          </svg>
          <span>Harmonizacija</span>
        </span>
      </div>

      <!-- 3. Right Zone: Interactive Rating Stars & Actions (4 cols) -->
      <div class="lg:col-span-4 flex items-center justify-start lg:justify-end gap-2.5">
        <!-- 5 Interactive Star Rating Buttons -->
        <div
          class="flex items-center gap-0.5 rounded-xl border border-line-strong/40 bg-surface/90 p-1 shadow-2xs"
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
            class="group relative flex size-8 sm:size-8.5 items-center justify-center rounded-lg transition-colors duration-150 disabled:cursor-default"
            :class="[
              star <= displayed
                ? (isMine && !hovered ? 'text-accent' : 'text-warn')
                : 'text-dim hover:text-warn/60',
              auth.isAuthenticated && 'hover:bg-raised'
            ]"
            @mouseenter="auth.isAuthenticated && (hovered = star)"
            @click="submit(star)"
          >
            <Icon name="material-symbols:star-rounded" class="text-lg sm:text-xl" />
          </button>
        </div>

        <!-- Withdraw / Retract Action if voted -->
        <button
          v-if="isMine"
          type="button"
          class="inline-flex items-center gap-1 rounded-xl border border-line bg-surface/60 px-2.5 py-2 text-xs text-faint hover:border-danger/40 hover:text-danger transition-colors font-medium shadow-2xs"
          :title="$t('rating.remove')"
          @click="submit(rating.mine)"
        >
          <Icon name="material-symbols:restart-alt-rounded" class="text-xs" />
          <span>{{ $t('rating.remove') }}</span>
        </button>

        <!-- Sign-in prompt if visitor -->
        <NuxtLink
          v-else-if="!auth.isAuthenticated"
          :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
          class="inline-flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-xs font-semibold text-accent hover:bg-accent hover:text-on-accent transition-all shadow-2xs"
        >
          <Icon name="material-symbols:login-rounded" class="text-sm" />
          <span>{{ $t('rating.signInToRate') }}</span>
        </NuxtLink>

        <!-- Error alert -->
        <div v-if="failed" role="alert" class="text-xs font-medium text-danger">
          {{ $t('rating.failed') }}
        </div>
      </div>
    </div>
  </div>
</template>
