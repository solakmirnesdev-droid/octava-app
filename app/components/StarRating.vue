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

const { data: ratingData } = await useAsyncData(
  () => `rating-${props.slug}-${props.arrangementId || 'primary'}`,
  () => $api(`/songs/${props.slug}/rating`, {
    params: props.arrangementId ? { arrangementId: props.arrangementId } : undefined
  }).then((r) => r.rating || { count: 0, average: 0, mine: null }).catch(() => ({ count: 0, average: 0, mine: null })),
  { watch: [() => props.arrangementId] }
);

const rating = computed({
  get: () => ratingData.value || { count: 0, average: 0, mine: null },
  set: (val) => { ratingData.value = val; }
});

const hovered = ref(0);
const saving = ref(false);
const failed = ref(false);

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
    class="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-r from-panel/95 via-panel/85 to-surface/90 p-3.5 sm:p-4 backdrop-blur-xl shadow-xs transition-all"
  >
    <!-- Background gold star ambient watermark -->
    <Icon
      name="material-symbols:star-rounded"
      class="pointer-events-none absolute -bottom-5 -right-5 select-none text-[100px] text-warn/5"
      aria-hidden="true"
    />

    <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
      <!-- 1. Left: Score Badge, Title, Verification Badges & Status -->
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <!-- Score Badge -->
        <div class="flex shrink-0 items-center gap-1.5 rounded-xl border border-warn/30 bg-warn-soft/90 px-3 py-1.5 text-warn shadow-2xs">
          <Icon name="material-symbols:star-rounded" class="text-base sm:text-lg" />
          <span class="font-mono text-base sm:text-lg font-extrabold leading-none">
            {{ rating.count > 0 ? rating.average.toFixed(1) : '–' }}
          </span>
        </div>

        <div class="min-w-0 flex-1">
          <!-- Row 1: Title + Count Badge + Inline Verified Badges -->
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-xs sm:text-sm font-bold text-ink tracking-tight">
              {{ $t('rating.title') }}
            </h3>
            <span class="rounded-md border border-line-soft bg-surface/80 px-1.5 py-0.5 text-[10px] font-mono text-faint">
              {{ rating.count > 0 ? $t('rating.count', rating.count, { n: rating.count }) : '0 ocjena' }}
            </span>

            <!-- Subtle Quality Verified Badges (Hidden on mobile to preserve single line) -->
            <div class="hidden xl:flex items-center gap-1.5 text-[10px] text-muted font-medium ml-1">
              <span class="inline-flex items-center gap-1 rounded-md bg-surface/60 border border-line-soft px-1.5 py-0.5">
                <Icon name="material-symbols:music-note-rounded" class="text-accent text-xs" />
                Originalni tonalitet
              </span>
              <span class="inline-flex items-center gap-1 rounded-md bg-surface/60 border border-line-soft px-1.5 py-0.5">
                <Icon name="material-symbols:check-circle-rounded" class="text-ok text-xs" />
                Tačan tekst
              </span>
              <span class="inline-flex items-center gap-1 rounded-md bg-surface/60 border border-line-soft px-1.5 py-0.5">
                <Icon name="material-symbols:graphic-eq-rounded" class="text-warn text-xs" />
                Harmonizacija
              </span>
            </div>
          </div>

          <!-- Row 2: Subtitle status feedback -->
          <p class="mt-0.5 text-xs text-muted truncate">
            <span v-if="hovered" class="font-semibold text-warn">
              {{ hoverLabel }}
            </span>
            <span v-else-if="isMine" class="inline-flex items-center gap-1 font-semibold text-accent">
              <Icon name="material-symbols:check-circle-rounded" class="text-xs" />
              Tvoja ocjena: {{ rating.mine }} / 5 ★
            </span>
            <span v-else class="text-faint">
              {{ $t('rating.hint') }}
            </span>
          </p>
        </div>
      </div>

      <!-- 2. Right: Interactive Rating Stars & Actions -->
      <div class="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-line-soft/60 pt-2 sm:pt-0">
        <!-- Withdraw / Retract Action if voted (Icon only, placed on left) -->
        <button
          v-if="isMine"
          type="button"
          class="flex size-7 sm:size-8 items-center justify-center rounded-xl border border-line-soft bg-surface/80 text-faint hover:border-danger/40 hover:text-danger hover:bg-surface transition-colors shadow-2xs cursor-pointer"
          :title="$t('rating.remove')"
          :aria-label="$t('rating.remove')"
          @click="submit(rating.mine)"
        >
          <Icon name="material-symbols:restart-alt-rounded" class="text-sm sm:text-base" />
        </button>

        <!-- 5 Interactive Star Rating Buttons -->
        <div
          class="flex items-center gap-0.5 rounded-xl border border-line bg-surface/90 p-1 shadow-2xs"
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
            class="group relative flex size-7 sm:size-8 items-center justify-center rounded-lg transition-all duration-150 disabled:cursor-default"
            :class="[
              star <= displayed
                ? (isMine && !hovered ? 'text-accent' : 'text-warn')
                : 'text-dim hover:text-warn/70',
              auth.isAuthenticated && 'hover:bg-raised hover:scale-110 active:scale-95'
            ]"
            @mouseenter="auth.isAuthenticated && (hovered = star)"
            @click="submit(star)"
          >
            <Icon name="material-symbols:star-rounded" class="text-lg sm:text-xl transition-transform" />
          </button>
        </div>

        <!-- Sign-in prompt if visitor -->
        <NuxtLink
          v-if="!auth.isAuthenticated"
          :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
          class="inline-flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-on-accent transition-all shadow-2xs"
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
