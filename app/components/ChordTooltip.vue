<script setup>
defineProps({ symbol: { type: String, required: true } });
const emit = defineEmits(['keep', 'leave']);
</script>

<template>
  <!-- Anchored to the chord, but centred and lifted clear of the lyric line.
       z-20 keeps it above the sticky header's stacking context. -->
  <div
    class="absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 rounded-lg border border-black/10 bg-white p-2 shadow-lg"
    @mouseenter="emit('keep')"
    @mouseleave="emit('leave')"
  >
    <ChordDiagram :symbol="symbol" />
  </div>
</template>
