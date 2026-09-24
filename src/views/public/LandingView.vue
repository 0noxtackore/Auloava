<script setup>
// ============================================================
// LandingView · Página de aterrizaje Auloava
// Diseño tipo Pinterest (masonry) con paleta verde + blanco,
// degradados suaves y estado atractivo cuando no hay productos.
// ============================================================
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/store/products'
import { useProductSuggestions } from '@/composables/useProductSuggestions'
import { auth, authReady } from '@/services/auth'
import { landingData } from '@/services/mock'
import { CATEGORIES } from '@/constants'
import { formatPercent, decodeHtml } from '@/utils/formatters'
import ProductCard from '@/components/product/ProductCard.vue'
import TheFooter from '@/components/layout/TheFooter.vue'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import EarningsMeter from '@/components/layout/EarningsMeter.vue'

const router = useRouter()
const productStore = useProductStore()

// Ofertas destacadas: 20 productos aleatorios mezclados de todas las categorías
const featured = computed(() => {
  const arr = [...productStore.products]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, 20)
})

const assetsBase = import.meta.env.BASE_URL
const platformLogos = {
  aliexpress: assetsBase + 'images/logos/aliexpress.svg',
  amazon: assetsBase + 'images/logos/amazon.svg',
  alibaba: assetsBase + 'images/logos/alibaba.svg',
}
const logoFor = (id) => platformLogos[id] || ''

// Imágenes de la sección "Cómo funciona" (carpeta /steps en public)
const STEP_IMG = {
  Explora: 'explora.webp',
  Compara: 'compara.webp',
  Compra: 'compra.webp',
  Ahorra: 'ahorra.webp',
  'Recibe alertas': 'recibe-alertas.webp',
  Comparte: 'comparte.webp',
}
const stepImage = (step) =>
  `${import.meta.env.BASE_URL}images/steps/${STEP_IMG[step.title] || 'explora.webp'}`

// Ir al catálogo, pero exigiendo login si el usuario no ha iniciado sesión.
// Firebase sólo se carga al pulsar (no en la carga inicial de la landing).
// La búsqueda del hero se pasa como ?q= al catálogo (y en el redirect de login).
const heroSearch = ref('')
const { suggestions: heroSuggestions } = useProductSuggestions(heroSearch, 6)
const heroOpen = ref(false)

function pickHeroSuggestion(p) {
  heroSearch.value = p.title
  heroOpen.value = false
  goToCatalog()
}
function onHeroBlur() {
  setTimeout(() => {
    heroOpen.value = false
  }, 150)
}

const goToCatalog = async () => {
  const { auth, authReady } = await import('@/services/auth')
  await authReady
  const q = heroSearch.value.trim()
  const to = { name: 'catalog', query: q ? { q } : {} }
  if (auth.currentUser) {
    router.push(to)
  } else {
    router.push({
      name: 'public-login',
      query: { redirect: `/catalog${q ? `?q=${encodeURIComponent(q)}` : ''}` },
    })
  }
}

// Categorías dinámicas: las más populares (por clicks acumulados) y las más
// recientes (por createdAt). Se combinan sin duplicar y se limitan a 12.
const categoryChips = computed(() => {
  const products = productStore.products
  if (!products.length) return [...CATEGORIES]
  const map = new Map()
  for (const p of products) {
    const c = (p.category || '').trim()
    if (!c) continue
    const e = map.get(c) || { category: c, clicks: 0, latest: 0 }
    e.clicks += Number(p.clicks) || 0
    const t = new Date(p.createdAt || 0).getTime()
    if (t > e.latest) e.latest = t
    map.set(c, e)
  }
  const arr = [...map.values()]
  const popular = arr
    .slice()
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 8)
    .map((x) => x.category)
  const recent = arr
    .slice()
    .sort((a, b) => b.latest - a.latest)
    .slice(0, 8)
    .map((x) => x.category)
  const out = []
  for (const c of [...popular, ...recent]) if (!out.includes(c)) out.push(c)
  return out.slice(0, 12)
})

// Clic en una categoría: lleva al catálogo filtrado por esa categoría.
// El invitado lo ve LIMITADO (sin login); al pulsar "catálogo completo"
// sí se pide login. Si ya inició sesión, lo ve completo sin problemas.
const goToCategory = (category) => {
  router.push({ name: 'catalog', query: { category } })
}

