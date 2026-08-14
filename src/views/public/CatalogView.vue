<script setup>
// ============================================================
// CatalogView · Catálogo público de ofertas (estilo Pinterest)
// Pensado para que cualquier visitante navegue y compare
// productos, sin entrar al área de administración.
// ============================================================
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '@/store/products'
import ProductCard from '@/components/product/ProductCard.vue'
import TheFooter from '@/components/layout/TheFooter.vue'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import EarningsMeter from '@/components/layout/EarningsMeter.vue'

const productStore = useProductStore()
const route = useRoute()
const query = ref(String(route.query.q || ''))

const products = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = productStore.products
  if (!q) return list
  return list.filter((p) => p.title.toLowerCase().includes(q))
})
</script>

<template>
  <div class="catalog-page">
    <PublicHeader />

    <main class="container catalog-main">
      <div class="catalog-demo-banner">
        Catálogo de <strong>demostración</strong>: precios e enlaces son de muestra.
        Los datos reales de AliExpress se activarán al aprobar la cuenta de afiliado.
      </div>
      <form class="catalog-search" @submit.prevent>
        <input
          v-model="query"
          type="search"
          placeholder="Busca ofertas en AliExpress, Amazon y Alibaba…"
          aria-label="Buscar ofertas"
        />
      </form>

      <div class="section__head">
        <span class="section__tag">Catálogo</span>
        <h1 class="section__title">Explora todas las ofertas</h1>
        <p class="section__lead">
          Compara precios, valoraciones y comisiones de los 3 gigantes del
          ecommerce en un solo lugar.
        </p>
      </div>

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
    </main>

    <TheFooter />
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
    font-size: 0.9rem;
  }
  .catalog-main {
    padding: 28px 0 48px;
  }
  .section__head {
    margin-bottom: 32px;
  }
}

@media (max-width: 380px) {
  .catalog-main {
    padding: 22px 0 40px;
  }
  .section__title {
    font-size: 1.5rem;
  }
}

.section__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  margin-bottom: 52px;
}
.section__tag {
  padding: 5px 14px;
  border-radius: var(--radius-full);
  background: var(--green-100);
  color: var(--green-700);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.section__title {
  position: relative;
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 3.6vw, 2.4rem);
  letter-spacing: -0.02em;
  color: var(--ink);
}
.section__title::after {
  content: '';
  display: block;
  width: 56px;
  height: 4px;
  margin: 16px auto 0;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--green-500), var(--green-300));
}
.section__lead {
  color: var(--muted);
  font-size: 1.02rem;
  max-width: 520px;
}

.catalog-empty {
  text-align: center;
  color: var(--muted);
  padding: 60px 0;
  font-size: 1.05rem;
}

.catalog-demo-banner {
  margin: 22px 0 30px;
  padding: 12px 16px;
  border-radius: var(--radius);
  border: 1px dashed var(--green-500);
  background: var(--green-50);
  color: var(--green-800);
  font-size: 0.92rem;
  text-align: center;
}
</style>
