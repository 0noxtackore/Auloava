<script setup>
// ============================================================
// BaseButton · Botón reutilizable
// Variantes: primary | secondary | outline | ghost | danger
// Tamaños:   sm | md | lg
// Soporta estado de carga con spinner.
// ============================================================
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | outline | ghost | danger
  size: { type: String, default: 'md' }, // sm | md | lg
  type: { type: String, default: 'button' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false }, // ocupa todo el ancho
})

const emit = defineEmits(['click'])

const classes = computed(() => [
  'btn',
  `btn--${props.variant}`,
  `btn--${props.size}`,
  { 'btn--block': props.block, 'is-loading': props.loading },
])

function handleClick(event) {
  if (props.loading || props.disabled) return
  emit('click', event)
}
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true" />
    <span v-else-if="$slots.icon" class="btn__icon"><slot name="icon" /></span>
    <span class="btn__label"><slot /></span>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  border-radius: var(--radius-full);
  transition: transform var(--transition), box-shadow var(--transition),
    background-color var(--transition), color var(--transition),
    border-color var(--transition);
  white-space: nowrap;
  user-select: none;
}

.btn:active:not(:disabled) {
  transform: scale(0.97);
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Tamaños */
.btn--sm { padding: 8px 14px; font-size: 0.85rem; }
.btn--md { padding: 12px 22px; font-size: 0.95rem; }
.btn--lg { padding: 15px 30px; font-size: 1.05rem; }

.btn--block { width: 100%; }

/* Variante primary (degradado verde) */
.btn--primary {
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: var(--white);
  box-shadow: var(--shadow-sm);
}
.btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--green-700), var(--green-600));
  box-shadow: var(--shadow);
  transform: translateY(-1px);
}

/* Variante secondary */
.btn--secondary {
  background: var(--green-100);
  color: var(--green-700);
}
.btn--secondary:hover:not(:disabled) {
  background: var(--green-200);
}

/* Variante outline */
.btn--outline {
  background: transparent;
  color: var(--green-600);
  border: 1.5px solid var(--green-300);
}
.btn--outline:hover:not(:disabled) {
  border-color: var(--green-600);
  background: var(--green-50);
}

/* Variante ghost */
.btn--ghost {
  background: transparent;
  color: var(--green-600);
}
.btn--ghost:hover:not(:disabled) {
  background: var(--green-50);
}

/* Variante danger */
.btn--danger {
  background: var(--danger);
  color: var(--white);
}
.btn--danger:hover:not(:disabled) {
  background: #a93226;
}

/* Spinner de carga */
.btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.btn__icon {
  display: inline-flex;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
