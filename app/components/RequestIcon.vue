<script setup>
defineProps({
  size: { type: String, default: '1.25em' }
});
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    :style="{ width: size, height: size }"
    class="inline-block shrink-0 align-[-0.15em]"
    aria-hidden="true"
  >
    <!-- Musical Eighth Note -->
    <path
      d="M10 16.5C10 18.433 8.209 20 6 20C3.791 20 2 18.433 2 16.5C2 14.567 3.791 13 6 13C7.28 13 8.41 13.525 9.15 14.36L10 14.5V4C10 3.448 10.448 3 11 3H13.5C14.052 3 14.5 3.448 14.5 4V7C14.5 7.552 14.052 8 13.5 8H11V15.2"
      fill="currentColor"
    />
    <!-- Distinct Plus Action Badge -->
    <path
      d="M19 4V12M15 8H23"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