// Stats del hero con datos reales del store (no adornos falsos)
function fmtCompact(n) {
  n = Number(n) || 0
  if (n >= 1e6) return `${(n / 1e6).toLocaleString('es-ES', { maximumFractionDigits: 1 })} M`
  if (n >= 1e3) return `${(n / 1e3).toLocaleString('es-ES', { maximumFractionDigits: 0 })} mil`
  return String(n | 0)
}
const heroStats = computed(() => {
  const p = productStore.products
  if (!p.length) return []
  const prices = p.map((x) => Number(x.price)).filter(Number.isFinite)
  const min = Math.min(...prices)
  const avgRating = p.reduce((a, x) => a + (Number(x.rating) || 0), 0) / p.length
  const totalReviews = p.reduce((a, x) => a + (Number(x.ratingCount) || 0), 0)
  return [
    { value: String(p.length), label: 'hallazgos curados' },
    { value: `$${min.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`, label: 'desde' },
    { value: `${avgRating.toFixed(1)}★`, label: 'valoración media' },
    { value: `${fmtCompact(totalReviews)}+`, label: 'opiniones reales' },
  ]
})

// Chips del hero: nombres de productos random de la categoría mejor valorada
const heroChips = computed(() => {
  const p = productStore.products
  if (!p.length) return []
  const byCat = new Map()
  for (const x of p) {
    const c = (x.category || '').trim()
    if (!c) continue
    const arr = byCat.get(c) || []
    arr.push(x)
    byCat.set(c, arr)
  }
  let best = null
  let bestAvg = 0
  for (const [c, arr] of byCat) {
    const avg = arr.reduce((a, x) => a + (Number(x.rating) || 0), 0) / arr.length
    if (avg > bestAvg) {
      bestAvg = avg
      best = arr
    }
  }
  const pool = (best || p).slice()
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, 9).map((x) => decodeHtml(x.title))
})

// Dos cadenas verticales (izquierda y derecha) intercalando las chips
const heroChipsLeft = computed(() => heroChips.value.filter((_, i) => i % 2 === 0))
const heroChipsRight = computed(() => heroChips.value.filter((_, i) => i % 2 === 1))

// Imágenes para enriquecer secciones (datos reales del store)
const featureImages = computed(() => productStore.products.map((p) => p.image))
const mockProducts = computed(() => productStore.products.slice(0, 6))

// Características "Por qué Auloava"
const features = [
  {
    title: 'Curado a mano',
    text: 'Cada producto es seleccionado y revisado antes de aparecer en Auloava.',
    icon: 'check',
  },
  {
    title: 'Comparativa real',
    text: 'Precio, valoración y comisión de los 3 marketplaces a la vez.',
    icon: 'chart',
  },
  {
    title: 'Enlaces seguros',
    text: 'Accede con enlaces de afiliado verificados, sin sorpresas.',
    icon: 'shield',
  },
  {
    title: 'Siempre actualizado',
    text: 'Catálogo en evolución conforme llegan nuevas ofertas.',
    icon: 'refresh',
  },
]

const featureIcons = {
  check: 'M20 6 9 17l-5-5',
  chart: 'M3 3v18h18M7 14l4-4 4 4 5-6',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  refresh: 'M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6',
}

const isGuest = ref(true)
onMounted(async () => {
  if (!productStore.products.length) {
    productStore.fetchProducts().catch(() => {})
  }
  await authReady
  isGuest.value = !auth.currentUser
})
</script>

