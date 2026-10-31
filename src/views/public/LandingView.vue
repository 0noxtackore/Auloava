<script setup>
// ============================================================
// LandingView · Home & Living
// Diseño editorial: verde bosque + blanco, tipografía serif,
// composición limpia y mucho aire. Nicho: hogar y decoración.
// ============================================================
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/store/products'
import { useProductSuggestions } from '@/composables/useProductSuggestions'
import { auth, authReady } from '@/services/auth'
import { landingData } from '@/services/mock'
import { CATEGORIES } from '@/constants'
import { decodeHtml } from '@/utils/formatters'
import ProductCard from '@/components/product/ProductCard.vue'
import TheFooter from '@/components/layout/TheFooter.vue'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import EarningsMeter from '@/components/layout/EarningsMeter.vue'

const router = useRouter()
const productStore = useProductStore()

/* ---------- Destacados ---------- */
const featured = computed(() => {
  const arr = [...productStore.products]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, 8)
})

/* ---------- Búsqueda del hero ---------- */
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

const goToCategory = (category) => {
  router.push({ name: 'catalog', query: { category } })
}

/* ---------- Iconos de categoría (trazo) ---------- */
const categoryIcons = {
  Decoración: 'M4 4h16v12H4zM2 20h20M8 8h8M8 12h5',
  'Tapetes y alfombras': 'M5 4h14v16H5zM8 4v16M16 4v16M5 8h14M5 16h14',
  Mobiliario: 'M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M4 11h16v5H4zM7 16v3M17 16v3',
  Organización: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  Cocina: 'M6 3v7a2 2 0 0 0 4 0V3M8 3v18M17 3c-1.5 2-2 4-2 6a2 2 0 0 0 2 2h2V3z',
  'Textiles del hogar': 'M3 7c3-2 6 2 9 0s6-2 9 0M3 12c3-2 6 2 9 0s6-2 9 0M3 17c3-2 6 2 9 0s6-2 9 0',
  Iluminación: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z',
}

/* ---------- Ventajas ---------- */
const features = [
  {
    title: 'Curado a mano',
    text: 'Cada pieza se revisa antes de entrar en la colección. Nada de ruido: solo cosas que quedan bien en casa.',
  },
  {
    title: 'Por ambiente',
    text: 'Organizado por espacios reales: salón, dormitorio, cocina, recibidor. Encuentra lo que necesitas sin perderte.',
  },
  {
    title: 'Precios claros',
    text: 'Sin comisiones ocultas ni letra pequeña. Lo que ves es lo que pagas por una pieza que dura.',
  },
  {
    title: 'Siempre al día',
    text: 'La colección evoluciona con cada temporada y con las piezas que de verdad merecen la pena.',
  },
]

/* ---------- Pasos ---------- */
const steps = [
  {
    title: 'Explora',
    text: 'Recorre la colección por ambiente y descubre piezas pensadas para dar carácter a tu hogar.',
  },
  {
    title: 'Selecciona',
    text: 'Guarda tus favoritas y compara con calma. Cada producto está descrito con honestidad.',
  },
  {
    title: 'Transforma',
    text: 'Recibe tu pieza y dale a tu casa ese detalle que lo cambia todo. Así de simple.',
  },
]

