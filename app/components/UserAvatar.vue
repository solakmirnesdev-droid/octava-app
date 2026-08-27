<script setup>
import { initials, avatarStyle } from '~/utils/avatar';

/**
 * A reader's portrait, or their initials when they have none.
 *
 * AI-NOTE: the same stand-in the artist pages use, deliberately. A review with
 * a grey circle beside it reads as a page that failed to load; initials in a
 * colour drawn from the name make the author recognisable at a glance and cost
 * nothing to serve. See AI-NOTES.md §4.
 */
const props = defineProps({
  name: { type: String, default: '' },
  userId: { type: String, default: '' },
  hasAvatar: { type: Boolean, default: false },
  size: { type: String, default: 'md' },   // sm · md · lg
  flag: { type: String, default: '' }
});

const config = useRuntimeConfig();

const SIZES = {
  sm: 'size-6 text-[9px]',
  md: 'size-8 text-[11px]',
  lg: 'size-20 text-2xl lg:size-24 lg:text-3xl'
};

const box = computed(() => SIZES[props.size] || SIZES.md);

// Only ask for the file when the account is known to have one; otherwise every
// initials circle would also fire a request that 404s.
const src = computed(() => (props.hasAvatar && props.userId
  ? `${config.public.apiBase}/users/${props.userId}/avatar`
  : null));
</script>

<template>
  <span class="relative inline-flex shrink-0">
    <img
      v-if="src" :src="src" :alt="name"
      class="shrink-0 rounded-full object-cover ring-1 ring-line" :class="box"
    >
    <span
      v-else
      :style="avatarStyle(name)"
      class="flex shrink-0 select-none items-center justify-center rounded-full font-semibold ring-1 ring-line"
      :class="box"
      aria-hidden="true"
    >{{ initials(name) }}</span>

    <!-- Sits on the portrait rather than beside it, so a row of authors stays
         one column wide however many of them have a country set. -->
    <span
      v-if="flag"
      class="pointer-events-none absolute -bottom-0.5 -right-0.5 leading-none"
      :class="size === 'lg' ? 'text-lg' : 'text-[10px]'"
      :title="flag"
    >{{ flag }}</span>
  </span>
</template>
