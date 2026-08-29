<script setup>
const { running, speed, toggle, faster, slower, canGoFaster, canGoSlower } = useAutoScroll();
</script>

<template>
  <div class="flex items-center gap-1.5">
    <span class="hidden text-[11px] font-bold uppercase tracking-wider text-muted/70 lg:inline select-none">
      {{ $t('song.scroll') }}
    </span>

    <div class="inline-flex items-center rounded-xl border border-line-soft bg-surface/80 p-0.5 shadow-2xs hover:border-line transition-colors">
      <!-- Play / Pause Primary Trigger -->
      <button
        type="button"
        class="flex size-7 items-center justify-center rounded-lg font-medium transition-all cursor-pointer"
        :class="running ? 'bg-accent text-on-accent shadow-xs scale-105' : 'text-muted hover:bg-panel hover:text-accent'"
        :title="running ? $t('song.scrollStop') : $t('song.scrollStart')"
        :aria-pressed="running"
        @click="toggle"
      >
        <Icon v-if="running" name="material-symbols:pause-rounded" class="text-base" />
        <Icon v-else name="material-symbols:play-arrow-rounded" class="text-base" />
        <span class="sr-only">{{ running ? $t('song.scrollStopSr') : $t('song.scrollStartSr') }}</span>
      </button>

      <!-- Slower Step -->
      <button
        type="button"
        class="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-muted hover:bg-panel hover:text-accent disabled:opacity-25 active:scale-95 transition-all cursor-pointer"
        :disabled="!canGoSlower"
        :title="$t('song.slower')"
        :aria-label="$t('song.slower')"
        @click="slower"
      >
        <Icon name="material-symbols:remove-rounded" class="text-sm" />
      </button>

      <!-- Speed Value -->
      <span class="min-w-[1.25rem] px-0.5 py-0.5 text-center font-mono text-xs font-bold text-ink select-none">
        {{ speed }}
      </span>

      <!-- Faster Step -->
      <button
        type="button"
        class="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-muted hover:bg-panel hover:text-accent disabled:opacity-25 active:scale-95 transition-all cursor-pointer"
        :disabled="!canGoFaster"
        :title="$t('song.faster')"
        :aria-label="$t('song.faster')"
        @click="faster"
      >
        <Icon name="material-symbols:add-rounded" class="text-sm" />
      </button>
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
