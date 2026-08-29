<script setup>
const props = defineProps({
  to: { type: [String, Object], default: null },
  href: { type: String, default: null },
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'danger'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg'].includes(v)
  },
  icon: { type: String, default: null },
  iconRight: { type: String, default: null },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  type: { type: String, default: 'button' }
});

const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger'
};

const sizeClasses = {
  xs: 'px-2.5 py-1 text-[11px] rounded-lg gap-1',
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2',
  lg: 'px-5 py-3 text-sm sm:text-base rounded-2xl gap-2.5 font-bold'
};

const iconSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :class="[
      variantClasses[variant],
      sizeClasses[size],
      block && 'w-full justify-center',
      (disabled || loading) && 'pointer-events-none opacity-50'
    ]"
    :aria-disabled="disabled || loading"
  >
    <Icon v-if="loading" name="svg-spinners:ring-resize" :class="iconSizes[size]" />
    <slot v-else-if="$slots.icon || icon" name="icon">
      <Icon :name="icon" :class="iconSizes[size]" />
    </slot>

    <slot />

    <slot v-if="$slots.iconRight || iconRight" name="iconRight">
      <Icon :name="iconRight" :class="iconSizes[size]" />
    </slot>
  </NuxtLink>

  <a
    v-else-if="href"
    :href="href"
    :class="[
      variantClasses[variant],
      sizeClasses[size],
      block && 'w-full justify-center',
      (disabled || loading) && 'pointer-events-none opacity-50'
    ]"
    :aria-disabled="disabled || loading"
  >
    <Icon v-if="loading" name="svg-spinners:ring-resize" :class="iconSizes[size]" />
    <slot v-else-if="$slots.icon || icon" name="icon">
      <Icon :name="icon" :class="iconSizes[size]" />
    </slot>

    <slot />

    <slot v-if="$slots.iconRight || iconRight" name="iconRight">
      <Icon :name="iconRight" :class="iconSizes[size]" />
    </slot>
  </a>

  <button
    v-else
    :type="type"
    :disabled="disabled || loading"
    :class="[
      variantClasses[variant],
      sizeClasses[size],
      block && 'w-full justify-center'
    ]"
  >
    <Icon v-if="loading" name="svg-spinners:ring-resize" :class="iconSizes[size]" />
    <slot v-else-if="$slots.icon || icon" name="icon">
      <Icon :name="icon" :class="iconSizes[size]" />
    </slot>

    <slot />

    <slot v-if="$slots.iconRight || iconRight" name="iconRight">
      <Icon :name="iconRight" :class="iconSizes[size]" />
    </slot>
  </button>
</template>