const testimonials = computed(() => landingData.testimonials.slice(0, 3))

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
      <!-- ================= HERO ================= -->
      <section class="hero">
        <div class="hero__bg" aria-hidden="true">
          <span class="hero__grid" />
          <span class="hero__orb hero__orb--a" />
          <span class="hero__orb hero__orb--b" />
        </div>

        <div class="container hero__inner">
          <div class="hero__copy" v-reveal>
            <span class="eyebrow">
              <span class="eyebrow__dot" />
              Home &amp; Living · Curado a mano
            </span>

            <h1 class="hero__title">
              Todo lo que hace de una casa
              <em>un hogar</em>.
            </h1>

            <p class="hero__lead">
              Decoración, mobiliario, textiles, iluminación y más. Una selección
              cuidada de piezas que aportan calidez, orden y carácter a cada rincón.
            </p>

            <form class="hero__search" @submit.prevent="goToCatalog">
              <svg class="hero__search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <div class="hero__search-box">
                <input
                  type="text"
                  v-model="heroSearch"
                  @focus="heroOpen = true"
                  @blur="onHeroBlur"
                  placeholder="Busca una lámpara, un tapete, una silla…"
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

            <ul class="hero__trust">
              <li><strong>7</strong><span>categorías</span></li>
              <li><strong>100%</strong><span>curado</span></li>
              <li><strong>0</strong><span>comisiones ocultas</span></li>
            </ul>
          </div>

          <div class="hero__visual" aria-hidden="true">
            <div class="collage">
              <article class="collage__card collage__card--main">
                <span class="collage__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" />
                  </svg>
                </span>
                <span class="collage__label">Iluminación</span>
                <span class="collage__meta">Luz cálida para cada espacio</span>
              </article>

              <article class="collage__card collage__card--a">
                <span class="collage__icon collage__icon--soft">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16v12H4zM2 20h20M8 8h8M8 12h5" />
                  </svg>
                </span>
                <span class="collage__label">Decoración</span>
              </article>

              <article class="collage__card collage__card--b">
                <span class="collage__icon collage__icon--cream">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 7c3-2 6 2 9 0s6-2 9 0M3 12c3-2 6 2 9 0s6-2 9 0M3 17c3-2 6 2 9 0s6-2 9 0" />
                  </svg>
                </span>
                <span class="collage__label">Textiles</span>
              </article>

              <span class="collage__seal">Auloava</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= CATEGORÍAS ================= -->
      <section id="nav" class="categories">
        <div class="container">
          <div class="section-head" v-reveal>
            <span class="section-head__eyebrow">Explora por ambiente</span>
            <h2 class="section-head__title">Siete formas de sentirte en casa</h2>
            <p class="section-head__lead">
              Cada rincón tiene su propia personalidad. Encuentra la pieza que lo completa.
            </p>
          </div>

          <div class="category-grid">
            <button
              v-for="(category, index) in CATEGORIES"
              :key="category"
              type="button"
              class="category-card"
              :style="{ transitionDelay: `${index * 40}ms` }"
              @click="goToCategory(category)"
            >
              <span class="category-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path :d="categoryIcons[category]" />
                </svg>
              </span>
              <span class="category-card__name">{{ category }}</span>
              <span class="category-card__arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================= DESTACADOS ================= -->
      <section id="featured" class="featured">
        <div class="container">
          <div class="section-head section-head--row" v-reveal>
            <div>
              <span class="section-head__eyebrow">Selección</span>
              <h2 class="section-head__title">Piezas destacadas</h2>
            </div>
            <button class="section-head__link" type="button" @click="goToCatalog">
              Ver catálogo completo <span aria-hidden="true">→</span>
            </button>
          </div>

          <div v-if="productStore.loading" class="skeleton-grid">
            <div v-for="n in 8" :key="n" class="skeleton pin-skeleton" :style="{ aspectRatio: n % 3 === 0 ? '3/4' : n % 3 === 1 ? '1/1' : '4/3' }" />
          </div>

          <div v-else-if="!featured.length" class="empty" v-reveal>
            <span class="empty__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
              </svg>
            </span>
            <h3 class="empty__title">Estamos preparando la colección</h3>
            <p class="empty__text">
              Muy pronto encontrarás aquí piezas seleccionadas para tu hogar:
              decoración, mobiliario, textiles e iluminación con carácter.
            </p>
            <button class="btn btn--primary" type="button" @click="goToCatalog">
              Explorar catálogo
            </button>
          </div>

          <div v-else class="pin-grid">
            <ProductCard v-for="product in featured" :key="product.id" :product="product" />
          </div>

          <div v-if="featured.length" class="featured__more">
            <button v-if="isGuest" type="button" class="btn btn--ghost" @click="goToCatalog">
              Ver catálogo completo
            </button>
            <RouterLink v-else :to="{ name: 'catalog' }" class="btn btn--ghost">
              Ver catálogo completo ({{ productStore.products.length }} piezas)
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- ================= POR QUÉ AULOAVA ================= -->
      <section id="about" class="why">
        <div class="container">
          <div class="why__head" v-reveal>
            <span class="section-head__eyebrow section-head__eyebrow--light">Por qué Auloava</span>
            <h2 class="why__title">Menos ruido. Más hogar.</h2>
            <p class="why__lead">
              No somos un escaparate infinito. Somos una selección pequeña, pensada
              y revisada para que elegir sea fácil y bonito.
            </p>
          </div>

          <div class="why__grid">
            <article
              v-for="(feature, index) in features"
              :key="feature.title"
              class="why-card"
              v-reveal
              :style="{ transitionDelay: `${index * 60}ms` }"
            >
              <span class="why-card__num">0{{ index + 1 }}</span>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.text }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- ================= CÓMO FUNCIONA ================= -->
      <section id="how" class="how">
        <div class="container">
          <div class="section-head" v-reveal>
            <span class="section-head__eyebrow">Fácil</span>
            <h2 class="section-head__title">Tres pasos hasta tu nuevo rincón</h2>
          </div>

          <ol class="steps">
            <li
              v-for="(step, index) in steps"
              :key="step.title"
              class="step"
              v-reveal
              :style="{ transitionDelay: `${index * 80}ms` }"
            >
              <span class="step__num">{{ index + 1 }}</span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.text }}</p>
            </li>
          </ol>
        </div>
      </section>

      <!-- ================= OPINIONES ================= -->
      <section id="press" class="testimonials-section">
        <div class="container">
          <div class="section-head" v-reveal>
            <span class="section-head__eyebrow">Opiniones</span>
            <h2 class="section-head__title">Hogares que ya han cambiado</h2>
          </div>

          <div class="testimonials">
            <figure v-for="t in testimonials" :key="t.name" class="testimonial" v-reveal>
              <span class="testimonial__quote" aria-hidden="true">“</span>
              <blockquote>{{ t.text }}</blockquote>
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

      <!-- ================= CTA ================= -->
      <section class="cta">
        <span class="cta__orb" aria-hidden="true" />
        <div class="container cta__inner" v-reveal>
          <h2>Tu casa, un poco más tuya.</h2>
          <p>
            Descubre la colección Home &amp; Living y encuentra esa pieza que
            hace que todo encaje.
          </p>
          <button class="btn btn--light" type="button" @click="goToCatalog">
            Explorar catálogo
          </button>
        </div>
      </section>

      <EarningsMeter />
    </main>

    <TheFooter />
  </div>
