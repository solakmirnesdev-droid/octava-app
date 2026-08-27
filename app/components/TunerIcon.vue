<script setup>
defineProps({
  size: { type: String, default: '1.25em' }
});
</script>

<template>
  <!-- Guitar Tuner Icon: Guitar Headstock with 6 Tuning Pegs (čivije) & Nut -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="inline-block shrink-0 align-[-0.15em]"
  >
    <!-- Guitar headstock body contour -->
    <path
      d="M7 21.5v-3.5L6.5 7c0-2.8 2-4.5 5.5-4.5s5.5 1.7 5.5 4.5l-.5 11v3.5"
    />

    <!-- Nut (kobilica na vratu) -->
    <path d="M6 19.5h12" stroke-width="2.2" />

    <!-- 3 Left Tuning Pegs (čivije) -->
    <path d="M6.5 7.5H4.5M6.5 11.5H4.5M6.5 15.5H4.5" />
    <rect x="2" y="6" width="2.5" height="3" rx="1" fill="currentColor" stroke="none" />
    <rect x="2" y="10" width="2.5" height="3" rx="1" fill="currentColor" stroke="none" />
    <rect x="2" y="14" width="2.5" height="3" rx="1" fill="currentColor" stroke="none" />

    <!-- 3 Right Tuning Pegs (čivije) -->
    <path d="M17.5 7.5h2M17.5 11.5h2M17.5 15.5h2" />
    <rect x="19.5" y="6" width="2.5" height="3" rx="1" fill="currentColor" stroke="none" />
    <rect x="19.5" y="10" width="2.5" height="3" rx="1" fill="currentColor" stroke="none" />
    <rect x="19.5" y="14" width="2.5" height="3" rx="1" fill="currentColor" stroke="none" />

    <!-- Center string posts / guide -->
    <circle cx="9.5" cy="11.5" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="11.5" r="0.75" fill="currentColor" stroke="none" />
  </svg>
</template>
