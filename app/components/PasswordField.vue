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
    <label :for="id" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
      {{ label }}
    </label>

    <div class="relative">
      <input
        :id="id"
        :type="revealed ? 'text' : 'password'"
        :value="modelValue"
        :autocomplete="autocomplete"
        :minlength="minlength || undefined"
        required
        class="input-base pr-10"
        @input="$emit('update:modelValue', $event.target.value)"
      />

      <button
        type="button"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-lg text-faint hover:text-accent hover:bg-surface/60 transition-colors cursor-pointer"
        :aria-pressed="revealed"
        :aria-label="revealed ? 'Sakrij lozinku' : 'Prikaži lozinku'"
        :title="revealed ? 'Sakrij lozinku' : 'Prikaži lozinku'"
        @click="revealed = !revealed"
      >
        <Icon
          :name="revealed ? 'material-symbols:visibility-off-outline-rounded' : 'material-symbols:visibility-outline-rounded'"
          class="text-lg"
        />
      </button>
    </div>

    <div v-if="showStrength && strength" class="mt-1.5 flex items-center gap-2">
      <div class="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
        <div class="h-full rounded-full transition-all" :class="strength.tone" :style="{ width: strength.width }" />
      </div>
      <span class="text-xs text-faint">{{ strength.label }}</span>
    </div>
  </div>
</template>
