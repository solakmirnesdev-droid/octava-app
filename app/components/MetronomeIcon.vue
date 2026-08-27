<script setup>
defineProps({
  size: { type: String, default: '1.25em' }
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
    <!-- Pyramid body -->
    <path d="m6.2 20 3.3-15h5l3.3 15" />
    <path d="M4.5 20h15" stroke-width="2" />
    <!-- Center scale guide -->
    <path d="M12 8v8" stroke-width="1" stroke-dasharray="1.5 2" opacity="0.35" />
    <!-- Ticking pendulum wand -->
    <path d="m12 17 4.2-11.2" stroke-width="2" />
    <!-- Sliding tempo weight (bob) -->
    <rect x="13.8" y="7.6" width="3.4" height="2.8" rx="0.6" fill="currentColor" />
  </svg>
</template>