<template>
  <div class="landing">
    <PublicHeader />

    <main id="top">
      <!-- ============ HERO (gradiente de marca + hallazgos flotantes) ============ -->
      <section class="hero">
        <div class="hero__pattern" aria-hidden="true" />
        <div class="hero__glow" aria-hidden="true" />
        <div class="hero__ring hero__ring--a" aria-hidden="true" />
        <div class="hero__ring hero__ring--b" aria-hidden="true" />
        <div class="hero__blob hero__blob--a" aria-hidden="true" />
        <div class="hero__blob hero__blob--b" aria-hidden="true" />
        <div class="hero__blob hero__blob--c" aria-hidden="true" />
        <div class="hero__blob hero__blob--d" aria-hidden="true" />
        <div class="hero__blob hero__blob--e" aria-hidden="true" />

        <div v-if="heroChips.length" class="hero__chips" aria-hidden="true">
          <ul v-if="heroChipsLeft.length" class="chip-chain chip-chain--left">
            <li v-for="(name, i) in heroChipsLeft" :key="`l${i}`" class="chip-node">
              <span class="chip-node__bar" />
              <span class="chip-node__pill" :class="{ 'chip-node__pill--alt': i % 2 === 1 }">
                {{ name }}
              </span>
              <span class="chip-node__bar" />
              <span v-if="i + 1 < heroChipsLeft.length" class="chip-node__stem" />
            </li>
          </ul>

          <ul v-if="heroChipsRight.length" class="chip-chain chip-chain--right">
            <li v-for="(name, i) in heroChipsRight" :key="`r${i}`" class="chip-node">
              <span class="chip-node__bar" />
              <span class="chip-node__pill" :class="{ 'chip-node__pill--alt': i % 2 === 1 }">
                {{ name }}
              </span>
              <span class="chip-node__bar" />
              <span v-if="i + 1 < heroChipsRight.length" class="chip-node__stem" />
            </li>
          </ul>
        </div>

        <div class="container hero__center" v-reveal>
          <span class="hero__eyebrow">
            <span class="hero__pulse" />
            <img class="hero__plat-logo" :src="logoFor('aliexpress')" alt="AliExpress" />
            <img class="hero__plat-logo" :src="logoFor('amazon')" alt="Amazon" />
            <img class="hero__plat-logo" :src="logoFor('alibaba')" alt="Alibaba" />
            <span class="hero__eyebrow-text">Un mismo hallazgo, tres marketplaces</span>
          </span>

          <h1 class="hero__title">
            El mejor precio para cada
            <span class="hero__accent">hallazgo</span>
          </h1>

          <p class="hero__subtitle">
            Tecnología, hogar, cocina, belleza y oficina: comparamos el mismo
            producto en Amazon, AliExpress y Alibaba para que ahorres sin riesgos.
            Sin cuentas, sin sorpresas.
          </p>

          <form class="hero__search" @submit.prevent="goToCatalog">
            <svg class="hero__search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <div class="hero__search-box">
              <input
                type="text"
                v-model="heroSearch"
                @focus="heroOpen = true"
                @blur="onHeroBlur"
                placeholder="Busca hallazgos: power banks, binoculares, ice makers…"
              />
              <ul v-if="heroOpen && heroSuggestions.length" class="hero__suggestions">
                <li
                  v-for="p in heroSuggestions"
                  :key="p.id"
                  @mousedown.prevent="pickHeroSuggestion(p)"
                >
                  <span class="hero__sugg-title">{{ decodeHtml(p.title) }}</span>
                  <span class="hero__sugg-cat">{{ p.category || 'Sin categoría' }}</span>
                </li>
              </ul>
            </div>
            <button type="submit">Explorar</button>
          </form>

          <ul class="hero__stats">
            <li v-for="stat in heroStats" :key="stat.label">
              <strong>{{ stat.value }}</strong>
              <span>{{ stat.label }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- ============ CATEGORÍAS (chips) ============ -->
      <section id="nav" class="chips">
        <div class="container chips__inner">
          <button
            v-for="category in categoryChips"
            :key="category"
            type="button"
            class="chips__item"
            @click="goToCategory(category)"
          >
            {{ category }}
          </button>
        </div>
      </section>

      <!-- ============ OFERTAS DESTACADAS ============ -->
      <section id="featured" class="section">
        <div class="container">
          <div class="section__head">
            <span class="section__tag">Descubre</span>
            <h2 class="section__title">Ofertas destacadas</h2>
            <p class="section__lead">
              Productos seleccionados a mano y verificados antes de publicarlos.
            </p>
          </div>

          <!-- Carga -->
          <div v-if="productStore.loading" class="skeleton-grid">
            <div v-for="n in 8" :key="n" class="skeleton pin-skeleton" :style="{ aspectRatio: n % 3 === 0 ? '3/4' : n % 3 === 1 ? '1/1' : '4/3' }" />
          </div>

          <!-- Estado bonito si aún no hay productos -->
          <div v-else-if="!featured.length" class="empty-catalog">
            <div class="empty-catalog__art" aria-hidden="true">
              <span class="empty-catalog__tile" />
              <span class="empty-catalog__tile" />
              <span class="empty-catalog__tile" />
              <div class="empty-catalog__badge">A</div>
            </div>
            <h3 class="empty-catalog__title">Nuestro catálogo está en preparación</h3>
            <p class="empty-catalog__text">
              Muy pronto encontrarás aquí ofertas reales de AliExpress, Amazon
              y Alibaba. Mientras tanto, explora el catálogo para conocer cómo
              funcionará todo.
            </p>
            <button class="empty-catalog__btn" @click="goToCatalog">
              Explorar catálogo
            </button>
          </div>

          <!-- Rejilla masonry real -->
          <div v-else class="pin-grid">
            <ProductCard v-for="product in featured" :key="product.id" :product="product" />
          </div>

          <!-- Enlace al catálogo completo -->
          <div v-if="featured.length" class="featured-more">
            <div v-if="isGuest" class="catalog-guest catalog-guest--landing">
              <span>
                Solo estás viendo <strong>una parte</strong>. El catálogo completo
                esconde mucho más de lo que imaginas…
              </span>
              <button type="button" class="catalog-guest__btn" @click="goToCatalog">
                Ver catálogo completo
              </button>
            </div>
            <RouterLink v-else :to="{ name: 'catalog' }" class="featured-more__btn">
              Ver catálogo completo ({{ productStore.products.length }} ofertas)
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- ============ POR QUÉ AULOAVA ============ -->
      <section id="about" class="section section--gray">
        <div class="container">
          <div class="section__head">
            <span class="section__tag">Ventajas</span>
            <h2 class="section__title">Por qué Auloava</h2>
          </div>

          <div class="features">
            <article
              v-for="(feature, index) in features"
              :key="feature.title"
              class="feature"
              v-reveal
              :style="{ transitionDelay: `${index * 60}ms` }"
            >
              <span class="feature__index">{{ index + 1 }}</span>
              <div class="feature__body">
                <h3>{{ feature.title }}</h3>
                <p>{{ feature.text }}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- ============ MARKETPLACES ============ -->
      <section id="marketplaces" class="section">
        <div class="container">
          <div class="marketplaces" v-reveal>
            <ul class="logo-strip">
              <li
                v-for="platform in landingData.platforms"
                :key="platform.id"
                class="logo-strip__item"
              >
                <img
                  class="logo-strip__logo"
                  :src="logoFor(platform.id)"
                  :alt="platform.name"
                  loading="lazy"
                />
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ============ CÓMO FUNCIONA ============ -->
      <section id="how" class="section">
        <div class="container">
          <div class="section__head">
            <span class="section__tag">Fácil</span>
            <h2 class="section__title">Cómo funciona</h2>
            <p class="section__lead">Tres pasos, sin complicaciones.</p>
          </div>

          <div class="steps">
            <article v-for="(step, index) in landingData.steps" :key="step.title" class="step" v-reveal :style="{ transitionDelay: `${index * 80}ms` }">
              <div class="step__media">
                <img class="step__img" :src="stepImage(step)" :alt="step.title" loading="lazy" />
                <span class="step__num">0{{ index + 1 }}</span>
              </div>
              <div class="step__text">
                <h3>{{ step.title }}</h3>
                <p>{{ step.text }}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- ============ TESTIMONIOS ============ -->
      <section id="press" class="section">
        <div class="container">
          <div class="section__head">
            <span class="section__tag">Opiniones</span>
            <h2 class="section__title">Lo que dicen nuestros usuarios</h2>
          </div>

          <div class="testimonials">
            <figure v-for="t in landingData.testimonials" :key="t.name" class="testimonial" v-reveal>
              <div class="testimonial__stars">★★★★★</div>
              <blockquote>“{{ t.text }}”</blockquote>
              <figcaption>
                <img :src="t.avatar" :alt="t.name" loading="lazy" />
                <div>
                  <strong>{{ t.name }}</strong>
                  <span>{{ t.role }}</span>
                </div>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <!-- ============ CTA ============ -->
      <section class="cta">
        <div class="cta__orb" />
        <div class="container cta__inner" v-reveal>
          <h2>¿Listo para descubrir?</h2>
          <p>
            Comisiones de hasta el {{ formatPercent(22, 0) }} y productos
            seleccionados a mano. Explora el catálogo y encuentra tu próxima
            compra inteligente.
          </p>
          <button class="cta__btn" @click="goToCatalog">
            Explorar catálogo
          </button>
        </div>
      </section>

      <!-- ============ ADSENSE (oculto) ============ -->
      <EarningsMeter />
    </main>

    <TheFooter />
  </div>
</template>

<style scoped>
/* ================= HERO (gradiente de marca + hallazgos flotantes) ================= */
.hero {
  position: relative;
  overflow: hidden;
  min-height: 92vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 0 90px;
  background:
    radial-gradient(120% 90% at 85% -10%, rgba(47, 107, 79, 0.20), transparent 60%),
    radial-gradient(100% 80% at 0% 115%, rgba(61, 138, 99, 0.18), transparent 62%),
    linear-gradient(160deg, var(--green-100) 0%, var(--green-50) 45%, var(--off-white) 100%);
}

/* Puntos sutiles que se desvanecen hacia los bordes */
.hero__pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(rgba(47, 107, 79, 0.16) 1.5px, transparent 1.5px);
  background-size: 30px 30px;
  -webkit-mask-image: radial-gradient(ellipse 58% 62% at 50% 45%, #000 0%, transparent 74%);
  mask-image: radial-gradient(ellipse 58% 62% at 50% 45%, #000 0%, transparent 74%);
}

/* Formas orgánicas suaves de la paleta */
.hero__blob {
  position: absolute;
  border-radius: 42% 58% 63% 37% / 45% 45% 55% 55%;
  pointer-events: none;
}
.hero__blob--a {
  width: 460px;
  height: 460px;
  top: -110px;
  right: -70px;
  background: linear-gradient(135deg, var(--green-200), var(--green-100));
  opacity: 0.85;
  animation: blob-drift 18s ease-in-out infinite;
}
.hero__blob--b {
  width: 420px;
  height: 420px;
  bottom: -140px;
  left: -90px;
  background: linear-gradient(135deg, var(--green-200), var(--green-100));
  opacity: 0.9;
  animation: blob-drift 24s ease-in-out infinite reverse;
}
.hero__blob--c {
  width: 220px;
  height: 220px;
  top: 36%;
  left: 7%;
  background: var(--green-200);
  opacity: 0.5;
  animation: blob-drift 30s ease-in-out infinite;
}
.hero__blob--d {
  width: 300px;
  height: 300px;
  top: 6%;
  left: 30%;
  background: var(--green-100);
  opacity: 0.5;
  animation: blob-drift 22s ease-in-out infinite;
}
.hero__blob--e {
  width: 260px;
  height: 260px;
  bottom: 6%;
  right: 24%;
  background: linear-gradient(135deg, var(--green-200), var(--green-100));
  opacity: 0.7;
  animation: blob-drift 26s ease-in-out infinite reverse;
}
@keyframes blob-drift {
  0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
  33% { transform: translate(18px, -14px) rotate(6deg) scale(1.05); }
  66% { transform: translate(-14px, 12px) rotate(-6deg) scale(0.97); }
}

/* Luz central que da profundidad al texto */
.hero__glow {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(980px, 92vw);
  height: min(680px, 72vh);
  background:
    radial-gradient(closest-side, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0) 62%),
    radial-gradient(closest-side at 50% 100%, rgba(140, 199, 166, 0.28), transparent 70%);
  pointer-events: none;
}

/* Anillos finos de marca en los extremos */
.hero__ring {
  position: absolute;
  border: 2px solid rgba(47, 107, 79, 0.16);
  border-radius: 50%;
  pointer-events: none;
}
.hero__ring--a {
  width: 540px;
  height: 540px;
  top: -160px;
  left: -120px;
  animation: blob-drift 28s ease-in-out infinite;
}
.hero__ring--b {
  width: 340px;
  height: 340px;
  bottom: -120px;
  right: 4%;
  border-color: rgba(47, 107, 79, 0.12);
  animation: blob-drift 24s ease-in-out infinite reverse;
}

/* Cadenas verticales estilo mapa conceptual */
.hero__chips {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.chip-chain {
  position: absolute;
  top: 0;
  height: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
}
.chip-chain--left {
  left: 3.5%;
}
.chip-chain--right {
  right: 3.5%;
}
.chip-node {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.chip-node__bar {
  width: 58px;
  height: 2px;
  border-radius: 2px;
  background: var(--green-600);
  opacity: 0.5;
}
.chip-node__stem {
  width: 2px;
  height: 24px;
  border-radius: 2px;
  background: var(--green-600);
  opacity: 0.5;
}
.chip-node__pill {
  max-width: 220px;
  padding: 7px 14px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  border: 1px solid transparent;
  color: var(--white);
  font-size: 0.76rem;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chip-node__pill--alt {
  background: #fefefe;
  border-color: rgba(47, 107, 79, 0.18);
  color: var(--green-700);
}

.hero__center {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  max-width: 920px;
  padding: 0 20px;
  text-align: center;
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: var(--radius-full);
  background: var(--white);
  border: 1px solid var(--green-200);
  color: var(--green-700);
  font-size: 0.84rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}
.hero__plat-logo {
  height: 15px;
  width: auto;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.08));
}
.hero__eyebrow-text {
  margin-left: 4px;
}

.hero__pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green-500);
  animation: pulse-dot 1.8s infinite;
}

