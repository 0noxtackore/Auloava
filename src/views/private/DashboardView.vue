<script setup>
// ============================================================
// DashboardView · Panel con estadísticas
// Ejemplo de integración del store (Pinia) con las vistas:
//  - Estadísticas calculadas en getters del store
//  - Desglose por plataforma con barras CSS
//  - Top 5 productos por clicks
// ============================================================
import { computed, onMounted } from 'vue'
import { useProductStore } from '@/store/products'
import { PLATFORMS } from '@/constants'
import { formatPrice, formatPercent } from '@/utils/formatters'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ProductCard from '@/components/product/ProductCard.vue'

const productStore = useProductStore()

const stats = computed(() => productStore.stats)

// Iconos para cada tarjeta de estadística
const statIcons = {
  box: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM12 22V12',
  cursor: 'm3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z',
  coin: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 6h2m-1 0v8m0 0a2 2 0 0 0 0-4m-2-4a2 2 0 0 1 4 0',
  percent: 'M19 5 5 19M5 5h.01M19 19h.01',
}

function platformName(id) {
  return PLATFORMS[id]?.name || id
}

function platformColor(id) {
  return PLATFORMS[id]?.color || '#888'
}

onMounted(() => {
  productStore.fetchProducts().catch(() => {})
})
</script>

<template>
  <div class="dash">
    <header class="dash__head">
      <div>
        <h1 class="dash__title">Dashboard 👋</h1>
        <p class="dash__subtitle">Resumen del catálogo de afiliados.</p>
      </div>
    </header>

    <!-- Loader global -->
    <BaseLoader v-if="productStore.loading" full label="Cargando dashboard..." />

    <!-- Estado de error -->
    <ErrorState
      v-else-if="productStore.error"
      :message="productStore.error"
      @retry="productStore.fetchProducts()"
    />

    <template v-else>
      <!-- ===== Tarjetas de estadísticas ===== -->
      <section class="dash__stats">
        <BaseCard
          v-for="stat in stats"
          :key="stat.label"
          hoverable
          class="stat"
        >
          <div class="stat__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path :d="statIcons[stat.icon]" />
            </svg>
          </div>
          <div class="stat__meta">
            <span class="stat__value">
              {{ stat.currency ? formatPrice(stat.value) : stat.percent ? formatPercent(stat.value, 1) : stat.value }}
            </span>
            <span class="stat__label">{{ stat.label }} · <small>{{ stat.hint }}</small></span>
          </div>
        </BaseCard>
      </section>

      <div class="dash__grid">
        <!-- ===== Desglose por plataforma ===== -->
        <BaseCard title="Productos por plataforma">
          <div class="dash__breakdown">
            <div
              v-for="item in productStore.platformBreakdown"
              :key="item.platform"
              class="break"
            >
              <div class="break__head">
                <span class="break__dot" :style="{ background: platformColor(item.platform) }" />
                <span class="break__name">{{ platformName(item.platform) }}</span>
                <span class="break__count">{{ item.count }} productos</span>
                <strong>{{ item.percent }}%</strong>
              </div>
              <div class="break__track">
                <div
                  class="break__bar"
                  :style="{
                    width: item.percent + '%',
                    background: platformColor(item.platform),
                  }"
                />
              </div>
            </div>
          </div>
        <p v-if="!productStore.platformBreakdown.length" class="dash__hint">
            Aún no hay productos para mostrar el desglose.
          </p>
        </BaseCard>

        <!-- ===== Top productos ===== -->
        <BaseCard title="Top productos por clicks">
          <ol class="dash__top">
            <li v-for="(p, i) in productStore.topProducts" :key="p.id" class="top">
              <span class="top__rank" :class="{ 'top__rank--gold': i === 0 }">{{ i + 1 }}</span>
              <img class="top__img" :src="p.image" :alt="p.title" loading="lazy" />
              <div class="top__meta">
                <strong>{{ p.title }}</strong>
                <span>{{ p.platform }} · {{ formatPrice(p.price) }}</span>
              </div>
              <span class="top__clicks">{{ p.clicks.toLocaleString('es-ES') }}</span>
            </li>
          </ol>
          <p v-if="!productStore.topProducts.length" class="dash__hint">
            Cuando añadas productos, verás aquí los más populares.
          </p>
        </BaseCard>
      </div>

      <!-- ===== Productos destacados ===== -->
      <section class="dash__featured">
        <BaseCard title="Productos más recientes" padded>
          <div v-if="productStore.products.length" class="pin-grid">
            <ProductCard
              v-for="product in productStore.products.slice(0, 6)"
              :key="product.id"
              :product="product"
              admin
            />
          </div>
          <div v-else class="dash__empty">
            <div class="dash__empty-icon">✦</div>
            <strong>Sin productos todavía</strong>
            <RouterLink :to="{ name: 'product-create' }">Añadir el primer producto</RouterLink>
          </div>
        </BaseCard>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.dash__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dash__title {
  font-size: 1.8rem;
  color: var(--green-900);
}

.dash__subtitle {
  color: var(--muted);
  margin-top: 4px;
}

/* Estadísticas */
.dash__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 18px;
}

.stat__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--green-100);
  color: var(--green-600);
  flex-shrink: 0;
}

.stat__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat__value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--green-800);
}

.stat__label {
  font-size: 0.82rem;
  color: var(--muted);
}
.stat__label small {
  text-transform: lowercase;
}

/* Grid principal */
.dash__grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
}

@media (max-width: 1000px) {
  .dash__grid {
    grid-template-columns: 1fr;
  }
}

/* Desglose */
.dash__breakdown {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.break__head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.break__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.break__name {
  font-weight: 600;
  color: var(--green-800);
}

.break__count {
  margin-left: auto;
  color: var(--muted);
  font-size: 0.82rem;
}

.break__head strong {
  color: var(--green-800);
}

.break__track {
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--green-50);
  overflow: hidden;
}

.break__bar {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Top productos */
.dash__top {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.top {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: var(--radius);
  transition: background var(--transition);
}
.top:hover {
  background: var(--green-50);
}

.top__rank {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--green-100);
  color: var(--green-700);
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.top__rank--gold {
  background: var(--warning);
  color: var(--white);
}

.top__img {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  object-fit: cover;
}

.top__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.top__meta strong {
  font-size: 0.92rem;
  color: var(--green-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.top__meta span {
  font-size: 0.8rem;
  color: var(--muted);
}

.top__clicks {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--green-600);
}

.dash__hint {
  padding: 16px 4px 4px;
  font-size: 0.85rem;
  color: var(--muted);
  text-align: center;
}

.dash__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 32px 16px;
}

.dash__empty-icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--green-100), var(--green-200));
  color: var(--green-600);
  font-size: 1.5rem;
}

.dash__empty strong {
  font-size: 0.95rem;
  color: var(--green-800);
}

.dash__empty a {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--green-600);
}
.dash__empty a:hover {
  text-decoration: underline;
}

.dash__featured {
  /* usa el padding de BaseCard internamente para la cuadrícula */
}
</style>
