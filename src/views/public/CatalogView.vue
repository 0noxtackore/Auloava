<script setup>
// ============================================================
// CatalogView · Catálogo de ofertas (estilo Pinterest)
// Reservado a usuarios con sesión: se muestra todo el catálogo
// en orden aleatorio y sin paginación. Sin sesión se ve la
// pantalla de acceso.
// ============================================================
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '@/store/products'
import { auth, authReady } from '@/services/auth'
import ProductCard from '@/components/product/ProductCard.vue'
import EarningsMeter from '@/components/layout/EarningsMeter.vue'
import PublicHeader from '@/components/layout/PublicHeader.vue'

const productStore = useProductStore()
const route = useRoute()
const router = useRouter()
const query = ref(String(route.query.q || ''))
const categoryFilter = ref(String(route.query.category || ''))

const randomOrder = ref([])
const isGuest = ref(true)

function goLogin() {
  router.push({ name: 'public-login', query: { redirect: route.fullPath } })
}
function goRegister() {
  router.push({ name: 'register', query: { redirect: route.fullPath } })
}

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

onMounted(async () => {
  await authReady
  isGuest.value = !auth.currentUser

  // Re-baraja cada vez que el store cambia la lista (carga inicial o refresco).
  watch(
    () => productStore.products.length,
    () => {
      randomOrder.value = shuffle(productStore.products)
    },
  )
  if (!productStore.products.length) productStore.fetchProducts().catch(() => {})
  randomOrder.value = shuffle(productStore.products)
})

// Nichos (categorías) disponibles en la plataforma.
const platformNiches = computed(() => {
  const set = new Set()
  randomOrder.value.forEach((p) => set.add((p.category || '').trim()))
  return ['Todos', ...[...set].sort()]
})

function selectNiche(niche) {
  const q = { ...route.query }
  if (niche && niche !== 'Todos') {
    q.category = niche
  } else {
    delete q.category
  }
  router.replace({ query: q })
  categoryFilter.value = niche && niche !== 'Todos' ? niche : ''
}

// Productos visibles: solo para usuarios con sesión, con el orden
// aleatorio fijado al montar la vista ("salida" muy scrolleable).
const products = computed(() => {
  if (isGuest.value) return []
  const q = query.value.trim().toLowerCase()
  let list = randomOrder.value

  if (categoryFilter.value) {
    const c = categoryFilter.value.toLowerCase()
    list = list.filter((p) => (p.category || '').toLowerCase() === c)
  }

  if (!q) return list
  return list.filter(
    (p) =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q),
  )
})
</script>

<template>
  <div class="catalog-page">
    <PublicHeader />

    <main class="container catalog-main">
      <div v-if="isGuest" class="catalog-gate">
        <span class="catalog-gate__icon">🔒</span>
        <h1 class="catalog-gate__title">El catálogo solo para ti</h1>
        <p class="catalog-gate__lead">
          Entra con tu cuenta para explorar todas las ofertas comparadas en
          AliExpress, Amazon y Alibaba, en un solo lugar y en orden aleatorio.
        </p>
        <div class="catalog-gate__actions">
          <button type="button" class="catalog-gate__btn" @click="goLogin">
            Iniciar sesión
          </button>
          <button type="button" class="catalog-gate__btn catalog-gate__btn--ghost" @click="goRegister">
            Crear cuenta gratis
          </button>
        </div>
      </div>

      <template v-else>
        <div class="catalog-niches">
          <span class="catalog-niches__label">Nicho</span>
          <div class="catalog-niches__list">
            <button
              v-for="niche in platformNiches"
              :key="niche"
              type="button"
              class="catalog-niches__chip"
              :class="{ 'is-active': niche === 'Todos' ? !categoryFilter : categoryFilter === niche }"
              @click="selectNiche(niche)"
            >
              {{ niche }}
            </button>
          </div>
        </div>
        <form class="catalog-search" @submit.prevent>
          <input
            v-model="query"
            type="search"
            placeholder="Busca ofertas en AliExpress, Amazon y Alibaba…"
            aria-label="Buscar ofertas"
          />
        </form>

        <div v-if="products.length" class="pin-grid">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>
        <p v-else class="catalog-empty">
          No encontramos ofertas para “{{ query }}”.
        </p>

        <EarningsMeter />
      </template>
    </main>
  </div>
