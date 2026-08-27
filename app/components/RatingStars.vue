<script setup>
/**
 * A rating: read-only by default, a control when given a slug.
 *
 * The fill is a clipped copy of the same row laid over the empty one, rather
 * than rounding to whole stars — 4.7 and 5.0 are different numbers and a reader
 * comparing two charts is entitled to see that.
 *
 * AI-DECISION: made interactive here rather than reaching for StarRating.vue.
 * That one loads the average and the reader's own vote on mount, which is right
 * for a song page and wrong for a list of thirty rows — thirty requests before
 * anything is legible. This takes the average it is already being handed and
 * only talks to the server when somebody actually votes.
 */
const props = defineProps({
  value: { type: Number, default: 0 },
  count: { type: Number, default: 0 },
  /** Hide the numeral where space is tight and the stars carry enough. */
  showNumber: { type: Boolean, default: true },
  /** Given a song, the stars become a vote rather than a picture. */
  slug: { type: String, default: '' },
  arrangementId: { type: String, default: '' },
  songTitle: { type: String, default: '' },
  artistName: { type: String, default: '' },
  artistId: { type: String, default: '' }
});

const emit = defineEmits(['rated']);

const { $api } = useNuxtApp();
const auth = useAuthStore();
// AI-TRAP: before anything that reads it. A computed body is lazy so this
// happens to survive, but the same pattern in a non-lazy position is a 500 on
// the page and nothing at build time — it has already cost a session once.
const { t } = useI18n();
const { show: showToast } = useToast();

const hovered = ref(0);
const mine = ref(0);
const saving = ref(false);

const interactive = computed(() => Boolean(props.slug) && auth.isAuthenticated);

// Hover wins, then your own vote, then the average that was passed in.
const shown = computed(() => {
  if (hovered.value) return hovered.value;
  if (mine.value) return mine.value;
  return props.value;
});

const percent = computed(() => Math.max(0, Math.min(100, (shown.value / 5) * 100)));
const rated = computed(() => props.count > 0 || mine.value > 0);
const formatted = computed(() => shown.value.toFixed(1));

async function submit(value) {
  if (!interactive.value || saving.value) return;
  saving.value = true;

  // Optimistic: the star should answer the tap, not the round trip.
  const previous = mine.value;
  const wasMine = previous === value;
  mine.value = wasMine ? 0 : value;

  try {
    // Sending the same value again withdraws it, so the control is its own
    // undo rather than needing a separate one.
    const method = wasMine ? 'DELETE' : 'POST';
    const result = await $api(`/songs/${props.slug}/rating`, {
      method,
      body: { value, arrangementId: props.arrangementId || undefined }
    });
    emit('rated', result.rating);

    showToast({
      title: props.songTitle || props.slug,
      artistName: props.artistName,
      artistId: props.artistId,
      type: 'rating',
      ratingValue: wasMine ? null : value,
      message: wasMine ? t('rating.retractedToast') : t('rating.ratedToast', { n: value })
    });
  } catch {
    mine.value = previous;
  } finally {
    saving.value = false;
    hovered.value = 0;
  }
}

const title = computed(() => {
  if (mine.value) return t('rating.yours', { n: mine.value });
  if (interactive.value) return t('rating.rate');
  return rated.value ? t('rating.average', { average: formatted.value }) : t('rating.count', { n: 0 }, 0);
});

</script>

<template>
  <!-- Read-only: a plain span, with no button semantics to promise a click. -->
  <span
    v-if="!interactive"
    class="inline-flex shrink-0 items-center gap-1.5"
    :title="title"
  >
    <span class="relative inline-block leading-none" aria-hidden="true">
      <span class="flex text-dim">
        <Icon v-for="i in 5" :key="`e${i}`" name="material-symbols:star-rounded" class="text-sm" />
      </span>

      <!-- Overlaid and clipped: one partial star instead of a rounded one. -->
      <span
        v-if="rated"
        class="absolute inset-0 flex overflow-hidden text-warn"
        :style="{ width: percent + '%' }"
      >
        <Icon v-for="i in 5" :key="`f${i}`" name="material-symbols:star-rounded" class="shrink-0 text-sm" />
      </span>
    </span>

    <span v-if="showNumber" class="font-mono text-xs" :class="rated ? 'text-muted' : 'text-dim'">
      {{ rated ? formatted : '—' }}
    </span>

    <span class="sr-only">
      {{ rated ? $t('rating.count', { n: count }, count) : $t('rating.count', { n: 0 }, 0) }}
    </span>
  </span>

  <!-- A control: five buttons, so it works from a keyboard and announces itself. -->
  <span
    v-else
    class="inline-flex shrink-0 items-center gap-1.5"
    role="radiogroup"
    :aria-label="$t('rating.title')"
    @mouseleave="hovered = 0"
  >
    <span class="inline-flex leading-none">
      <button
        v-for="i in 5" :key="i"
        type="button"
        role="radio"
        :aria-checked="mine === i"
        :aria-label="$t('rating.give', { n: i })"
        :disabled="saving"
        class="leading-none transition-colors disabled:opacity-50"
        :class="i <= shown ? (mine ? 'text-accent' : 'text-warn') : 'text-dim hover:text-warn'"
        @mouseenter="hovered = i"
        @click.stop.prevent="submit(i)"
      >
        <Icon name="material-symbols:star-rounded" class="text-sm" />
      </button>
    </span>

    <span v-if="showNumber" class="font-mono text-xs" :class="rated ? 'text-muted' : 'text-dim'">
      {{ rated ? formatted : '—' }}
    </span>
  </span>
</template>
