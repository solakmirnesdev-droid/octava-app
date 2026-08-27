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
    <!-- Zoomed Ukulele Fretboard: 4 Light Nylon Strings with Inlay Dot -->
    <!-- Neck edges -->
    <path d="M4 2v20M20 2v20" stroke-width="1.5" opacity="0.6" />
    <!-- Top Nut (Kobilica) -->
    <line x1="3.5" y1="4.5" x2="20.5" y2="4.5" stroke-width="2.2" stroke-linecap="square" />
    <!-- Fret bars -->
    <line x1="4" y1="12.5" x2="20" y2="12.5" stroke-width="1" opacity="0.4" />
    <line x1="4" y1="20.5" x2="20" y2="20.5" stroke-width="1" opacity="0.4" />

    <!-- Position Inlay Dot between frets -->
    <circle cx="12" cy="16.5" r="1.3" fill="currentColor" opacity="0.6" />

    <!-- 4 Balanced Nylon Strings (G-C-E-A) -->
    <line x1="6.4" y1="2" x2="6.4" y2="22" stroke-width="1.2" />
    <line x1="10.1" y1="2" x2="10.1" y2="22" stroke-width="1.5" />
    <line x1="13.9" y1="2" x2="13.9" y2="22" stroke-width="1.3" />
    <line x1="17.6" y1="2" x2="17.6" y2="22" stroke-width="1.1" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: String, default: '1.25em' }
});
</script>
