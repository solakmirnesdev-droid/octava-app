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
    <!-- Zoomed Bass Fretboard: 4 Thick Heavy Strings -->
    <!-- Neck edges -->
    <path d="M3 2v20M21 2v20" stroke-width="1.5" opacity="0.6" />
    <!-- Top Nut (Kobilica) -->
    <line x1="2.5" y1="4.5" x2="21.5" y2="4.5" stroke-width="2.5" stroke-linecap="square" />
    <!-- Fret bars -->
    <line x1="3" y1="12.5" x2="21" y2="12.5" stroke-width="1" opacity="0.4" />
    <line x1="3" y1="20.5" x2="21" y2="20.5" stroke-width="1" opacity="0.4" />

    <!-- 4 Thick Heavy Bass Strings (E-A-D-G) -->
    <line x1="5.8" y1="2" x2="5.8" y2="22" stroke-width="2.6" />
    <line x1="9.9" y1="2" x2="9.9" y2="22" stroke-width="2.2" />
    <line x1="14.1" y1="2" x2="14.1" y2="22" stroke-width="1.8" />
    <line x1="18.2" y1="2" x2="18.2" y2="22" stroke-width="1.4" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: String, default: '1.25em' }
});
</script>
