<script setup>
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  id: { type: String, default: null },
  type: { type: String, default: 'text' },
  label: { type: String, default: null },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  autocomplete: { type: String, default: null },
  inputmode: { type: String, default: null },
  autofocus: { type: Boolean, default: false },
  maxlength: { type: [Number, String], default: null },
  icon: { type: String, default: null },
  error: { type: String, default: null },
  help: { type: String, default: null }
});

const emit = defineEmits(['update:modelValue']);

function onInput(e) {
  emit('update:modelValue', e.target.value);
}
</script>

<template>
  <div class="space-y-1.5 w-full">
    <label
      v-if="label"
      :for="id"
      class="text-xs font-bold uppercase tracking-wider text-ink block"
    >
      {{ label }}
      <span v-if="required" class="text-accent ml-0.5">*</span>
    </label>

    <div class="relative w-full">
      <Icon
        v-if="icon"
        :name="icon"
        class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-muted"
      />
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :autofocus="autofocus"
        :maxlength="maxlength"
        class="input-base"
        :class="[
          icon && 'pl-10',
          error && '!border-danger focus:!border-danger focus:!ring-danger/15'
        ]"
        @input="onInput"
      >
    </div>

    <p v-if="error" class="text-xs text-danger font-medium mt-1">
      {{ error }}
    </p>
    <p v-else-if="help" class="text-xs text-muted mt-1">
      {{ help }}
    </p>
  </div>
</template>
