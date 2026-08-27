<script setup>
defineProps({
  size: { type: String, default: '1.25em' }
});
</script>

<template>
  <!-- Iconic Studio Vocal Microphone (representing Artists / Performers / Izvođači) -->
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
    <!-- Dynamic Capsule with inner tone -->
    <rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" fill-opacity="0.15" />
    <path d="M9 6.5h6M9 9.5h6" stroke-width="1.2" opacity="0.75" />

    <!-- U-shaped Cradle -->
    <path d="M5.5 10.5a6.5 6.5 0 0 0 13 0" />

    <!-- Stem & Base Stand -->
    <line x1="12" y1="17" x2="12" y2="21.5" />
    <line x1="8.5" y1="21.5" x2="15.5" y2="21.5" stroke-width="2.2" />
  </svg>
</template>
