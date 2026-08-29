<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'neutral',
    validator: (v) => ['neutral', 'accent', 'ok', 'warn', 'danger'].includes(v)
  },
  size: {
    type: String,
    default: 'sm',
    validator: (v) => ['xs', 'sm', 'md'].includes(v)
  },
  dot: { type: Boolean, default: false },
  pulse: { type: Boolean, default: false },
  icon: { type: String, default: null }
});

const variantClasses = {
  neutral: 'badge-pill',
  accent: 'badge-accent',
  ok: 'badge-ok',
  warn: 'badge-warn',
  danger: 'badge-danger'
};

const dotColors = {
  neutral: 'bg-muted/70',
  accent: 'bg-accent',
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger'
};

const sizeClasses = {
  xs: 'px-2 py-0.5 text-[10px]',
  sm: 'px-2.5 py-0.5 text-[11px]',
  md: 'px-3 py-1 text-xs'
};
</script>

<template>
  <span :class="[variantClasses[variant], sizeClasses[size]]">
    <span
      v-if="dot"
      class="size-1.5 shrink-0 rounded-full"
      :class="[dotColors[variant], pulse && 'animate-pulse']"
      aria-hidden="true"
    />
    <slot v-else-if="$slots.icon || icon" name="icon">
      <Icon :name="icon" class="text-xs shrink-0" />
    </slot>

    <slot />
  </span>
</template>