.hero__title {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 6vw, 4rem);
  letter-spacing: -0.025em;
  line-height: 1.05;
  color: var(--ink);
  max-width: 700px;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
}

.hero__accent {
  position: relative;
  color: var(--green-600);
}
.hero__accent::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 4px;
  height: 12px;
  background: var(--green-100);
  border-radius: var(--radius-full);
  z-index: -1;
}

.hero__subtitle {
  color: var(--ink);
  font-size: 1.1rem;
  max-width: 560px;
}

/* Barra de búsqueda tipo Pinterest */
.hero__search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(560px, 100%);
  padding: 8px 8px 8px 18px;
  border-radius: var(--radius-full);
  background: var(--white);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}
.hero__search-icon {
  color: var(--muted);
  flex-shrink: 0;
}
.hero__search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  font-size: 1rem;
  color: var(--ink);
  background: transparent;
}
.hero__search button {
  border: none;
  cursor: pointer;
  padding: 12px 24px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: var(--white);
  font-weight: 700;
  font-size: 0.95rem;
  transition: transform var(--transition);
}
.hero__search button:hover {
  transform: translateY(-1px);
}

/* Desplegable de sugerencias (estilo Google) */
.hero__search-box {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
}
.hero__search-box .hero__search-icon {
  display: none;
}
.hero__suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 50;
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
.hero__suggestions li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 12px;
  border-radius: var(--radius-sm, 8px);
  cursor: pointer;
  transition: background var(--transition);
}
.hero__suggestions li:hover {
  background: var(--green-50);
}
.hero__sugg-title {
  font-size: 0.9rem;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hero__sugg-cat {
  font-size: 0.74rem;
  color: var(--muted);
}

.hero__stats {
  display: flex;
  gap: 36px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 4px;
}
.hero__stats li {
  display: flex;
  flex-direction: column;
}
.hero__stats strong {
  font-family: var(--font-display);
  font-size: 1.7rem;
  color: var(--green-600);
}
.hero__stats span {
  font-size: 0.85rem;
  color: var(--ink);
}

@media (max-width: 1179px) {
  .hero {
    flex-direction: column;
    gap: 28px;
  }
  .hero__chips,
  .hero__ring,
  .hero__glow {
    display: none;
  }
}
@media (max-width: 820px) {
  .hero {
    min-height: auto;
    padding: 96px 0 48px;
  }
}
@media (max-width: 540px) {
  .hero__eyebrow-text {
    display: none;
  }
  .hero__search {
    flex-wrap: wrap;
    border-radius: var(--radius-lg);
  }
  .hero__search input {
    width: 100%;
    padding: 6px 4px;
  }
  .hero__search button {
    width: 100%;
  }
  .hero__stats {
    gap: 24px;
  }
}

/* ================= CHIPS / CATEGORÍAS ================= */
.chips {
  border-bottom: 1px solid var(--line);
}

.chips__inner {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 22px 24px;
}

.chips__item {
  padding: 9px 20px;
  border-radius: var(--radius-full);
  background: var(--green-50);
  border: 1px solid var(--green-200);
  color: var(--green-700);
  font-size: 0.87rem;
  font-weight: 600;
  transition: background var(--transition), color var(--transition),
    transform var(--transition);
}
.chips__item:hover {
  background: var(--green-600);
  border-color: var(--green-600);
  color: var(--white);
  transform: translateY(-2px);
}

/* ================= SECCIONES ================= */
.section {
  padding: 84px 0;
}

.section--gray {
  position: relative;
  background:
    radial-gradient(620px 320px at 10% -10%, rgba(93, 170, 126, 0.16), transparent 60%),
    radial-gradient(560px 340px at 92% 110%, rgba(47, 107, 79, 0.12), transparent 60%),
    linear-gradient(180deg, var(--off-white), var(--white));
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

@media (max-width: 600px) {
  .section {
    padding: 56px 0;
  }
  .section__head {
    margin-bottom: 36px;
  }
  .cta {
    padding: 64px 0;
  }
}

/* Skeletons */
.skeleton-grid {
  columns: 4 220px;
  column-gap: 16px;
}
.pin-skeleton {
  break-inside: avoid;
  margin-bottom: 16px;
  border-radius: var(--radius);
}

/* Estado vacío del catálogo */
.empty-catalog {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  padding: 40px 24px 20px;
}

.empty-catalog__art {
  position: relative;
  width: 180px;
  height: 180px;
}

.empty-catalog__tile {
  position: absolute;
  border-radius: var(--radius);
  background: linear-gradient(160deg, var(--green-100), var(--green-200));
}
.empty-catalog__tile:nth-child(1) {
  width: 90px;
  height: 120px;
  top: 0;
  left: 10px;
  transform: rotate(-8deg);
}
.empty-catalog__tile:nth-child(2) {
  width: 90px;
  height: 100px;
  top: 14px;
  right: 6px;
  transform: rotate(6deg);
}
.empty-catalog__tile:nth-child(3) {
  width: 120px;
  height: 80px;
  bottom: 0;
  left: 30px;
  transform: rotate(-3deg);
}

.empty-catalog__badge {
  position: absolute;
  inset: 50% 0 0 50%;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--green-600), var(--green-400));
  color: var(--white);
  font-family: var(--font-display);
  font-size: 1.7rem;
  font-weight: 800;
  box-shadow: var(--shadow);
  animation: float 6s ease-in-out infinite;
}

