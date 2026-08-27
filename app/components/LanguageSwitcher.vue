<script setup>
const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const other = computed(() => locales.value.find((l) => l.code !== locale.value));
</script>

<template>
  <!-- A real link, not a button that swaps state: the two versions are separate
       URLs, and a crawler following this is how it finds the other one. -->
  <NuxtLink
    v-if="other"
    :to="switchLocalePath(other.code)"
    class="flex h-8.5 shrink-0 items-center gap-1.5 rounded-xl border border-transparent px-2.5 text-xs font-semibold text-muted outline-none transition-all duration-150 hover:border-line hover:bg-panel hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40"
    :hreflang="other.language"
    :title="other.name"
  >
    <Icon name="material-symbols:language" class="text-base" />
    <span class="font-mono text-xs uppercase">{{ other.code }}</span>
  </NuxtLink>
</template>
