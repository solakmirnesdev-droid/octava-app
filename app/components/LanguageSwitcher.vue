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
    class="flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-body hover:bg-raised hover:text-accent"
    :hreflang="other.language"
    :title="other.name"
  >
    <Icon name="material-symbols:language" />
    <span class="font-mono text-xs uppercase">{{ other.code }}</span>
  </NuxtLink>
</template>
