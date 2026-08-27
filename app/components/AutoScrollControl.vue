<script setup>
const { running, speed, toggle, faster, slower, canGoFaster, canGoSlower } = useAutoScroll();
</script>

<template>
  <div class="flex items-center gap-1.5 sm:gap-2">
    <span class="hidden text-xs font-semibold uppercase tracking-wider text-faint md:inline">{{ $t('song.scroll') }}</span>

    <div class="inline-flex items-center rounded-xl border border-line bg-surface/90 p-0.5 shadow-2xs">
      <button
        type="button"
        class="flex size-7 items-center justify-center rounded-lg font-medium transition-all"
        :class="running ? 'bg-accent text-on-accent shadow-xs' : 'text-muted hover:bg-panel hover:text-accent'"
        :title="running ? $t('song.scrollStop') : $t('song.scrollStart')"
        :aria-pressed="running"
        @click="toggle"
      >
        <Icon :name="running ? 'material-symbols:pause-rounded' : 'material-symbols:play-arrow-rounded'" class="text-base" />
        <span class="sr-only">{{ running ? $t('song.scrollStopSr') : $t('song.scrollStartSr') }}</span>
      </button>

      <button
        type="button"
        class="rounded-lg px-2 py-1 text-xs font-bold text-muted hover:bg-panel hover:text-accent disabled:opacity-25 transition-colors"
        :disabled="!canGoSlower"
        :title="$t('song.slower')"
        :aria-label="$t('song.slower')"
        @click="slower"
      >−</button>

      <span class="min-w-[1.5rem] px-1 py-1 text-center font-mono text-xs font-bold text-ink">
        {{ speed }}
      </span>

      <button
        type="button"
        class="rounded-lg px-2 py-1 text-xs font-bold text-muted hover:bg-panel hover:text-accent disabled:opacity-25 transition-colors"
        :disabled="!canGoFaster"
        :title="$t('song.faster')"
        :aria-label="$t('song.faster')"
        @click="faster"
      >+</button>
    </div>

    <!-- Teleported Floating Status Pill -->
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
          class="pointer-events-none fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-line bg-panel/95 px-3.5 py-2 text-xs font-medium text-ink shadow-lg backdrop-blur-md"
          role="status"
        >
          <span class="size-2 rounded-full bg-accent animate-pulse" />
          <span>{{ $t('song.tapToStop') }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
