<script setup>
const props = defineProps({
  size: { type: String, default: '1.25em' },
  running: { type: Boolean, default: false },
  duration: { type: String, default: '0.6s' }
});

const needleStyle = computed(() => {
  if (props.running) {
    return {
      animationDuration: props.duration
    };
  }
  return {};
});
</script>

<template>
  <!-- Real mechanical pyramid metronome with swinging pendulum arm and tempo weight -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.85"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="inline-block shrink-0 align-[-0.15em]"
  >
    <!-- Pyramid body casing (Fixed, stable upright base) -->
    <path d="m6.2 20 3.3-15h5l3.3 15" />
    <path d="M4.5 20h15" stroke-width="2" />
    <!-- Center scale guide -->
    <path d="M12 8v8" stroke-width="1" stroke-dasharray="1.5 2" opacity="0.35" />

    <!-- Swinging Pendulum Needle (wand + weight + bottom pivot dot) -->
    <g
      class="metronome-needle"
      :class="running ? 'is-running' : 'is-parked-left'"
      :style="needleStyle"
    >
      <!-- Vertical wand from pivot (12, 17) to tip (12, 5.5) -->
      <path d="M12 17V5.5" stroke-width="2" />
      <!-- Sliding tempo weight (bob) on wand -->
      <rect x="10.3" y="7.5" width="3.4" height="2.8" rx="0.6" fill="currentColor" />
      <!-- Pivot anchor dot at base -->
      <circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none" />
    </g>
  </svg>
</template>

<style scoped>
.metronome-needle {
  transform-origin: 12px 17px;
  transform-box: view-box;
}

/* Far left rest parked position when turned off */
.metronome-needle.is-parked-left {
  transform: rotate(-28deg);
  transition: transform 0.2s ease-out;
}

/* Synchronized left-right swing when running */
.metronome-needle.is-running {
  animation: needleActiveSwing ease-in-out infinite alternate;
}

@keyframes needleActiveSwing {
  0% {
    transform: rotate(-28deg);
  }
  100% {
    transform: rotate(28deg);
  }
}
</style>
