<script setup>
// ============================================================
// SocialView · Generador de borradores para redes sociales
// Lee los productos de la BD y, con IA (OpenRouter), genera un
// borrador de post ORIGINAL (caption + hashtags) para TikTok o
// Pinterest. En Pinterest también sugiere tableros populares
// (según la categoría del producto) para copiar.
// ============================================================
import { computed, onMounted, reactive, ref } from 'vue'
import { useProductStore } from '@/store/products'
import { socialService } from '@/services/social'
import { optimizeProductImage } from '@/utils/images'

const store = useProductStore()
const query = ref('')
const copiedId = ref('')
const selectedPlatform = ref('tiktok') // 'tiktok' | 'pinterest'

const products = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = store.products
  if (!q) return list
  return list.filter(
    (p) =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q),
  )
})

// Estado por producto: { loading, draft, error, platform }
const drafts = reactive({})

onMounted(() => {
  if (!store.products.length) store.fetchProducts().catch(() => {})
})

async function generate(p) {
  const id = p.id
  drafts[id] = { loading: true, draft: '', error: '', platform: selectedPlatform.value }
  try {
    const draft = await socialService.generatePost(p, selectedPlatform.value)
    drafts[id] = { loading: false, draft, error: '', platform: selectedPlatform.value }
  } catch (e) {
    drafts[id] = {
      loading: false,
      draft: '',
      error: e?.message || 'No se pudo generar el borrador.',
      platform: selectedPlatform.value,
    }
  }
}

async function copy(id, text) {
  try {
    await navigator.clipboard.writeText(text)
    copiedId.value = id
    setTimeout(() => {
      if (copiedId.value === id) copiedId.value = ''
    }, 1500)
  } catch {
    /* el navegador bloqueó el portapapeles */
  }
}

// Tableros populares sugeridos para Pinterest según la categoría/producto.
// Pinterest no expone una API pública de "tableros por producto", así que
// inferimos los más probables a partir del texto del producto.
function suggestBoards(p) {
  const hay = `${p.category || ''} ${p.title || ''}`.toLowerCase()
  const boards = new Set()
  const add = (...names) => names.forEach((n) => boards.add(n))

  if (/uña|nail|manicura|gel|acrílic|acrilic|esmalte|tip|cutícula/.test(hay)) {
    add('Uñas de gel', 'Manicura y nail art', 'Ideas de uñas', 'Belleza')
  }
  if (/maquill|makeup|cosmetic|belleza|beauty|labial|rubor|base /.test(hay)) {
    add('Maquillaje', 'Belleza y cosmética', 'Tutoriales de maquillaje')
  }
  if (/cabello|hair|pelo|shampoo|cepillo/.test(hay)) {
    add('Cuidado del cabello', 'Peinados y trenzas')
  }
  if (/skin|piel|serum|crema|facial|hidrat|rutina/.test(hay)) {
    add('Cuidado de la piel', 'Rutina skincare')
  }
  if (/regalo|gift|detalle/.test(hay)) {
    add('Ideas de regalos', 'Regalos para ella')
  }
  if (/decor|home|hogar|house|cocina|kitchen|mesa|organiz/.test(hay)) {
    add('Decoración del hogar', 'Ideas para el hogar')
  }
  if (/tech|gadget|electron|auricular|cargador|smart/.test(hay)) {
    add('Tecnología y gadgets', 'Gadgets geniales')
  }
  if (/moda|ropa|fashion|outfit|vestir|zapat/.test(hay)) {
    add('Moda', 'Outfit ideas')
  }
  if (/fit|gym|deporte|sport|entren|pesa/.test(hay)) {
    add('Fitness', 'Rutina de ejercicio')
  }
  if (/bebé|baby|niño|kid|juguete|toy|infant/.test(hay)) {
    add('Para bebés', 'Juguetes')
  }
  if (boards.size === 0) add('Compras y afiliados', 'Productos recomendados', 'Belleza')

  return [...boards].slice(0, 5)
}
</script>