.empty-catalog__title {
  font-size: 1.35rem;
  color: var(--ink);
}

.empty-catalog__text {
  color: var(--muted);
  max-width: 460px;
  line-height: 1.7;
}

.empty-catalog__btn {
  margin-top: 8px;
  padding: 13px 26px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: var(--white);
  font-weight: 700;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition);
}
.empty-catalog__btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

/* ================= FEATURES ================= */
/* ===== TIMELINE (horizontal en desktop) ===== */
.features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  position: relative;
}
.features::before {
  content: "";
  position: absolute;
  top: 23px;
  left: 12.5%;
  right: 12.5%;
  height: 2px;
  background: var(--green-200);
}

.feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.feature__index {
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--green-500);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1;
  z-index: 1;
}

.feature__body {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 0 8px;
}

.feature h3 {
  font-size: 1.12rem;
  color: var(--ink);
}
.feature p {
  font-size: 0.92rem;
  color: var(--muted);
  line-height: 1.6;
}

/* ===== TIMELINE (vertical en pantallas estrechas) ===== */
@media (max-width: 900px) {
  .features {
    display: flex;
    flex-direction: column;
  }
  .features::before {
    display: none;
  }
  .feature {
    position: relative;
    flex-direction: row;
    align-items: flex-start;
    text-align: left;
    gap: 18px;
    padding-bottom: 30px;
  }
  .feature:last-child {
    padding-bottom: 0;
  }
  .feature:not(:last-child)::before {
    content: "";
    position: absolute;
    left: 23px;
    top: 48px;
    bottom: 0;
    width: 2px;
    background: var(--green-200);
  }
  .feature__body {
    margin-top: 2px;
    align-items: flex-start;
    padding: 0;
  }
}

