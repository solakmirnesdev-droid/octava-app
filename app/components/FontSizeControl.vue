<script setup>
const { fontSize, grow, shrink, reset, canGrow, canShrink, isDefault } = useSheetFontSize();
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="hidden text-xs font-medium uppercase tracking-wide text-black/40 sm:inline">{{ $t('song.font') }}</span>

    <div class="flex items-center overflow-hidden rounded border border-black/15 bg-white">
      <button
        class="px-2.5 py-1.5 text-xs hover:bg-black/5 hover:text-accent disabled:opacity-25"
        :disabled="!canShrink" :title="$t('song.textSmaller')" :aria-label="$t('song.textSmaller')"
        @click="shrink"
      >A−</button>

      <button
        class="min-w-[2.75rem] border-x border-black/10 px-1 py-1.5 text-center font-mono text-xs hover:bg-black/5"
        :title="isDefault ? $t('song.defaultSize') : $t('song.resetSize')"
        @click="reset"
      >{{ fontSize }}</button>

      <button
        class="px-2.5 py-1.5 text-sm hover:bg-black/5 hover:text-accent disabled:opacity-25"
        :disabled="!canGrow" :title="$t('song.textBigger')" :aria-label="$t('song.textBigger')"
        @click="grow"
      >A+</button>
    </div>
  </div>
</template>