</template>

<style scoped>
.landing {
  background: var(--white);
}

/* ================= Botones ================= */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 30px;
  border-radius: var(--radius-full);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition),
    background var(--transition), color var(--transition);
}
.btn--primary {
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: var(--white);
  box-shadow: 0 12px 26px rgba(29, 107, 63, 0.26);
}
.btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px rgba(29, 107, 63, 0.34);
}
.btn--ghost {
  background: transparent;
  color: var(--green-700);
  border: 1.5px solid var(--green-200);
}
.btn--ghost:hover {
  background: var(--green-50);
  border-color: var(--green-400);
  transform: translateY(-1px);
}
.btn--light {
  background: var(--white);
  color: var(--green-700);
  box-shadow: var(--shadow);
}
.btn--light:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* ================= Eyebrow / section heads ================= */
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 8px 16px;
  border-radius: var(--radius-full);
  background: var(--white);
  border: 1px solid var(--green-200);
  color: var(--green-700);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: var(--shadow-sm);
}
.eyebrow__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green-500);
  animation: pulse-dot 1.8s infinite;
}

.section-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  margin-bottom: 52px;
}
.section-head--row {
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  text-align: left;
  gap: 24px;
}
.section-head--row > div {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-head__eyebrow {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--green-600);
}
.section-head__eyebrow--light {
  color: var(--green-300);
}
.section-head__title {
  font-family: var(--font-display);
  font-size: clamp(1.9rem, 3.8vw, 2.8rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--ink);
}
.section-head__lead {
  max-width: 540px;
  color: var(--muted);
  font-size: 1.02rem;
}
.section-head__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
  border-bottom: 1.5px solid var(--green-300);
  color: var(--green-700);
  font-size: 0.92rem;
  font-weight: 700;
  white-space: nowrap;
  transition: gap var(--transition), border-color var(--transition);
}
.section-head__link:hover {
  gap: 14px;
  border-color: var(--green-600);
}