/* ================= MARKETPLACES ================= */
.marketplaces {
  display: flex;
  justify-content: center;
}

.logo-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 24px 56px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.logo-strip__item {
  display: flex;
  transition: transform var(--transition);
}
.logo-strip__item:hover {
  transform: translateY(-4px);
}

.logo-strip__logo {
  height: 46px;
  width: auto;
  max-width: 170px;
  object-fit: contain;
  filter: grayscale(100%) sepia(100%) hue-rotate(90deg) saturate(320%) brightness(0.95);
  opacity: 0.9;
  transition: filter var(--transition), opacity var(--transition);
}
.logo-strip__item:hover .logo-strip__logo {
  filter: none;
  opacity: 1;
}

@media (max-width: 820px) {
  .logo-strip {
    gap: 20px 32px;
  }
  .logo-strip__logo {
    height: 38px;
  }
}

@media (max-width: 480px) {
  .logo-strip {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px 12px;
  }
  .logo-strip__item {
    justify-content: center;
  }
  .logo-strip__logo {
    height: 22px;
    max-width: 92px;
  }
}

/* ================= STEPS (pins) ================= */
.steps {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 18px;
  align-items: start;
}

.step:nth-child(3n + 1) .step__media {
  aspect-ratio: 2 / 3;
}
.step:nth-child(3n + 2) .step__media {
  aspect-ratio: 1 / 1;
}
.step:nth-child(3n + 3) .step__media {
  aspect-ratio: 4 / 5;
}

