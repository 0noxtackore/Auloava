<script setup>
// ============================================================
// EmptyState · Estado vacío mejorado
// Icono con anillo degradado y tarjeta de invitación.
// Slots: default (mensaje), action (botón de acción)
// ============================================================

defineProps({
  title: { type: String, default: 'Sin resultados' },
  message: { type: String, default: 'No hay datos para mostrar.' },
})
</script>

<template>
  <div class="empty" v-reveal>
    <div class="empty__rings" aria-hidden="true">
      <span class="empty__ring empty__ring--a" />
      <span class="empty__ring empty__ring--b" />
      <span class="empty__ring empty__ring--c" />
      <div class="empty__icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M3.3 7 12 12l8.7-5M12 22V12" />
        </svg>
      </div>
    </div>

    <h3 class="empty__title">{{ title }}</h3>
    <p class="empty__message">{{ message }}</p>

    <div v-if="$slots.action" class="empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
  gap: 10px;
  background: linear-gradient(180deg, var(--white) 0%, var(--green-50) 100%);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
}

.empty__rings {
  position: relative;
  width: 150px;
  height: 150px;
  margin-bottom: 10px;
}

.empty__ring {
  position: absolute;
  border-radius: 50%;
}

.empty__ring--a {
  inset: 0;
  background: var(--green-100);
  animation: float 6s ease-in-out infinite;
}

.empty__ring--b {
  inset: 14px;
  background: var(--green-200);
  animation: float 7s ease-in-out -2s infinite;
}

.empty__ring--c {
  inset: 28px;
  background: linear-gradient(135deg, var(--green-300), var(--green-400));
  animation: float 8s ease-in-out -4s infinite;
}

.empty__icon {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--green-800);
}

.empty__title {
  font-size: 1.2rem;
  color: var(--green-800);
}

.empty__message {
  color: var(--muted);
  max-width: 380px;
}

.empty__action {
  margin-top: 14px;
}
</style>