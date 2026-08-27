<script setup>
const { fontSize, grow, shrink, reset, canGrow, canShrink, isDefault } = useSheetFontSize();
</script>

<template>
  <div class="flex items-center gap-1.5 sm:gap-2">
    <span class="hidden text-xs font-semibold uppercase tracking-wider text-faint md:inline">{{ $t('song.font') }}</span>

    <div class="inline-flex items-center rounded-xl border border-line bg-surface/90 p-0.5 shadow-2xs">
      <button
        type="button"
        class="rounded-lg px-2 py-1 text-xs font-bold text-muted hover:bg-panel hover:text-accent disabled:opacity-25 transition-colors"
        :disabled="!canShrink"
        :title="$t('song.textSmaller')"
        :aria-label="$t('song.textSmaller')"
        @click="shrink"
      >A−</button>

      <button
        type="button"
        class="min-w-[2.25rem] rounded-lg px-1.5 py-1 text-center font-mono text-xs font-bold text-ink hover:bg-panel transition-colors"
        :title="isDefault ? $t('song.defaultSize') : $t('song.resetSize')"
        @click="reset"
      >{{ fontSize }}</button>

      <button
        type="button"
        class="rounded-lg px-2 py-1 text-xs font-bold text-muted hover:bg-panel hover:text-accent disabled:opacity-25 transition-colors"
        :disabled="!canGrow"
        :title="$t('song.textBigger')"
        :aria-label="$t('song.textBigger')"
        @click="grow"
      >A+</button>
    </div>
  </div>
</template>
