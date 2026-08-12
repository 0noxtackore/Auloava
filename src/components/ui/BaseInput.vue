<script setup>
// ============================================================
// BaseInput · Campo de formulario reutilizable
// Usa v-model (defineModel) y muestra validación en línea.
// Slots: icon (izquierda), hint
// ============================================================
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  name: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  min: { type: [Number, String], default: undefined },
  max: { type: [Number, String], default: undefined },
  step: { type: [Number, String], default: undefined },
})

const emit = defineEmits(['update:modelValue'])

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const classes = computed(() => ({
  'input__field--error': props.error,
}))
</script>

<template>
  <div class="input">
    <label v-if="label" class="input__label" :for="name || label">
      {{ label }} <span v-if="required" class="input__required">*</span>
    </label>

    <div class="input__wrap">
      <span v-if="$slots.icon" class="input__icon"><slot name="icon" /></span>
      <input
        :id="name || label"
        :class="['input__field', classes]"
        :type="type"
        :value="value"
        :placeholder="placeholder"
        :name="name"
        :autocomplete="autocomplete"
        :required="required"
        :disabled="disabled"
        :min="min"
        :max="max"
        :step="step"
        @input="value = $event.target.value"
        @blur="$emit('blur')"
      />
    </div>

    <p v-if="error" class="input__error">{{ error }}</p>
    <p v-else-if="hint" class="input__hint"><slot name="hint">{{ hint }}</slot></p>
  </div>
</template>

<style scoped>
.input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input__label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--green-800);
}

.input__required {
  color: var(--danger);
}

.input__wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input__icon {
  position: absolute;
  left: 14px;
  display: inline-flex;
  color: var(--muted);
  pointer-events: none;
}

.input__field {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius);
  background: var(--white);
  color: var(--ink);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.input__field:focus {
  outline: none;
  border-color: var(--green-500);
  box-shadow: 0 0 0 4px var(--green-100);
}

.input__field:disabled {
  background: var(--green-50);
  cursor: not-allowed;
}

.input__field--error {
  border-color: var(--danger);
}
.input__field--error:focus {
  box-shadow: 0 0 0 4px var(--danger-soft);
}

.input__field--error ~ .input__icon {
  color: var(--danger);
}

.input__error {
  font-size: 0.82rem;
  color: var(--danger);
}

.input__hint {
  font-size: 0.82rem;
  color: var(--muted);
}
</style>
