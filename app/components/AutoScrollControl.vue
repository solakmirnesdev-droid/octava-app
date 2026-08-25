<script setup>
const { running, speed, toggle, faster, slower, canGoFaster, canGoSlower } = useAutoScroll();
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="hidden text-xs font-medium uppercase tracking-wide text-black/40 sm:inline">Klizanje</span>

    <div class="flex items-center overflow-hidden rounded border border-black/15 bg-white">
      <button
        class="px-3 py-1.5 text-sm font-medium"
        :class="running ? 'bg-accent text-white' : 'hover:bg-black/5 hover:text-accent'"
        :title="running ? 'Zaustavi' : 'Pokreni automatsko klizanje'"
        :aria-pressed="running"
        @click="toggle"
      >
        <span v-if="running" aria-hidden="true">❚❚</span>
        <span v-else aria-hidden="true">▶</span>
        <span class="sr-only">{{ running ? 'Zaustavi klizanje' : 'Pokreni klizanje' }}</span>
      </button>

      <button
        class="border-l border-black/10 px-2.5 py-1.5 text-xs hover:bg-black/5 hover:text-accent disabled:opacity-25"
        :disabled="!canGoSlower" title="Sporije" aria-label="Sporije"
        @click="slower"
      >−</button>

      <span class="min-w-[2rem] border-x border-black/10 px-1 py-1.5 text-center font-mono text-xs">
        {{ speed }}
      </span>

      <button
        class="px-2.5 py-1.5 text-xs hover:bg-black/5 hover:text-accent disabled:opacity-25"
        :disabled="!canGoFaster" title="Brže" aria-label="Brže"
        @click="faster"
      >+</button>
    </div>

    <span v-if="running" class="hidden text-xs text-black/35 sm:inline">dodirni ekran da staneš</span>
  </div>
</template>
