<script setup>
// ============================================================
// AppSidebar · Barra lateral estilo Pinterest
// Fondo blanco, logo rojo e ítems como píldoras.
// ============================================================
import { RouterLink } from 'vue-router'

const base = import.meta.env.BASE_URL

defineProps({
  open: { type: Boolean, default: false },
})

defineEmits(['close'])

const navItems = [
  { to: { name: 'dashboard' }, label: 'Dashboard', icon: 'dashboard' },
  { to: { name: 'products' }, label: 'Explorar', icon: 'box' },
  { to: { name: 'agent' }, label: 'Agente', icon: 'bot' },
  { to: { name: 'social' }, label: 'Redes', icon: 'share' },
]

// Iconos SVG inline por nombre
const icons = {
  dashboard:
    'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  box: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM12 22V12M3.3 7 12 12l8.7-5',
  bot: 'M12 8V4m0 0h-1m1 0h1M12 8a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4zM7 14h-2m15 0h-2M2 20h20',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  share:
    'M18 8a3 3 0 1 0-2.8-4H15a3 3 0 0 0 .2 1.1L8.9 8.7a3 3 0 1 0 0 6.6l6.3 3.6A3 3 0 1 0 18 16a3 3 0 0 0-2.1.9L9.6 13.3a3 3 0 0 0 0-2.6l6.3-3.6A3 3 0 0 0 18 8z',
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--open': open }">
    <RouterLink :to="{ name: 'landing' }" class="sidebar__brand" @click="$emit('close')">
      <img class="sidebar__logo-img" :src="`${base}images/logo.png`" alt="Auloava" />
    </RouterLink>

    <nav class="sidebar__nav" aria-label="Navegación principal">
      <p class="sidebar__section">Menú</p>
      <RouterLink
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        class="sidebar__link"
        active-class="sidebar__link--active"
        @click="$emit('close')"
      >
        <svg class="sidebar__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <path :d="icons[item.icon]" />
        </svg>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: 100vh;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background: var(--white);
  border-right: 1px solid var(--line);
  padding: 20px 16px;
  z-index: 950;
  flex-shrink: 0;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 22px;
}

.sidebar__logo-img {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.sidebar__section {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  padding: 8px 12px;
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: var(--radius-full);
  color: var(--ink);
  font-weight: 500;
  transition: background var(--transition), color var(--transition);
}

.sidebar__link:hover {
  background: var(--off-white);
}

.sidebar__link--active {
  background: var(--green-50);
  color: var(--green-600);
}

.sidebar__icon {
  flex-shrink: 0;
}

/* Móvil: sidebar fuera de pantalla */
@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sidebar--open {
    transform: translateX(0);
  }
}
</style>
