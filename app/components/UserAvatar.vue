<script setup>
const props = defineProps({
  name: { type: String, default: '' },
  userId: { type: String, default: '' },
  hasAvatar: { type: Boolean, default: false },
  size: { type: String, default: 'md' }, // sm · md · lg
  flag: { type: String, default: '' }
});

const config = useRuntimeConfig();

const SIZES = {
  sm: 'size-6 text-sm',
  md: 'size-8 text-base',
  lg: 'size-20 text-3xl lg:size-24 lg:text-4xl'
};

const box = computed(() => SIZES[props.size] || SIZES.md);

// Only ask for the file when the account is known to have one
const src = computed(() => (props.hasAvatar && props.userId
  ? `${config.public.apiBase}/users/${props.userId}/avatar`
  : null));
</script>

<template>
  <span class="relative inline-flex shrink-0 items-center justify-center">
    <img
      v-if="src" :src="src" :alt="name"
      class="shrink-0 rounded-full object-cover ring-1 ring-line shadow-2xs" :class="box"
    >
    <span
      v-else
      class="flex shrink-0 select-none items-center justify-center rounded-full border border-line bg-surface/90 text-muted shadow-2xs transition-colors hover:border-accent hover:text-accent hover:bg-raised"
      :class="box"
      aria-hidden="true"
    >
      <Icon name="material-symbols:person-rounded" />
    </span>

    <span
      v-if="flag"
      class="pointer-events-none absolute -bottom-0.5 -right-0.5 leading-none select-none"
      :class="size === 'lg' ? 'text-lg' : 'text-[10px]'"
      :title="flag"
    >{{ flag }}</span>
  </span>
</template>
