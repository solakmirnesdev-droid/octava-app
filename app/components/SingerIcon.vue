<script setup>
defineProps({
  size: { type: String, default: '1.25em' }
});
</script>

<template>
  <!-- Artist / Singer Icon: Person performing into a microphone -->
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
    <!-- Singer: Head & Shoulders -->
    <circle cx="8" cy="6.5" r="3.2" fill="currentColor" fill-opacity="0.15" />
    <path d="M2.5 19.5c0-3 2.5-5.5 5.5-5.5h1c1.5 0 2.9.6 3.9 1.6" />

    <!-- Vocal Microphone on Stand -->
    <rect x="15" y="4" width="4.5" height="7" rx="2.25" fill="currentColor" fill-opacity="0.2" />
    <path d="M15 7.5h4.5" stroke-width="1.2" opacity="0.75" />
    <path d="M13.5 8.5a3.75 3.75 0 0 0 7.5 0" />
    <path d="M17.25 12.25v6" />
    <path d="M14.5 20h5.5" stroke-width="2" />
  </svg>
</template>
