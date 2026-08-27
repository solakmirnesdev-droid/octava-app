<script setup>
defineProps({
  size: { type: String, default: '1.25em' }
});
</script>

<template>
  <!-- Guitar Chord Diagram Icon (Amol / A-minor chord fingering: x02210) -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    aria-hidden="true"
    class="inline-block shrink-0 align-[-0.15em]"
  >
    <!-- Top Nut line (thick) -->
    <path d="M4 4.5h16" stroke-width="2.5" stroke-linecap="round" />

    <!-- Frets (horizontal lines) -->
    <path d="M4.5 9.5h15M4.5 14.5h15M4.5 19.5h15" stroke-width="1.2" stroke-linecap="round" opacity="0.65" />

    <!-- Strings (vertical lines: E, A, D, G, B, e) -->
    <path
      d="M4.5 4.5v15M7.6 4.5v15M10.7 4.5v15M13.8 4.5v15M16.9 4.5v15M20 4.5v15"
      stroke-width="1.2"
      stroke-linecap="round"
      opacity="0.65"
    />

    <!-- Finger dots for Am chord (A-minor fingering) -->
    <!-- 1st fret on B string (index 4) -->
    <circle cx="16.9" cy="7" r="1.6" fill="currentColor" stroke="none" />
    <!-- 2nd fret on G string (index 3) -->
    <circle cx="13.8" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <!-- 2nd fret on D string (index 2) -->
    <circle cx="10.7" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
</template>
