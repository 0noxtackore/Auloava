<script setup>
// ============================================================
// ProductsView · Catálogo CRUD estilo Pinterest
// Rejilla masonry de pines con acciones de editar/eliminar
// al hacer hover. Incluye búsqueda, filtros y confirmación.
// ============================================================
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/store/products'
import { PLATFORMS, CATEGORIES } from '@/constants'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ProductCard from '@/components/product/ProductCard.vue'

const router = useRouter()
const store = useProductStore()

// Categorías dinámicas: las que realmente uses en tus productos.
const usedCategories = computed(() => {
  const set = new Set()
  for (const p of store.products) {
    const c = (p.category || '').trim()
    if (c) set.add(c)
  }
  return Array.from(set).sort()
})

// Modal de confirmación de borrado
const showDeleteModal = ref(false)
const deletingId = ref(null)
const deletingTitle = ref('')
const deleteError = ref('')

function confirmDelete(product) {
  deletingId.value = product.id
  deletingTitle.value = product.title
  deleteError.value = ''
  showDeleteModal.value = true
}

async function handleDelete() {
  deleteError.value = ''
  try {
    await store.deleteProduct(deletingId.value)
    showDeleteModal.value = false
    deletingId.value = null
  } catch (error) {
    deleteError.value = error?.response?.data?.message || 'No se pudo eliminar'
  }
}

function goEdit(product) {
  router.push({ name: 'product-edit', params: { id: product.id } })
}

function goCreate() {
  router.push({ name: 'product-create' })
}

onMounted(() => {
  store.fetchProducts().catch(() => {})
})
</script>

<template>
  <div class="products">
    <header class="products__head">
      <div>
        <h1 class="products__title">Explorar</h1>
        <p class="products__subtitle">
          {{ store.filteredProducts.length }} de {{ store.totalProducts }} productos afiliados
        </p>
      </div>
      <BaseButton @click="goCreate">
        <template #icon>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </template>
        Nuevo producto
      </BaseButton>
    </header>

    <!-- ===== Filtros ===== -->
    <div class="products__filters">
      <div class="products__search">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input
          v-model="store.filters.search"
          type="search"
          placeholder="Buscar por nombre o categoría..."
          aria-label="Buscar productos"
        />
      </div>

      <select v-model="store.filters.platform" class="products__select" aria-label="Filtrar por plataforma">
        <option value="all">Todas</option>
        <option v-for="p in PLATFORMS" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>

      <select v-model="store.filters.category" class="products__select" aria-label="Filtrar por categoría">
        <option value="all">Categorías</option>
        <option v-for="c in (usedCategories.length ? usedCategories : CATEGORIES)" :key="c" :value="c">{{ c }}</option>
      </select>

      <button
        v-if="store.filters.search || store.filters.platform !== 'all' || store.filters.category !== 'all'"
        class="products__clear"
        @click="store.resetFilters()"
      >
        ✕ Limpiar
      </button>
    </div>

    <!-- ===== Estados ===== -->
    <BaseLoader v-if="store.loading" full label="Cargando pines..." />

    <ErrorState
      v-else-if="store.error"
      :message="store.error"
      @retry="store.fetchProducts()"
    />

    <EmptyState
      v-else-if="!store.filteredProducts.length"
      title="Sin resultados"
      :message="'No hay pines que coincidan con tu búsqueda.'"
    >
      <template #action>
        <BaseButton size="sm" @click="goCreate">Añadir el primero</BaseButton>
      </template>
    </EmptyState>

    <!-- ===== Rejilla masonry ===== -->
    <div v-else class="pin-grid">
      <div v-for="product in store.filteredProducts" :key="product.id" class="pitem">
        <ProductCard :product="product" admin />

        <!-- Acciones de administración (hover) -->
        <div class="pitem__actions">
          <button class="pitem__btn" title="Editar" @click="goEdit(product)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
          </button>
          <button class="pitem__btn pitem__btn--danger" title="Eliminar" @click="confirmDelete(product)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14M10 11v6M14 11v6" /></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ===== Modal de confirmación ===== -->
    <BaseModal v-model="showDeleteModal" title="Eliminar producto">
      <p>
        ¿Seguro que deseas eliminar
        <strong>“{{ deletingTitle }}”</strong>? Esta acción no se puede deshacer.
      </p>
      <p v-if="deleteError" class="products__delete-error" role="alert">{{ deleteError }}</p>

      <template #footer>
        <BaseButton variant="ghost" @click="showDeleteModal = false">Cancelar</BaseButton>
        <BaseButton variant="danger" @click="handleDelete">Sí, eliminar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.products {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.products__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.products__title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: var(--ink);
}

.products__subtitle {
  color: var(--muted);
  margin-top: 4px;
}

/* Filtros */
.products__filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.products__search {
  position: relative;
  flex: 1;
  min-width: 220px;
}

.products__search svg {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
}

.products__search input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--off-white);
  font-size: 0.92rem;
  transition: background var(--transition), border-color var(--transition);
}
.products__search input:focus {
  outline: none;
  background: var(--white);
  border-color: var(--green-600);
}

.products__select {
  padding: 12px 32px 12px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--white);
  color: var(--ink);
  font-size: 0.88rem;
  cursor: pointer;
  transition: border-color var(--transition);
}
.products__select:focus {
  outline: none;
  border-color: var(--green-600);
}

.products__clear {
  padding: 10px 16px;
  border-radius: var(--radius-full);
  background: var(--green-50);
  color: var(--green-600);
  font-size: 0.85rem;
  font-weight: 600;
  transition: background var(--transition);
}
.products__clear:hover {
  background: var(--green-200);
}

/* Ítems del masonry con acciones */
.pitem {
  position: relative;
}

.pitem__actions {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 6px;
  z-index: 5;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.pitem:hover .pitem__actions {
  opacity: 1;
  transform: translateY(0);
}

.pitem__btn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--white);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
  transition: background var(--transition), color var(--transition);
}
.pitem__btn:hover {
  background: var(--green-600);
  color: var(--white);
}
.pitem__btn--danger:hover {
  background: var(--danger);
  color: var(--white);
}

.products__delete-error {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: var(--radius);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.85rem;
}
</style>