.step {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  transition: transform var(--transition);
}
.step:hover {
  transform: translateY(-6px);
}

.step__media {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.step__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.step__num {
  position: absolute;
  top: 14px;
  left: 14px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--green-600);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.step__text {
  padding: 18px 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step h3 {
  font-size: 1.05rem;
  color: var(--green-700);
}

.step p {
  color: var(--ink);
  font-size: 0.82rem;
  line-height: 1.55;
}

@media (max-width: 1100px) {
  .steps {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 760px;
    margin: 0 auto;
  }
}

@media (max-width: 620px) {
  .steps {
    grid-template-columns: repeat(2, 1fr);
    max-width: 460px;
  }
}

@media (max-width: 420px) {
  .steps {
    grid-template-columns: 1fr;
    max-width: 320px;
  }
}

/* ================= TESTIMONIOS ================= */
.testimonials {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.testimonial {
  padding: 26px;
  border-radius: var(--radius-lg);
  background: var(--white);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform var(--transition), box-shadow var(--transition);
}
.testimonial:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}

.testimonial__stars {
  color: var(--warning);
  letter-spacing: 2px;
  font-size: 0.9rem;
}

.testimonial blockquote {
  color: var(--ink);
  font-size: 0.96rem;
  line-height: 1.65;
}

.testimonial figcaption {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}
.testimonial figcaption img {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
}
.testimonial figcaption div {
  display: flex;
  flex-direction: column;
}
.testimonial figcaption strong {
  font-size: 0.9rem;
  color: var(--ink);
}
.testimonial figcaption span {
  font-size: 0.8rem;
  color: var(--muted);
}

@media (max-width: 1000px) {
  .testimonials {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .testimonials {
    grid-template-columns: 1fr;
  }
}

/* ================= CTA ================= */
.cta {
  position: relative;
  padding: 90px 0;
  background:
    radial-gradient(700px 400px at 15% 120%, rgba(93, 170, 126, 0.35), transparent 60%),
    radial-gradient(640px 400px at 90% -20%, rgba(47, 107, 79, 0.4), transparent 55%),
    linear-gradient(135deg, var(--green-700), var(--green-800));
  overflow: hidden;
}

.cta__orb {
  position: absolute;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  top: -140px;
  right: -80px;
  background: var(--green-500);
  filter: blur(80px);
  opacity: 0.4;
}

.cta__inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
}

.cta h2 {
  font-family: var(--font-display);
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  color: var(--white);
}

.cta p {
  color: var(--green-200);
  max-width: 500px;
  font-size: 1.03rem;
}

.cta__btn {
  margin-top: 10px;
  padding: 15px 34px;
  border-radius: var(--radius-full);
  background: var(--white);
  color: var(--green-700);
  font-size: 1.02rem;
  font-weight: 700;
  box-shadow: var(--shadow);
  transition: transform var(--transition), box-shadow var(--transition);
}
.cta__btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Enlace a catálogo completo tras las ofertas destacadas */
.featured-more {
  display: flex;
  justify-content: center;
  margin-top: 36px;
}
.catalog-guest--landing {
  width: min(100vw - 32px, 1500px);
  max-width: none;
  margin: 0;
}
@media (max-width: 767px) {
  .catalog-guest--landing {
    width: 100%;
  }
}
.catalog-guest {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-radius: var(--radius);
  background: var(--green-900);
  color: var(--green-100);
  font-size: 0.92rem;
}
.catalog-guest__btn {
  padding: 9px 18px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--white);
  color: var(--green-900);
  font-weight: 700;
  font-size: 0.84rem;
  cursor: pointer;
  white-space: nowrap;
}
.featured-more__btn {
  padding: 12px 28px;
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--white);
  color: var(--ink);
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: border-color var(--transition), background var(--transition), transform var(--transition);
}
.featured-more__btn:hover {
  border-color: var(--green-500);
  background: var(--green-50);
  transform: translateY(-1px);
}

</style>