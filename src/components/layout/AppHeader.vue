<script setup>
// ============================================================
// AppHeader · Barra superior del área principal
// Incluye: menú hamburguesa (móvil), búsqueda, notificaciones
// y enlace de vuelta a la página pública.
// ============================================================
defineEmits(['toggle-sidebar'])
</script>

<template>
  <header class="header">
    <div class="header__left">
      <button
        class="header__burger"
        aria-label="Abrir menú"
        @click="$emit('toggle-sidebar')"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
      </button>

      <div class="header__search">
        <svg class="header__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input type="search" placeholder="Buscar productos..." aria-label="Buscar" />
      </div>
    </div>

    <div class="header__right">
      <button class="header__bell" aria-label="Notificaciones">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
        <span class="header__dot" />
      </button>

      <RouterLink :to="{ name: 'landing' }" class="header__home">
        Ver página
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 800;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: var(--header-height);
  padding: 0 32px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}

.header__left,
.header__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header__burger {
  display: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius);
  color: var(--green-700);
  transition: background var(--transition);
}
.header__burger:hover {
  background: var(--green-100);
}

.header__search {
  position: relative;
  display: flex;
  align-items: center;
}

.header__search-icon {
  position: absolute;
  left: 14px;
  color: var(--muted);
}

.header__search input {
  width: 260px;
  padding: 10px 16px 10px 42px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--off-white);
  font-size: 0.9rem;
  transition: border-color var(--transition), box-shadow var(--transition), width var(--transition);
}
.header__search input:focus {
  outline: none;
  border-color: var(--green-500);
  box-shadow: 0 0 0 4px var(--green-100);
  width: 320px;
  background: var(--white);
}

.header__bell {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--green-700);
  background: var(--green-50);
  transition: background var(--transition);
}
.header__bell:hover {
  background: var(--green-100);
}

.header__dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger);
  animation: pulse-dot 2s infinite;
}

.header__home {
  padding: 10px 20px;
  border-radius: var(--radius-full);
  background: var(--green-600);
  color: var(--white);
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  transition: background var(--transition), transform var(--transition);
}
.header__home:hover {
  background: var(--green-700);
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .header {
    padding: 0 20px;
  }
  .header__burger {
    display: grid;
  }
  .header__search {
    display: none;
  }
}
</style>
