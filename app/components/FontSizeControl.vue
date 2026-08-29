<script setup>
const { fontSize, grow, shrink, reset, canGrow, canShrink, isDefault } = useSheetFontSize();
</script>

<template>
  <div class="flex items-center gap-1.5">
    <span class="hidden text-[11px] font-bold uppercase tracking-wider text-muted/70 lg:inline select-none">
      {{ $t('song.font') }}
    </span>

    <div class="inline-flex items-center rounded-xl border border-line-soft bg-surface/80 p-0.5 shadow-2xs hover:border-line transition-colors">
      <button
        type="button"
        class="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-muted hover:bg-panel hover:text-accent disabled:opacity-25 active:scale-95 transition-all cursor-pointer"
        :disabled="!canShrink"
        :title="$t('song.textSmaller')"
        :aria-label="$t('song.textSmaller')"
        @click="shrink"
      >
        <span class="font-bold text-xs leading-none">A−</span>
      </button>

      <button
        type="button"
        class="min-w-[2rem] px-1 py-0.5 text-center font-mono text-xs font-bold text-ink hover:bg-panel rounded-lg transition-colors cursor-pointer"
        :title="isDefault ? $t('song.defaultSize') : $t('song.resetSize')"
        @click="reset"
      >
        {{ fontSize }}
      </button>

      <button
        type="button"
        class="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-muted hover:bg-panel hover:text-accent disabled:opacity-25 active:scale-95 transition-all cursor-pointer"
        :disabled="!canGrow"
        :title="$t('song.textBigger')"
        :aria-label="$t('song.textBigger')"
        @click="grow"
      >
        <span class="font-bold text-xs leading-none">A+</span>
      </button>
    </div>
  </div>
</template>
