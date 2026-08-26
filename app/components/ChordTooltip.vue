<script setup>
/**
 * The chord diagram that appears over a chord.
 *
 * Teleported to <body> and positioned with fixed coordinates measured from the
 * trigger, rather than absolutely positioned next to it.
 *
 * AI-TRAP: the obvious version — `position: absolute` inside a `.relative`
 * wrapper — breaks inside the two-column sheet. CSS multi-column fragments the
 * flow, and a browser resolves an absolutely-positioned descendant against the
 * FIRST fragment of its containing block. For a chord that landed in the second
 * column that fragment is still in the first, so the diagram rendered hundreds
 * of pixels away in the wrong column, looking exactly like "hover does not work
 * here". Measuring the trigger and using fixed coordinates sidesteps
 * fragmentation entirely.
 */
const props = defineProps({
  symbol: { type: String, required: true },
  /** The chord button this belongs to. Measured, never styled. */
  anchor: { type: Object, default: null }
});
const emit = defineEmits(['keep', 'leave']);

const el = ref(null);

/**
 * AI-TRAP: fixed from the very first paint, not just once placed.
 *
 * A plain block div measures the full width of its parent, so measuring before
 * taking it out of flow reported 1440px instead of 150px — and the clamp that
 * keeps it inside the viewport then pinned every diagram to the left edge. Out
 * of flow first, measure second.
 */
const style = ref({ position: 'fixed', top: '0px', left: '0px', visibility: 'hidden' });

const GAP = 6;
const MARGIN = 8;

function place() {
  if (!props.anchor || !el.value) return;
  const a = props.anchor.getBoundingClientRect();
  const box = el.value.getBoundingClientRect();

  // Above by default; below when there is no room, which is the case for the
  // first line of the sheet and for anything under the sticky header.
  const fits = a.top - box.height - GAP >= MARGIN;
  const top = fits ? a.top - box.height - GAP : a.bottom + GAP;

  // Centred on the chord, then pulled back inside the viewport rather than
  // hanging off the edge.
  const wanted = a.left + a.width / 2 - box.width / 2;
  const left = Math.min(Math.max(wanted, MARGIN), window.innerWidth - box.width - MARGIN);

  style.value = {
    position: 'fixed',
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    visibility: 'visible'
  };
}

onMounted(async () => {
  await nextTick();
  place();
  // Scrolling happens constantly here — auto-scroll is a feature of this page.
  window.addEventListener('scroll', place, { passive: true });
  window.addEventListener('resize', place);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', place);
  window.removeEventListener('resize', place);
});

watch(() => props.anchor, place);
</script>

<template>
  <Teleport to="body">
    <div
      ref="el"
      :style="style"
      class="z-30 rounded-lg border border-black/10 bg-white p-2 shadow-lg"
      @mouseenter="emit('keep')"
      @mouseleave="emit('leave')"
    >
      <ChordDiagram :symbol="symbol" />
    </div>
  </Teleport>
</template>
