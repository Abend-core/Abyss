<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label:      { type: String, default: '' },
  placeholder:{ type: String, default: '' },
  min:        { type: Number, default: 0 },
  max:        { type: Number, default: 999999 },
  step:       { type: Number, default: 1 },
  error:      { type: String, default: '' },
  hint:       { type: String, default: '' },
  disabled:   { type: Boolean, default: false },
  required:   { type: Boolean, default: false },
  id:         { type: String, default: () => `stepper-${Math.random().toString(36).slice(2,7)}` },
})

const emit = defineEmits(['update:modelValue'])

const numericValue = computed({
  get: () => {
    const val = parseFloat(props.modelValue) || 0
    return Math.max(props.min, Math.min(props.max, val))
  },
  set: (value) => {
    emit('update:modelValue', value.toString())
  }
})

function increment() {
  if (props.disabled) return
  const newValue = Math.min(props.max, numericValue.value + props.step)
  // Arrondir à 2 décimales pour éviter les erreurs de précision
  const rounded = Math.round(newValue * 100) / 100
  emit('update:modelValue', rounded.toFixed(2))
}

function decrement() {
  if (props.disabled) return
  const newValue = Math.max(props.min, numericValue.value - props.step)
  // Arrondir à 2 décimales pour éviter les erreurs de précision
  const rounded = Math.round(newValue * 100) / 100
  emit('update:modelValue', rounded.toFixed(2))
}

function handleInput(event) {
  const value = event.target.value
  // Allow empty string for clearing
  if (value === '') {
    emit('update:modelValue', '')
    return
  }

  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    const clampedValue = Math.max(props.min, Math.min(props.max, numValue))
    emit('update:modelValue', clampedValue.toString())
  }
}
</script>

<template>
  <div class="stepper-field" :class="{ 'stepper-field--error': error, 'stepper-field--disabled': disabled }">
    <label v-if="label" :for="id" class="stepper-field__label">
      {{ label }}
      <span v-if="required" class="stepper-field__required" aria-hidden="true">*</span>
    </label>

    <div class="stepper-field__input-wrap">
      <button
        type="button"
        class="stepper-field__btn stepper-field__btn--decrement"
        :disabled="disabled || numericValue <= min"
        @click="decrement"
        aria-label="Diminuer"
      >
        −
      </button>

      <input
        :id="id"
        type="number"
        :value="modelValue"
        :placeholder="placeholder"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :required="required"
        :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
        :aria-invalid="!!error"
        class="stepper-field__input"
        @input="handleInput"
      />

      <button
        type="button"
        class="stepper-field__btn stepper-field__btn--increment"
        :disabled="disabled || numericValue >= max"
        @click="increment"
        aria-label="Augmenter"
      >
        +
      </button>
    </div>

    <div v-if="hint && !error" :id="`${id}-hint`" class="stepper-field__hint">
      {{ hint }}
    </div>

    <div v-if="error" :id="`${id}-error`" class="stepper-field__error" role="alert">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.stepper-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stepper-field--error .stepper-field__input-wrap {
  border-color: var(--color-error);
}

.stepper-field--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.stepper-field__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.stepper-field__required {
  color: var(--color-error) !important;
}

.stepper-field__input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  overflow: hidden;
}

.stepper-field__input-wrap:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.stepper-field__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-bg-surface);
  border: none;
  color: var(--color-text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.stepper-field__btn:hover:not(:disabled) {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.stepper-field__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stepper-field__btn--decrement {
  border-right: 1px solid var(--color-border);
}

.stepper-field__btn--increment {
  border-left: 1px solid var(--color-border);
}

.stepper-field__input {
  flex: 1;
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  text-align: center;
  min-width: 0;
}

.stepper-field__input:focus {
  outline: none;
}

.stepper-field__input::-webkit-outer-spin-button,
.stepper-field__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.stepper-field__input[type=number] {
  -moz-appearance: textfield;
}

.stepper-field__hint {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.stepper-field__error {
  font-size: 0.75rem;
  color: var(--color-error);
}
</style>