<template>
  <div class="social">
    <header class="social__head">
      <div class="social__tabs">
        <button
          type="button"
          class="social__tab"
          :class="{ 'social__tab--active': selectedPlatform === 'tiktok' }"
          @click="selectedPlatform = 'tiktok'"
        >
          TikTok
        </button>
        <button
          type="button"
          class="social__tab"
          :class="{ 'social__tab--active': selectedPlatform === 'pinterest' }"
          @click="selectedPlatform = 'pinterest'"
        >
          Pinterest
        </button>
      </div>

      <h1 class="social__title">Generador de borradores</h1>
      <p class="social__lead">
        Elige un producto y la IA crea un post original para
        <strong>{{ selectedPlatform === 'pinterest' ? 'Pinterest' : 'TikTok' }}</strong>
        (caption + hashtags). En Pinterest también verás tableros populares sugeridos
        para ese producto, listos para copiar.
      </p>

      <div class="social__controls">
        <input
          v-model="query"
          class="social__search"
          type="search"
          placeholder="Buscar producto o categoría…"
          aria-label="Buscar producto"
        />
      </div>
    </header>

    <div v-if="store.loading" class="social__loading">Cargando productos…</div>

    <div v-else class="social__grid">
      <article v-for="p in products" :key="p.id" class="social-card">
        <img
          class="social-card__img"
          :src="optimizeProductImage(p.image, 200)"
          :alt="p.title"
          loading="lazy"
          decoding="async"
        />
        <div class="social-card__body">
          <h3 class="social-card__title">{{ p.title }}</h3>
          <p class="social-card__cat">{{ p.category || 'Sin categoría' }}</p>

          <button
            class="social-card__btn"
            type="button"
            :disabled="drafts[p.id]?.loading"
            @click="generate(p)"
          >
            {{ drafts[p.id]?.loading ? 'Generando…' : 'Generar borrador' }}
          </button>

          <div v-if="drafts[p.id]?.error" class="social-card__error">
            {{ drafts[p.id].error }}
          </div>

          <div
            v-if="drafts[p.id]?.draft && drafts[p.id]?.platform === selectedPlatform"
            class="social-card__draft"
          >
            <pre class="social-card__text">{{ drafts[p.id].draft }}</pre>
            <button
              class="social-card__copy"
              type="button"
              @click="copy(p.id, drafts[p.id].draft)"
            >
              {{ copiedId === p.id ? '¡Copiado!' : 'Copiar descripción' }}
            </button>
          </div>

          <div
            v-if="selectedPlatform === 'pinterest'"
            class="social-card__boards"
          >
            <p class="social-card__boards-title">Tableros populares sugeridos:</p>
            <ul class="social-card__boards-list">
              <li v-for="b in suggestBoards(p)" :key="b">
                <span class="social-card__board-name">{{ b }}</span>
                <button
                  class="social-card__copy social-card__copy--sm"
                  type="button"
                  @click="copy(`${p.id}-${b}`, b)"
                >
                  {{ copiedId === `${p.id}-${b}` ? '¡Copiado!' : 'Copiar' }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.social {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 20px 64px;
}
.social__head {
  margin-bottom: 28px;
}
.social__tabs {
  display: inline-flex;
  gap: 6px;
  padding: 5px;
  border-radius: var(--radius-full);
  background: var(--green-100);
  margin-bottom: 16px;
}
.social__tab {
  padding: 7px 18px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--green-700);
  font-weight: 700;
  font-size: 0.84rem;
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}
.social__tab--active {
  background: var(--green-600);
  color: var(--white);
}
.social__title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3.4vw, 2.2rem);
  margin: 12px 0 6px;
  color: var(--ink);
}
.social__lead {
  color: var(--muted);
  max-width: 620px;
  line-height: 1.6;
}
.social__lead strong {
  color: var(--green-700);
}
.social__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
  align-items: flex-end;
}
.social__search {
  flex: 1;
  min-width: 220px;
  padding: 9px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--off-white);
  font-size: 0.92rem;
  color: var(--ink);
}
.social__loading {
  color: var(--muted);
  padding: 40px 0;
  text-align: center;
}
.social__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}
.social-card {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--white);
  display: flex;
  flex-direction: column;
}
.social-card__img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  background: var(--off-white);
}
.social-card__body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.social-card__title {
  font-size: 0.92rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.social-card__cat {
  font-size: 0.76rem;
  color: var(--muted);
}
.social-card__btn {
  margin-top: 4px;
  padding: 9px 14px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--green-600);
  color: var(--white);
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background var(--transition);
}
.social-card__btn:hover:not(:disabled) {
  background: var(--green-700);
}
.social-card__btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.social-card__error {
  font-size: 0.8rem;
  color: #c0392b;
}
.social-card__draft {
  margin-top: 4px;
  border: 1px dashed var(--green-500);
  border-radius: var(--radius);
  background: var(--green-50);
  padding: 10px;
}
.social-card__text {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--ink);
  margin: 0 0 8px;
}
.social-card__copy {
  padding: 6px 14px;
  border: 1px solid var(--green-600);
  border-radius: var(--radius-full);
  background: var(--white);
  color: var(--green-700);
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}
.social-card__copy--sm {
  padding: 4px 10px;
  font-size: 0.72rem;
}
.social-card__boards {
  margin-top: 6px;
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.social-card__boards-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--green-800);
  margin-bottom: 6px;
}
.social-card__boards-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.social-card__boards-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.social-card__board-name {
  font-size: 0.82rem;
  color: var(--ink);
}
</style>
