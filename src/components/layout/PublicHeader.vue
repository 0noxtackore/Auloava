<script setup>
// ============================================================
// PublicHeader · Menubar compartido (landing + catálogo)
// Logo, navegación, buscador, "Iniciar sesión" y "Regístrese".
// En móvil todo se colapsa en un menú desplegable.
// ============================================================
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const base = import.meta.env.BASE_URL
const search = ref('')
const open = ref(false)
const subOpen = ref(false)

function goSearch() {
  const q = search.value.trim()
  router.push({ name: 'catalog', query: q ? { q } : {} })
  open.value = false
}
function goRegister() {
  router.push({ name: 'register' })
  open.value = false
}
function closeMenu() {
  open.value = false
  subOpen.value = false
}
function toggleSub() {
  subOpen.value = !subOpen.value
}
</script>

<template>
  <header class="topbar">
    <nav class="container topbar__inner">
      <RouterLink class="topbar__brand" :to="{ name: 'landing' }">
        <img class="topbar__logo-img" :src="`${base}images/logo.png`" alt="Auloava" />
      </RouterLink>

      <button
        class="topbar__toggle"
        :class="{ 'is-active': open }"
        type="button"
        :aria-expanded="open"
        aria-label="Abrir menú"
        @click="open = !open"
      >
        <span></span><span></span><span></span>
      </button>

      <div class="topbar__collapse" :class="{ 'is-open': open }">
        <ul class="topbar__nav">
          <li class="topbar__has-sub">
            <button
              class="topbar__sub-toggle"
              type="button"
              :aria-expanded="subOpen"
              @click="toggleSub"
            >
              Más
            </button>
            <ul class="topbar__sub" :class="{ 'is-open': subOpen }">
              <li>
                <RouterLink :to="{ name: 'landing', hash: '#about' }" @click="closeMenu">
                  Quiénes somos
                </RouterLink>
              </li>
              <li>
                <RouterLink :to="{ name: 'landing', hash: '#how' }" @click="closeMenu">
                  Cómo funciona
                </RouterLink>
              </li>
              <li>
                <RouterLink :to="{ name: 'landing', hash: '#press' }" @click="closeMenu">
                  Prensa
                </RouterLink>
              </li>
            </ul>
          </li>
        </ul>

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

        <div class="topbar__actions">
          <RouterLink
            class="topbar__login"
            :to="{ name: 'admin-login' }"
            @click="closeMenu"
          >
            Iniciar sesión
          </RouterLink>
          <button class="topbar__cta" type="button" @click="goRegister">
            Regístrese
          </button>
        </div>
      </div>
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
  gap: 14px;
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

/* ---- Collapse (PC: fila; móvil: panel) ---- */
.topbar__collapse {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  margin-left: 14px;
}

/* ---- Navegación ---- */
.topbar__nav {
  display: flex;
  align-items: center;
  gap: 2px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.topbar__nav > li > a,
.topbar__sub-toggle {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border: none;
  background: none;
  border-radius: var(--radius-full);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--ink);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition), color var(--transition);
}
.topbar__nav > li > a:hover,
.topbar__sub-toggle:hover {
  background: var(--green-50);
  color: var(--green-700);
}

.topbar__has-sub {
  position: relative;
}
.topbar__sub {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 6px;
  min-width: 190px;
  padding: 8px;
  list-style: none;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow);
  z-index: 900;
}
.topbar__sub.is-open {
  display: block;
}
.topbar__sub li a {
  display: block;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--ink);
  font-size: 0.9rem;
  transition: background var(--transition), color var(--transition);
}
.topbar__sub li a:hover {
  background: var(--green-50);
  color: var(--green-700);
}

/* ---- Buscador ---- */
.topbar__search {
  position: relative;
  flex: 1;
  max-width: 320px;
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

/* ---- Acciones (login / registro) en esquina ---- */
.topbar__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 0 0 auto;
  margin-left: auto;
}
.topbar__login,
.topbar__cta {
  flex: 0 0 auto;
  width: 140px;
  text-align: center;
  padding: 10px 14px;
  border-radius: var(--radius-full);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition), border-color var(--transition),
    transform var(--transition), box-shadow var(--transition);
}
.topbar__login {
  border: 1.5px solid var(--green-200);
  background: var(--white);
  color: var(--green-700);
}
.topbar__login:hover {
  background: var(--green-50);
  border-color: var(--green-500);
  transform: translateY(-1px);
}
.topbar__cta {
  border: 1.5px solid transparent;
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: var(--white);
  box-shadow: var(--shadow-sm);
}
.topbar__cta:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

/* ---- Hamburguesa (oculta en PC) ---- */
.topbar__toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  padding: 0 10px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--white);
  cursor: pointer;
}
.topbar__toggle span {
  display: block;
  height: 2px;
  width: 100%;
  background: var(--ink);
  border-radius: 2px;
  transition: transform var(--transition), opacity var(--transition);
}
.topbar__toggle.is-active span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.topbar__toggle.is-active span:nth-child(2) {
  opacity: 0;
}
.topbar__toggle.is-active span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* ---- Móvil: colapsa en menú desplegable ---- */
@media (max-width: 820px) {
  .topbar__inner {
    position: relative;
  }
  .topbar__brand {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .topbar__toggle {
    display: inline-flex;
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 0;
  }
  .topbar__collapse {
    display: none;
    position: absolute;
    top: 66px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 20px;
    background: var(--white);
    border-bottom: 1px solid var(--line);
    box-shadow: var(--shadow);
  }
  .topbar__collapse.is-open {
    display: flex;
  }
  .topbar__nav {
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    width: 100%;
  }
  .topbar__nav > li > a,
  .topbar__sub-toggle {
    justify-content: space-between;
    width: 100%;
    padding: 12px 14px;
  }
  .topbar__sub {
    position: static;
    display: none;
    margin-top: 2px;
    padding-left: 12px;
    box-shadow: none;
    border: none;
  }
  .topbar__sub.is-open {
    display: block;
  }
  .topbar__search {
    max-width: 100%;
  }
  .topbar__actions {
    flex-direction: column;
    width: 100%;
    margin-left: 0;
  }
  .topbar__login,
  .topbar__cta {
    width: 100%;
  }
}
</style>
