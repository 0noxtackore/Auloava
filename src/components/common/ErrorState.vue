<script setup>
// ============================================================
// ErrorState · Estado de error con botón de reintento
// ============================================================

defineProps({
  message: { type: String, default: 'Algo salió mal al cargar los datos.' },
})

defineEmits(['retry'])
</script>

<template>
  <div class="error" v-reveal>
    <div class="error__icon" aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    </div>
    <h3 class="error__title">Ups, ocurrió un error</h3>
    <p class="error__message">{{ message }}</p>
    <button class="error__retry" @click="$emit('retry')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
      </svg>
      Reintentar
    </button>
  </div>
</template>

<style scoped>
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
  gap: 8px;
}

.error__icon {
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: var(--danger-soft);
  color: var(--danger);
  margin-bottom: 8px;
}

.error__title {
  font-size: 1.1rem;
  color: var(--green-800);
}

.error__message {
  color: var(--muted);
  max-width: 400px;
}

.error__retry {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-full);
  background: var(--green-600);
  color: var(--white);
  font-weight: 600;
  transition: background var(--transition);
}
.error__retry:hover {
  background: var(--green-700);
}
</style>
