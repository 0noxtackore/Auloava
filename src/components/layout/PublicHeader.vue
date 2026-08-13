<script setup>
// ============================================================
// PublicHeader · Menubar compartido (landing + catálogo)
// Logo, enlaces de sección, "Iniciar sesión" y CTA.
// ============================================================
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const base = import.meta.env.BASE_URL
const search = ref('')

function goSearch() {
  const q = search.value.trim()
  router.push({ name: 'catalog', query: q ? { q } : {} })
}
</script>

<template>
  <header class="topbar">
    <nav class="container topbar__inner">
      <RouterLink class="topbar__brand" :to="{ name: 'landing' }">
        <img class="topbar__logo-img" :src="`${base}images/logo.png`" alt="Auloava" />
      </RouterLink>

      <form class="topbar__search" @submit.prevent="goSearch">
        <svg class="topbar__search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
        <input
          v-model="search"
          type="search"
          placeholder="Buscar ofertas…"
          aria-label="Buscar ofertas"
        />
      </form>

      <RouterLink class="topbar__login" :to="{ name: 'admin-login' }">
        Iniciar sesión
      </RouterLink>

      <button class="topbar__cta" @click="router.push({ name: 'register' })">
        Regístrese
      </button>
    </nav>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 800;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}

.topbar__inner {
  display: flex;
  align-items: center;
  gap: 18px;
  height: 66px;
}

.topbar__brand {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.topbar__logo-img {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.topbar__search {
  position: relative;
  flex: 1;
  max-width: 420px;
  margin-left: 12px;
}
.topbar__search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--muted);
  stroke-width: 2;
  stroke-linecap: round;
  pointer-events: none;
}
.topbar__search input {
  width: 100%;
  padding: 9px 18px 9px 40px;
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--off-white);
  font-size: 0.92rem;
  transition: border-color var(--transition), background var(--transition);
}
.topbar__search input:focus {
  outline: none;
  border-color: var(--green-500);
  background: var(--white);
}

.topbar__login {
  margin-left: auto;
  padding: 10px 20px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--green-200);
  background: var(--white);
  color: var(--green-700);
  font-size: 0.92rem;
  font-weight: 600;
  transition: background var(--transition), border-color var(--transition),
    transform var(--transition);
}
.topbar__login:hover {
  background: var(--green-50);
  border-color: var(--green-500);
  transform: translateY(-1px);
}

.topbar__cta {
  margin-left: 0;
  padding: 10px 22px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: var(--white);
  font-size: 0.92rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition);
}
.topbar__cta:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

@media (max-width: 560px) {
  .topbar__search {
    display: none;
  }
  .topbar__login {
    padding: 8px 14px;
    font-size: 0.82rem;
  }
  .topbar__cta {
    padding: 8px 14px;
    font-size: 0.82rem;
  }
}
@media (max-width: 480px) {
  .topbar__cta {
    padding: 9px 16px;
    font-size: 0.85rem;
  }
}
</style>
