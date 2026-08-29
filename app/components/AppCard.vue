<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'interactive', 'glass', 'gradient', 'sunken'].includes(v)
  },
  padding: {
    type: String,
    default: 'md',
    validator: (v) => ['none', 'sm', 'md', 'lg'].includes(v)
  },
  as: { type: String, default: 'div' }
});

const variantClasses = {
  default: 'card-base',
  interactive: 'card-interactive cursor-pointer',
  glass: 'card-glass',
  gradient: 'card-gradient',
  sunken: 'rounded-2xl border border-line bg-surface/70 shadow-inner'
};

const paddingClasses = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-7'
};
</script>

<template>
  <component
    :is="as"
    :class="[variantClasses[variant], paddingClasses[padding]]"
  >
    <slot />
  </component>
</template>
