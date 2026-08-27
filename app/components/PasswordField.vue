<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
  id: { type: String, required: true },
  label: { type: String, default: 'Lozinka' },
  autocomplete: { type: String, default: 'current-password' },
  minlength: { type: Number, default: 0 },
  showStrength: { type: Boolean, default: false }
});
defineEmits(['update:modelValue']);

const revealed = ref(false);

/**
 * Length dominates real password strength far more than character variety, so
 * it is weighted accordingly. This is a hint for the person typing, never a
 * gate — the server decides what it accepts.
 */
const strength = computed(() => {
  const value = props.modelValue;
  if (!value) return null;

  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (value.length >= 16) score++;
  if (/[^a-zA-Z0-9]/.test(value) || (/[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value))) score++;

  if (score <= 1) return { label: 'slaba', width: '33%', tone: 'bg-danger-soft' };
  if (score === 2) return { label: 'osrednja', width: '66%', tone: 'bg-warn-soft' };
  return { label: 'jaka', width: '100%', tone: 'bg-ok-soft' };
});
</script>

<template>
  <div>
    <div class="mb-1 flex items-baseline justify-between">
      <label :for="id" class="text-sm font-medium">{{ label }}</label>
      <button
        type="button"
        class="text-xs text-faint hover:text-accent"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        {{ revealed ? 'Sakrij' : 'Prikaži' }}
      </button>
    </div>

    <input
      :id="id"
      :type="revealed ? 'text' : 'password'"
      :value="modelValue"
      :autocomplete="autocomplete"
      :minlength="minlength || undefined"
      required
      class="w-full rounded border border-line-strong bg-panel px-3 py-2 outline-none focus:border-accent"
      @input="$emit('update:modelValue', $event.target.value)"
    />

    <div v-if="showStrength && strength" class="mt-1.5 flex items-center gap-2">
      <div class="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
        <div class="h-full rounded-full transition-all" :class="strength.tone" :style="{ width: strength.width }" />
      </div>
      <span class="text-xs text-faint">{{ strength.label }}</span>
    </div>
  </div>
</template>