/* ================= HERO ================= */
.hero {
  position: relative;
  overflow: hidden;
  padding: 128px 0 100px;
  background:
    radial-gradient(60% 70% at 90% 0%, rgba(46, 138, 87, 0.14), transparent 60%),
    radial-gradient(55% 60% at 0% 100%, rgba(142, 207, 168, 0.2), transparent 60%),
    linear-gradient(170deg, var(--green-50) 0%, var(--white) 62%, var(--cream) 100%);
}
.hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hero__grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(29, 107, 63, 0.14) 1.4px, transparent 1.4px);
  background-size: 30px 30px;
  -webkit-mask-image: radial-gradient(ellipse 55% 60% at 50% 40%, #000 0%, transparent 76%);
  mask-image: radial-gradient(ellipse 55% 60% at 50% 40%, #000 0%, transparent 76%);
}
.hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(10px);
}
.hero__orb--a {
  width: 380px;
  height: 380px;
  top: -140px;
  right: -80px;
  background: radial-gradient(circle at 35% 35%, rgba(87, 171, 120, 0.34), transparent 68%);
}
.hero__orb--b {
  width: 420px;
  height: 420px;
  bottom: -200px;
  left: -120px;
  background: radial-gradient(circle at 60% 40%, rgba(196, 232, 211, 0.5), transparent 70%);
}

.hero__inner {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1.04fr 0.96fr;
  align-items: center;
  gap: 64px;
}

.hero__copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  max-width: 620px;
}

.hero__title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5.4vw, 4.15rem);
  font-weight: 600;
  line-height: 1.02;
  letter-spacing: -0.025em;
  color: var(--ink);
}
.hero__title em {
  font-style: italic;
  color: var(--green-600);
  white-space: nowrap;
}

.hero__lead {
  max-width: 520px;
  color: var(--muted);
  font-size: 1.1rem;
  line-height: 1.7;
}

.hero__search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(560px, 100%);
  padding: 8px 8px 8px 20px;
  border-radius: var(--radius-full);
  background: var(--white);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  transition: box-shadow var(--transition), border-color var(--transition);
}
.hero__search:focus-within {
  border-color: var(--green-300);
  box-shadow: 0 12px 30px rgba(12, 36, 24, 0.12);
}
.hero__search-icon {
  flex-shrink: 0;
  color: var(--muted);
}
.hero__search-box {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
}
.hero__search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.98rem;
  color: var(--ink);
}
.hero__search input::placeholder {
  color: var(--muted);
}
.hero__search button {
  flex-shrink: 0;
  padding: 12px 26px;
  border-radius: var(--radius-full);
  background: var(--green-600);
  color: var(--white);
  font-weight: 700;
  font-size: 0.92rem;
  transition: background var(--transition), transform var(--transition);
}
.hero__search button:hover {
  background: var(--green-700);
  transform: translateY(-1px);
}

.hero__suggestions {
  position: absolute;
  top: calc(100% + 12px);
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
  padding: 10px 12px;
  border-radius: var(--radius-sm);
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

.hero__trust {
  display: flex;
  flex-wrap: wrap;
  gap: 34px;
  margin-top: 6px;
}
.hero__trust li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 16px;
  border-left: 2px solid var(--green-200);
}
.hero__trust strong {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--green-700);
  line-height: 1;
}
.hero__trust span {
  font-size: 0.82rem;
  color: var(--muted);
}

