<script setup>
// ============================================================
// PublicHeader · Menubar compartido (landing + catálogo)
// Logo, enlaces de sección, "Iniciar sesión" y CTA.
// ============================================================
import { useRouter } from 'vue-router'

const router = useRouter()
const base = import.meta.env.BASE_URL
</script>

<template>
  <header class="topbar">
    <nav class="container topbar__inner">
      <RouterLink class="topbar__brand" :to="{ name: 'landing' }">
        <img class="topbar__logo-img" :src="`${base}images/logo.png`" alt="Auloava" />
      </RouterLink>

      <div class="topbar__links">
        <a href="#featured">Explorar</a>
        <a href="#marketplaces">Marketplaces</a>
        <a href="#how">Cómo funciona</a>
      </div>

      <RouterLink class="topbar__login" :to="{ name: 'admin-login' }">
        Iniciar sesión
      </RouterLink>

      <button class="topbar__cta" @click="router.push({ name: 'catalog' })">
        Explorar ofertas
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

.topbar__links {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-left: 12px;
}

.topbar__links a {
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--ink);
  transition: color var(--transition);
}
.topbar__links a:hover {
  color: var(--green-600);
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

@media (max-width: 820px) {
  .topbar__links {
    display: none;
  }
}
@media (max-width: 480px) {
  .topbar__cta {
    padding: 9px 16px;
    font-size: 0.85rem;
  }
}
</style>
