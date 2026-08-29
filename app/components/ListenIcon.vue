<script setup>
defineProps({
  size: { type: String, default: '1.25em' }
});
</script>

<template>
  <!-- Recognise Icon: a microphone hearing a song — capsule, stand, and the
       sound arriving from the room on either side. Drawn in the same stroke
       language as TunerIcon and MetronomeIcon so the nav row reads as one set. -->
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
    <!-- Microphone capsule -->
    <rect x="9.25" y="2.5" width="5.5" height="10" rx="2.75" />

    <!-- Cradle and stand -->
    <path d="M6.5 10.5v1a5.5 5.5 0 0 0 11 0v-1" />
    <path d="M12 17v4.5" />
    <path d="M9 21.5h6" stroke-width="2.2" />

    <!-- Sound arriving from the room -->
    <path d="M3.6 7.2a5 5 0 0 0 0 5" opacity="0.75" />
    <path d="M20.4 7.2a5 5 0 0 1 0 5" opacity="0.75" />
  </svg>
</template>