/* ---------- Collage del hero ---------- */
.hero__visual {
  position: relative;
  min-height: 480px;
}
.collage {
  position: absolute;
  inset: 0;
}
.collage__card {
  position: absolute;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-lg);
}
.collage__card--main {
  top: 6%;
  left: 12%;
  right: 0;
  bottom: 20%;
  justify-content: flex-end;
  gap: 8px;
  background: linear-gradient(150deg, var(--green-700) 0%, var(--green-500) 100%);
  color: var(--white);
  animation: float 8s ease-in-out infinite;
}
.collage__card--a {
  left: 0;
  bottom: 2%;
  width: 48%;
  height: 32%;
  justify-content: flex-end;
  gap: 6px;
  background: var(--white);
  border: 1px solid var(--line);
  animation: float 10s ease-in-out infinite reverse;
}
.collage__card--b {
  right: 2%;
  top: 0;
  width: 44%;
  height: 26%;
  justify-content: flex-end;
  gap: 6px;
  background: var(--cream);
  border: 1px solid var(--sand);
  animation: float 9s ease-in-out infinite;
}
.collage__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: auto;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.16);
  color: var(--white);
}
.collage__icon svg {
  width: 28px;
  height: 28px;
}
.collage__icon--soft {
  background: var(--green-100);
  color: var(--green-600);
}
.collage__icon--cream {
  background: var(--white);
  color: var(--green-700);
}
.collage__label {
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 600;
  line-height: 1.1;
}
.collage__card--a .collage__label,
.collage__card--b .collage__label {
  font-size: 1.15rem;
  color: var(--ink);
}
.collage__meta {
  font-size: 0.82rem;
  color: var(--green-200);
}
.collage__seal {
  position: absolute;
  right: 6%;
  bottom: 8%;
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: var(--white);
  color: var(--green-700);
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  font-style: italic;
  box-shadow: var(--shadow);
  border: 1px solid var(--green-100);
}

/* ================= CATEGORÍAS ================= */
.categories {
  padding: 96px 0;
  background: var(--white);
}
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.category-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: var(--radius);
  background: var(--white);
  border: 1px solid var(--line);
  text-align: left;
  transition: transform var(--transition), box-shadow var(--transition),
    border-color var(--transition), background var(--transition);
}
.category-card:hover {
  transform: translateY(-4px);
  border-color: var(--green-300);
  background: var(--green-50);
  box-shadow: var(--shadow);
}
.category-card__icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 13px;
  background: var(--green-100);
  color: var(--green-600);
  transition: background var(--transition), color var(--transition);
}
.category-card:hover .category-card__icon {
  background: var(--green-600);
  color: var(--white);
}
.category-card__icon svg {
  width: 24px;
  height: 24px;
}
.category-card__name {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ink);
}
.category-card__arrow {
  color: var(--green-400);
  font-size: 1.05rem;
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity var(--transition), transform var(--transition);
}
.category-card:hover .category-card__arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ================= DESTACADOS ================= */
.featured {
  padding: 96px 0;
  background: var(--off-white);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
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

/* Estado vacío */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  max-width: 560px;
  margin: 0 auto;
  padding: 56px 32px;
  border-radius: var(--radius-lg);
  background: var(--white);
  border: 1.5px dashed var(--green-200);
}
.empty__icon {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--green-100);
  color: var(--green-600);
}
.empty__icon svg {
  width: 34px;
  height: 34px;
}
.empty__title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ink);
}
.empty__text {
  color: var(--muted);
  line-height: 1.7;
  max-width: 440px;
}
.empty .btn {
  margin-top: 8px;
}

.featured__more {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

/* ================= POR QUÉ (banda verde) ================= */
.why {
  position: relative;
  padding: 100px 0;
  background:
    radial-gradient(60% 70% at 100% 0%, rgba(87, 171, 120, 0.28), transparent 60%),
    radial-gradient(50% 60% at 0% 100%, rgba(46, 138, 87, 0.22), transparent 60%),
    var(--green-800);
  color: var(--green-100);
  overflow: hidden;
}
.why__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  margin-bottom: 52px;
}
.why__title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.9rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--white);
}
.why__lead {
  max-width: 560px;
  color: var(--green-200);
  font-size: 1.02rem;
  line-height: 1.7;
}
.why__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}
.why-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 28px 24px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: transform var(--transition), background var(--transition);
}
.why-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.1);
}
.why-card__num {
  font-family: var(--font-display);
  font-size: 1.9rem;
  font-weight: 600;
  color: var(--green-300);
  line-height: 1;
  margin-bottom: 8px;
}
.why-card h3 {
  font-family: var(--font-sans);
  font-size: 1.08rem;
  font-weight: 700;
  color: var(--white);
}
.why-card p {
  font-size: 0.92rem;
  line-height: 1.65;
  color: var(--green-200);
}

