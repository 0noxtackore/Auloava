<script setup>
// ============================================================
// PublicHeader · Menubar compartido (landing + catálogo)
// Logo, navegación, buscador, "Iniciar sesión" y "Regístrese".
// En móvil todo se colapsa en un menú desplegable.
// ============================================================
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProductSuggestions } from '@/composables/useProductSuggestions'
import { decodeHtml } from '@/utils/formatters'
import { auth, logout } from '@/services/auth'
import { onAuthStateChanged } from 'firebase/auth'

const router = useRouter()
const base = import.meta.env.BASE_URL
const search = ref('')
const { suggestions: searchSuggestions } = useProductSuggestions(search, 6)
const searchOpen = ref(false)
const country = ref('')
const user = ref(null)
let unsubAuth = null

onMounted(() => {
  unsubAuth = onAuthStateChanged(auth, (u) => {
    user.value = u
  })
  detectLocation()
})
onUnmounted(() => {
  if (unsubAuth) unsubAuth()
})

const userInitial = () => {
  const u = user.value
  if (!u) return ''
  if (u.displayName) return u.displayName.trim().charAt(0).toUpperCase()
  return ((u.email || '?').trim().charAt(0) || '?').toUpperCase()
}

const userLabel = () => {
  const u = user.value
  if (!u) return ''
  return ((u.displayName || '').trim() || u.email || 'Mi cuenta').trim()
}

function goLogout() {
  logout()
}

function goRegister() {
  router.push({ name: 'register' })
}
function goSearch() {
  const q = search.value.trim()
  router.push({ name: 'catalog', query: q ? { q } : {} })
  searchOpen.value = false
}
function pickSuggestion(p) {
  search.value = p.title
  searchOpen.value = false
  router.push({ name: 'catalog', query: { q: p.title } })
}
function onSearchBlur() {
  setTimeout(() => {
    searchOpen.value = false
  }, 150)
}

async function detectLocation() {
  const setCountry = (name) => {
    if (name) country.value = name
  }
  const byIp = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/')
      const data = await res.json()
      setCountry(data.country_name)
    } catch {
      /* sin ubicación */
    }
  }
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`
          )
          const data = await res.json()
          setCountry(data.countryName)
        } catch {
          byIp()
        }
      },
      () => byIp(),
      { timeout: 8000 }
    )
  } else {
    byIp()
  }
}
</script>

<template>
  <header class="topbar">
    <nav class="container topbar__inner">
      <RouterLink class="topbar__brand" :to="{ name: 'landing' }">
        <img class="topbar__logo-img" :src="`${base}images/logo.png`" alt="Auloava" />
      </RouterLink>

      <div class="topbar__collapse">
        <form class="topbar__search" @submit.prevent="goSearch">
          <svg class="topbar__search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          <div class="topbar__search-box">
            <input
              v-model="search"
              type="search"
              placeholder="Buscar ofertas…"
              aria-label="Buscar ofertas"
              @focus="searchOpen = true"
              @blur="onSearchBlur"
            />
            <ul v-if="searchOpen && searchSuggestions.length" class="topbar__suggestions">
              <li
                v-for="p in searchSuggestions"
                :key="p.id"
                @mousedown.prevent="pickSuggestion(p)"
              >
                <span class="topbar__sugg-title">{{ decodeHtml(p.title) }}</span>
                <span class="topbar__sugg-cat">{{ p.category || 'Sin categoría' }}</span>
              </li>
            </ul>
          </div>
        </form>

        <div class="topbar__location" :title="country || 'Ubicación desconocida'">
          <svg
            class="topbar__location-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{{ country || '—' }}</span>
        </div>

        <template v-if="user">
          <div class="topbar__account" :title="user.email || ''">
            <RouterLink class="topbar__account-link" :to="{ name: 'profile' }">
              <span class="topbar__account-avatar">{{ userInitial() }}</span>
              <span class="topbar__account-mail">{{ userLabel() }}</span>
            </RouterLink>
            <button
              class="topbar__account-logout"
              type="button"
              aria-label="Cerrar sesión"
              @click="goLogout"
            >
              Salir
            </button>
          </div>
        </template>
        <template v-else>
          <div class="topbar__actions">
            <RouterLink class="topbar__login" :to="{ name: 'public-login' }">
              Iniciar sesión
            </RouterLink>
            <button class="topbar__cta" type="button" @click="goRegister">
              Regístrese
            </button>
          </div>
        </template>
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

/* ---- Fila de menubar (siempre visible) ---- */
.topbar__collapse {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  margin-left: 14px;
}

/* ---- Indicador de ubicación ---- */
.topbar__location {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  padding: 6px 10px;
  border-radius: var(--radius-full);
  background: var(--green-50);
  white-space: nowrap;
}
.topbar__location-icon {
  width: 18px;
  height: 18px;
  color: var(--green-600);
  stroke: var(--green-600);
  fill: none;
  flex-shrink: 0;
}
.topbar__location span {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--green-700);
}

/* ---- Buscador ---- */
.topbar__search {
  position: relative;
  flex: 1 1 360px;
  max-width: 560px;
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

/* Desplegable de sugerencias (estilo Google) */
.topbar__search-box {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
}
.topbar__suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 60;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  max-height: 320px;
  overflow-y: auto;
}
.topbar__suggestions li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background var(--transition);
}
.topbar__suggestions li:hover {
  background: var(--green-50);
}
.topbar__sugg-title {
  font-size: 0.9rem;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topbar__sugg-cat {
  font-size: 0.74rem;
  color: var(--muted);
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

/* ---- Cuenta (sesión iniciada) en esquina ---- */
.topbar__account {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
  margin-left: auto;
  padding: 4px 6px 4px 4px;
  border: 1.5px solid var(--green-200);
  border-radius: var(--radius-full);
  background: var(--green-50);
  max-width: 100%;
}
.topbar__account-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  text-decoration: none;
  transition: opacity var(--transition);
}
.topbar__account-link:hover {
  opacity: 0.85;
}
.topbar__account-avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: var(--white);
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
}
.topbar__account-mail {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--green-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
.topbar__account-logout {
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--green-700);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  padding: 6px 10px;
  transition: background var(--transition);
}
.topbar__account-logout:hover {
  background: var(--green-100);
}

/* ---- Móvil: contenido apilado uno debajo de otro ---- */
@media (max-width: 820px) {
  .topbar__inner {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    height: auto;
    padding: 12px 0;
  }
  .topbar__logo-img {
    height: 32px;
  }
  .topbar__collapse {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-left: 0;
  }
  .topbar__search {
    flex: 1 1 auto;
    min-width: 0;
    max-width: 100%;
  }
  .topbar__search input {
    padding: 9px 14px 9px 38px;
    font-size: 0.9rem;
  }
  .topbar__location {
    display: inline-flex;
    align-self: flex-start;
  }
  .topbar__actions {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    margin-left: 0;
    gap: 10px;
  }
  .topbar__login,
  .topbar__cta {
    width: 100%;
    padding: 11px 14px;
    font-size: 0.9rem;
  }
  .topbar__account {
    width: 100%;
    margin-left: 0;
    justify-content: space-between;
    padding: 6px 10px;
  }
  .topbar__account-link {
    flex: 1;
    min-width: 0;
  }
  .topbar__account-mail {
    max-width: none;
    flex: 1;
  }
}
</style>
