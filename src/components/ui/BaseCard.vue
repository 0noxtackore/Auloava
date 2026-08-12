<script setup>
// ============================================================
// BaseCard · Tarjeta contenedora reutilizable
// Slots: header (o title + actions), default, footer
// ============================================================

defineProps({
  hoverable: { type: Boolean, default: false },
  padded: { type: Boolean, default: true },
  title: { type: String, default: '' },
})
</script>

<template>
  <article class="card" :class="{ 'card--hover': hoverable, 'card--flush': !padded }">
    <header v-if="title || $slots.header || $slots.actions" class="card__header">
      <div class="card__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="$slots.actions" class="card__actions">
        <slot name="actions" />
      </div>
      <slot name="header" />
    </header>

    <div class="card__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>

<style scoped>
.card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card--hover {
  transition: transform var(--transition), box-shadow var(--transition);
}
.card--hover:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}

.card--flush .card__body {
  padding: 0;
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
}

.card__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--green-800);
}

.card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card__body {
  padding: 24px;
}

.card__footer {
  padding: 16px 24px;
  border-top: 1px solid var(--line);
  background: var(--green-50);
}
</style>
