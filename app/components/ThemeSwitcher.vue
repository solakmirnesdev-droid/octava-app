<script setup>
const { mode, cycle } = useTheme();
const { t } = useI18n();

const label = computed(() => t('theme.switch', { mode: t(`theme.${mode.value}`) }));
</script>

<template>
  <button
    type="button"
    class="flex size-8.5 shrink-0 items-center justify-center rounded-xl border border-transparent text-muted outline-none transition-all duration-150 hover:border-line hover:bg-panel hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40"
    :title="label"
    :aria-label="label"
    @click="cycle"
  >
    <!-- AI-TRAP: the three names are literals toggled with v-show, never one
         bound expression. @nuxt/icon builds its client bundle by scanning source
         for literal names, so a computed name renders a correctly sized SVG with
         no paths in it — a blank button that reads as a styling bug. -->
    <Icon v-show="mode === 'system'" name="material-symbols:brightness-auto-outline" class="text-lg" />
    <Icon v-show="mode === 'light'" name="material-symbols:light-mode-outline" class="text-lg" />
    <Icon v-show="mode === 'dark'" name="material-symbols:dark-mode-outline" class="text-lg" />
  </button>
</template>