/* ================= CÓMO FUNCIONA ================= */
.how {
  padding: 96px 0;
  background: var(--white);
}
.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  counter-reset: step;
}
.step {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 32px 28px;
  border-radius: var(--radius-lg);
  background: var(--green-50);
  border: 1px solid var(--green-100);
  transition: transform var(--transition), box-shadow var(--transition);
}
.step:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}
.step__num {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 6px;
  border-radius: 50%;
  background: var(--green-600);
  color: var(--white);
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 600;
}
.step h3 {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--ink);
}
.step p {
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.7;
}

/* ================= OPINIONES ================= */
.testimonials-section {
  padding: 96px 0;
  background: var(--off-white);
  border-top: 1px solid var(--line);
}
.testimonials {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.testimonial {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 32px 28px;
  border-radius: var(--radius-lg);
  background: var(--white);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition);
}
.testimonial:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}
.testimonial__quote {
  font-family: var(--font-display);
  font-size: 3rem;
  line-height: 0.6;
  color: var(--green-300);
}
.testimonial blockquote {
  color: var(--ink);
  font-size: 1rem;
  line-height: 1.7;
}
.testimonial figcaption {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.testimonial figcaption img {
  width: 44px;
  height: 44px;
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

/* ================= CTA ================= */
.cta {
  position: relative;
  overflow: hidden;
  padding: 100px 0;
  background:
    radial-gradient(60% 80% at 15% 120%, rgba(87, 171, 120, 0.4), transparent 60%),
    radial-gradient(55% 70% at 90% -20%, rgba(46, 138, 87, 0.5), transparent 55%),
    linear-gradient(135deg, var(--green-700), var(--green-900));
}
.cta__orb {
  position: absolute;
  top: -140px;
  right: -80px;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: var(--green-500);
  filter: blur(90px);
  opacity: 0.4;
}
.cta__inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 18px;
}
.cta h2 {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4.4vw, 3rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--white);
}
.cta p {
  max-width: 500px;
  color: var(--green-200);
  font-size: 1.05rem;
  line-height: 1.7;
}
.cta .btn {
  margin-top: 8px;
}

/* ================= Responsive ================= */
@media (max-width: 1080px) {
  .hero__inner {
    grid-template-columns: 1fr;
    gap: 48px;
  }
  .hero__copy {
    max-width: 720px;
  }
  .hero__visual {
    min-height: 420px;
    max-width: 520px;
    width: 100%;
    margin: 0 auto;
  }
  .why__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .steps {
    grid-template-columns: 1fr;
    max-width: 560px;
    margin: 0 auto;
  }
  .testimonials {
    grid-template-columns: 1fr;
    max-width: 560px;
    margin: 0 auto;
  }
}

@media (max-width: 720px) {
  .hero {
    padding: 108px 0 72px;
  }
  .categories,
  .featured,
  .how,
  .testimonials-section {
    padding: 64px 0;
  }
  .why,
  .cta {
    padding: 72px 0;
  }
  .section-head {
    margin-bottom: 36px;
  }
  .section-head--row {
    flex-direction: column;
    align-items: flex-start;
  }
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .why__grid {
    grid-template-columns: 1fr;
  }
  .hero__visual {
    min-height: 360px;
  }
  .collage__card--main {
    left: 8%;
  }
}

@media (max-width: 540px) {
  .hero__search {
    flex-wrap: wrap;
    border-radius: var(--radius-lg);
    padding: 14px;
  }
  .hero__search input {
    width: 100%;
    padding: 4px 2px 10px;
  }
  .hero__search button {
    width: 100%;
  }
  .hero__trust {
    gap: 22px;
  }
  .category-grid {
    grid-template-columns: 1fr;
  }
  .collage__card {
    padding: 18px;
  }
  .collage__label {
    font-size: 1.2rem;
  }
  .collage__seal {
    width: 60px;
    height: 60px;
    font-size: 0.78rem;
  }
}
</style>
