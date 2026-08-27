<script setup>
const { mode, cycle } = useTheme();
const { t } = useI18n();

const label = computed(() => t('theme.switch', { mode: t(`theme.${mode.value}`) }));
</script>

<template>
  <button
    type="button"
    class="flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-body hover:bg-raised hover:text-accent"
    :title="label"
    :aria-label="label"
    @click="cycle"
  >
    <!-- AI-TRAP: the three names are literals toggled with v-show, never one
         bound expression. @nuxt/icon builds its client bundle by scanning source
         for literal names, so a computed name renders a correctly sized SVG with
         no paths in it — a blank button that reads as a styling bug. -->
    <Icon v-show="mode === 'system'" name="material-symbols:brightness-auto-outline" />
    <Icon v-show="mode === 'light'" name="material-symbols:light-mode-outline" />
    <Icon v-show="mode === 'dark'" name="material-symbols:dark-mode-outline" />
  </button>
</template>
