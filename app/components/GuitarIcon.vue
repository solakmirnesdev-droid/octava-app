<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="shrink-0"
    :style="{ width: size || '1.25em', height: size || '1.25em' }"
    aria-hidden="true"
  >
    <!-- Zoomed Guitar Fretboard: 6 Strings -->
    <!-- Neck edges -->
    <path d="M3 2v20M21 2v20" stroke-width="1.5" opacity="0.6" />
    <!-- Top Nut (Kobilica) -->
    <line x1="2.5" y1="4.5" x2="21.5" y2="4.5" stroke-width="2.5" stroke-linecap="square" />
    <!-- Fret bars -->
    <line x1="3" y1="12.5" x2="21" y2="12.5" stroke-width="1" opacity="0.4" />
    <line x1="3" y1="20.5" x2="21" y2="20.5" stroke-width="1" opacity="0.4" />

    <!-- 6 Parallel Strings (6 E-A-D-G-B-e) with realistic progressive gauges -->
    <line x1="4.8" y1="2" x2="4.8" y2="22" stroke-width="1.6" />
    <line x1="7.7" y1="2" x2="7.7" y2="22" stroke-width="1.4" />
    <line x1="10.6" y1="2" x2="10.6" y2="22" stroke-width="1.2" />
    <line x1="13.4" y1="2" x2="13.4" y2="22" stroke-width="1.0" />
    <line x1="16.3" y1="2" x2="16.3" y2="22" stroke-width="0.9" />
    <line x1="19.2" y1="2" x2="19.2" y2="22" stroke-width="0.8" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: String, default: '1.25em' }
});
</script>
