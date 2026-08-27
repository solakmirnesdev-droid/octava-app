<script setup>
/**
 * A rating, read-only.
 *
 * Distinct from StarRating.vue, which is the control on a song page: this one
 * never takes a click, so it carries no button semantics and no hover state.
 *
 * The fill is a clipped copy of the same row laid over the empty one, rather
 * than rounding to whole stars — 4.7 and 5.0 are different numbers and a
 * reader comparing two charts is entitled to see that.
 */
const props = defineProps({
  value: { type: Number, default: 0 },
  count: { type: Number, default: 0 },
  /** Hide the numeral where space is tight and the stars carry enough. */
  showNumber: { type: Boolean, default: true }
});

const percent = computed(() => Math.max(0, Math.min(100, (props.value / 5) * 100)));
const rated = computed(() => props.count > 0);
const formatted = computed(() => props.value.toFixed(1));
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center gap-1.5"
    :title="rated ? $t('rating.average', { average: formatted }) : $t('rating.count', { n: 0 }, 0)"
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
</template>
