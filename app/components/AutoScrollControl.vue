<script setup>
const { running, speed, toggle, faster, slower, canGoFaster, canGoSlower } = useAutoScroll();
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="hidden text-xs font-medium uppercase tracking-wide text-faint sm:inline">{{ $t('song.scroll') }}</span>

    <div class="flex items-center overflow-hidden rounded border border-line-strong bg-panel">
      <button
        class="px-3 py-1.5 text-sm font-medium"
        :class="running ? 'bg-accent text-on-accent' : 'hover:bg-raised hover:text-accent'"
        :title="running ? $t('song.scrollStop') : $t('song.scrollStart')"
        :aria-pressed="running"
        @click="toggle"
      >
        <Icon :name="running ? 'material-symbols:pause-rounded' : 'material-symbols:play-arrow-rounded'" />
        <span class="sr-only">{{ running ? $t('song.scrollStopSr') : $t('song.scrollStartSr') }}</span>
      </button>

      <button
        class="border-l border-line px-2.5 py-1.5 text-xs hover:bg-raised hover:text-accent disabled:opacity-25"
        :disabled="!canGoSlower" :title="$t('song.slower')" :aria-label="$t('song.slower')"
        @click="slower"
      >−</button>

      <span class="min-w-[2rem] border-x border-line px-1 py-1.5 text-center font-mono text-xs">
        {{ speed }}
      </span>

      <button
        class="px-2.5 py-1.5 text-xs hover:bg-raised hover:text-accent disabled:opacity-25"
        :disabled="!canGoFaster" :title="$t('song.faster')" :aria-label="$t('song.faster')"
        @click="faster"
      >+</button>
    </div>

    <!-- AI-DECISION: Teleported fixed badge in corner so starting auto-scroll
         never shifts or wraps the toolbar layout. -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        leave-active-class="transition duration-150 ease-in"
        enter-from-class="translate-y-2 opacity-0"
        leave-to-class="translate-y-2 opacity-0"
      >
        <div
          v-if="running"
          data-print="hide"
          class="pointer-events-none fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-line bg-panel/90 px-3 py-1.5 text-xs text-muted shadow-md backdrop-blur"
          role="status"
        >
          <span class="size-2 rounded-full bg-accent animate-pulse" />
          <span>{{ $t('song.tapToStop') }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
