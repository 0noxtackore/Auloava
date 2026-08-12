<script setup>
// ============================================================
// BaseLoader · Spinner / estado de carga
// full = pantalla completa (overlay), size = sm | md | lg
// ============================================================

defineProps({
  size: { type: String, default: 'md' }, // sm | md | lg
  full: { type: Boolean, default: false },
  label: { type: String, default: '' },
})
</script>

<template>
  <div v-if="full" class="loader-overlay" role="status" aria-live="polite">
    <div class="loader" :class="`loader--${size}`">
      <span class="loader__ring" />
      <span v-if="label" class="loader__label">{{ label }}</span>
    </div>
  </div>

  <div v-else class="loader" :class="`loader--${size}`" role="status" aria-live="polite">
    <span class="loader__ring" />
    <span v-if="label" class="loader__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.loader-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  place-items: center;
  background: rgba(247, 250, 247, 0.75);
  backdrop-filter: blur(2px);
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loader__ring {
  border-radius: 50%;
  border: 3px solid var(--green-200);
  border-top-color: var(--green-600);
  animation: spin 0.8s linear infinite;
}

.loader--sm .loader__ring { width: 22px; height: 22px; }
.loader--md .loader__ring { width: 40px; height: 40px; }
.loader--lg .loader__ring { width: 64px; height: 64px; }

.loader__label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--muted);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
