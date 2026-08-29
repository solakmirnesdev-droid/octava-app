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
  anchor: { type: Object, default: null },
  /** External play trigger counter */
  playTrigger: { type: Number, default: 0 }
});
const emit = defineEmits(['keep', 'leave']);

const el = ref(null);
const ringing = ref(false);
let ringTimer = null;

function triggerRinging() {
  ringing.value = false;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ringing.value = true;
      clearTimeout(ringTimer);
      ringTimer = setTimeout(() => {
        ringing.value = false;
      }, 900);
    });
  });
}

const style = ref({
  position: 'fixed',
  top: '-9999px',
  left: '-9999px',
  zIndex: 9999,
  visibility: 'hidden'
});

const GAP = 10;
const MARGIN = 10;

function place() {
  if (!props.anchor || !el.value) return;
  const a = props.anchor.getBoundingClientRect();
  const box = el.value.getBoundingClientRect();

  const width = box.width > 0 ? box.width : el.value.offsetWidth || 150;
  const height = box.height > 0 ? box.height : el.value.offsetHeight || 230;

  // Above by default; below when there is no room, which is the case for the
  // first line of the sheet and for anything under the sticky header.
  const fitsAbove = a.top - height - GAP >= MARGIN;
  const top = fitsAbove ? a.top - height - GAP : a.bottom + GAP;

  // Centred on the chord, then pulled back inside the viewport rather than
  // hanging off the edge.
  const wanted = a.left + a.width / 2 - width / 2;
  const left = Math.min(Math.max(wanted, MARGIN), window.innerWidth - width - MARGIN);

  style.value = {
    position: 'fixed',
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    zIndex: 9999,
    visibility: 'visible'
  };
}

let resizeObserver = null;

onMounted(async () => {
  await nextTick();
  place();
  window.addEventListener('scroll', place, { passive: true });
  window.addEventListener('resize', place);

  if (typeof ResizeObserver !== 'undefined' && el.value) {
    resizeObserver = new ResizeObserver(() => {
      place();
    });
    resizeObserver.observe(el.value);
  }

  if (props.playTrigger > 0) {
    triggerRinging();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', place);
  window.removeEventListener('resize', place);
  clearTimeout(ringTimer);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

watch(() => props.anchor, async () => {
  await nextTick();
  place();
});

watch(() => props.playTrigger, (newVal, oldVal) => {
  if (newVal > 0 && newVal !== oldVal) {
    triggerRinging();
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="popup" appear>
      <div
        ref="el"
        :style="style"
        class="rounded-2xl border border-line bg-panel/95 p-2.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 before:absolute before:-inset-3 before:content-[''] cursor-pointer"
        :class="ringing ? 'popup-shadow-ringing' : ''"
        @mouseenter="emit('keep')"
        @mouseleave="emit('leave')"
        @click="triggerRinging"
      >
        <ChordDiagram
          :symbol="symbol"
          :compact="true"
          :play-trigger="playTrigger"
          @play="triggerRinging"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@keyframes popup-shadow-vibrate {
  0% {
    box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.4), 0 0 0 0 rgba(224, 90, 58, 0);
  }
  15% {
    box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.4), 0 0 24px 4px rgba(224, 90, 58, 0.5);
  }
  30% {
    box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.4), 0 0 12px 2px rgba(224, 90, 58, 0.3);
  }
  50% {
    box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.4), 0 0 20px 3px rgba(224, 90, 58, 0.45);
  }
  70% {
    box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.4), 0 0 10px 1px rgba(224, 90, 58, 0.25);
  }
  85% {
    box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.4), 0 0 14px 2px rgba(224, 90, 58, 0.3);
  }
  100% {
    box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.4), 0 0 0 0 rgba(224, 90, 58, 0);
  }
}

.popup-shadow-ringing {
  animation: popup-shadow-vibrate 0.85s cubic-bezier(0.25, 1, 0.5, 1) both;
}
</style>