</template>

<style scoped>
.catalog-page {
  min-height: 100vh;
  background: var(--white);
}

.catalog-search {
  width: min(560px, 100%);
  margin: 0 auto 28px;
}
@media (min-width: 561px) {
  .catalog-search {
    display: none;
  }
}
.catalog-search input {
  width: 100%;
  padding: 10px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--off-white);
  font-size: 0.95rem;
  transition: border-color var(--transition), background var(--transition);
}
.catalog-search input:focus {
  outline: none;
  border-color: var(--green-500);
  background: var(--white);
}

.catalog-main {
  padding: 48px 0 80px;
}

@media (max-width: 768px) {
  .catalog-main {
    padding: 40px 0 64px;
  }
}

@media (max-width: 560px) {
  .catalog-search input {
    padding: 9px 14px;
    font-size: 16px;
  }
  .catalog-main {
    padding: 28px 0 48px;
  }
}

@media (max-width: 380px) {
  .catalog-main {
    padding: 22px 0 40px;
  }
}

.catalog-empty {
  text-align: center;
  color: var(--muted);
  padding: 60px 0;
  font-size: 1.05rem;
}

/* ---- Filtro de nichos (categorías de la plataforma) ---- */
.catalog-niches {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 30px;
}
.catalog-niches__label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  flex-shrink: 0;
}
.catalog-niches__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow: hidden;
}
.catalog-niches__list::-webkit-scrollbar {
  display: none;
}
@media (max-width: 760px) {
  .catalog-niches {
    margin: 0 0 18px;
  }
  .catalog-niches__list {
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }
}
.catalog-niches__chip {
  padding: 8px 16px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--white);
  color: var(--ink);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color var(--transition), background var(--transition),
    color var(--transition), transform var(--transition);
}
.catalog-niches__chip:hover {
  border-color: var(--green-500);
  background: var(--green-50);
  transform: translateY(-1px);
}
.catalog-niches__chip.is-active {
  border-color: var(--green-600);
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: var(--white);
  box-shadow: var(--shadow-sm);
}

/* ---- Pantalla de acceso para visitantes sin sesión ---- */
.catalog-gate {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 18px;
  max-width: 520px;
  margin: 0 auto;
  padding: 72px 24px;
}
.catalog-gate__icon {
  font-size: 3rem;
  line-height: 1;
}
.catalog-gate__title {
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 3.4vw, 2.3rem);
  letter-spacing: -0.02em;
  color: var(--ink);
}
.catalog-gate__lead {
  color: var(--muted);
  font-size: 1.02rem;
  line-height: 1.6;
  max-width: 440px;
}
.catalog-gate__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
}
.catalog-gate__btn {
  padding: 12px 26px;
  border: 1.5px solid transparent;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: var(--white);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition);
}
.catalog-gate__btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}
.catalog-gate__btn--ghost {
  background: var(--white);
  border-color: var(--green-300);
  color: var(--green-700);
}
.catalog-gate__btn--ghost:hover {
  background: var(--green-50);
}

@media (max-width: 480px) {
  .catalog-niches__label {
    display: none;
  }
  .catalog-gate {
    padding: 44px 16px;
    gap: 14px;
  }
  .catalog-gate__icon {
    font-size: 2.4rem;
  }
  .catalog-gate__title {
    font-size: 1.6rem;
  }
  .catalog-gate__lead {
    font-size: 0.95rem;
  }
  .catalog-gate__actions {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }
  .catalog-gate__btn {
    width: 100%;
    padding: 12px 20px;
  }
}
</style>
