<script setup>
// ============================================================
// ProductCard · Tarjeta tipo "Pin" de Pinterest
// Imagen destacada, overlay con botón Guardar al hacer hover,
// precio y título. Alturas variables para el efecto masonry.
// ============================================================
import { computed } from 'vue'
import { PLATFORMS } from '@/constants'
import { formatPrice, formatRating, formatPercent } from '@/utils/formatters'

const props = defineProps({
  product: { type: Object, required: true },
})

// Altura variable según el id del producto (efecto masonry)
const aspect = computed(() => {
  const hash = String(props.product.id)
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const ratios = ['pin--tall', 'pin--tall', 'pin--med', 'pin--med', 'pin--short', 'pin--short']
  return ratios[hash % ratios.length]
})

// Descuento respecto al precio original
const discount = computed(() => {
  const { price, originalPrice } = props.product
  if (!originalPrice || originalPrice <= price) return null
  return Math.round(((originalPrice - price) / originalPrice) * 100)
})

const platform = computed(() => PLATFORMS[props.product.platform])
</script>

<template>
  <article class="pin" :class="aspect" v-reveal>
    <a
      class="pin__media"
      :href="product.affiliateUrl"
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      <img
        class="pin__img"
        :src="product.image"
        :alt="product.title"
        loading="lazy"
      />

      <!-- Overlay al hacer hover -->
      <div class="pin__overlay">
        <span v-if="discount" class="pin__discount">-{{ discount }}%</span>
        <span class="pin__save">Guardar</span>
      </div>

      <span v-if="platform" class="pin__platform">{{ platform.name }}</span>
    </a>

    <div class="pin__body">
      <h3 class="pin__title">{{ product.title }}</h3>

      <div class="pin__meta">
        <span class="pin__publisher">
          <span
            class="pin__avatar"
            :style="{ background: platform?.color || '#888' }"
          >
            {{ product.platform[0].toUpperCase() }}
          </span>
          <span class="pin__rating">
            {{ formatRating(product.rating) }} ★
          </span>
        </span>

        <span class="pin__prices">
          <strong>{{ formatPrice(product.price) }}</strong>
          <del v-if="product.originalPrice">{{ formatPrice(product.originalPrice) }}</del>
        </span>
      </div>

      <span class="pin__commission">
        Comisión {{ formatPercent(product.commission) }} · {{ product.clicks.toLocaleString('es-ES') }} clicks
      </span>
    </div>
  </article>
</template>

<style scoped>
.pin {
  border-radius: var(--radius);
  transition: transform var(--transition);
}

.pin:hover {
  transform: scale(1.02);
}

/* Distintas alturas para el efecto masonry */
.pin--tall .pin__media {
  aspect-ratio: 3 / 4.2;
}
.pin--med .pin__media {
  aspect-ratio: 1 / 1.15;
}
.pin--short .pin__media {
  aspect-ratio: 16 / 11;
}

.pin__media {
  position: relative;
  display: block;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--off-white);
}

.pin__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.pin:hover .pin__img {
  transform: scale(1.03);
}

/* Overlay de hover */
.pin__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px;
  background: rgba(0, 0, 0, 0.22);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.pin:hover .pin__overlay {
  opacity: 1;
}

.pin__save {
  padding: 10px 18px;
  border-radius: var(--radius-full);
  background: var(--green-600);
  color: var(--white);
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: var(--shadow);
  transform: translateY(-6px);
  transition: transform 0.2s ease, background 0.2s ease;
}

.pin:hover .pin__save {
  transform: translateY(0);
}

.pin__save:hover {
  background: var(--green-700);
}

.pin__discount {
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: var(--white);
  color: var(--green-600);
  font-size: 0.78rem;
  font-weight: 700;
}

.pin__platform {
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.92);
  color: var(--ink);
  font-size: 0.72rem;
  font-weight: 600;
}

.pin__body {
  padding: 12px 6px 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pin__title {
  font-family: var(--font-sans);
  font-size: 0.92rem;
  font-weight: 400;
  line-height: 1.4;
  color: var(--ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pin__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pin__publisher {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.pin__avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: var(--white);
  font-size: 0.78rem;
  font-weight: 700;
  flex-shrink: 0;
}

.pin__rating {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink);
}

.pin__prices {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-shrink: 0;
}

.pin__prices strong {
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--ink);
}

.pin__prices del {
  font-size: 0.78rem;
  color: var(--muted);
}

.pin__commission {
  font-size: 0.78rem;
  color: var(--muted);
}

@media (max-width: 480px) {
  .pin__meta {
    flex-wrap: wrap;
    gap: 6px;
  }
  .pin__prices {
    width: 100%;
    justify-content: flex-start;
  }
  .pin__avatar {
    width: 26px;
    height: 26px;
    font-size: 0.7rem;
  }
  .pin__rating {
    font-size: 0.76rem;
  }
  .pin__commission {
    font-size: 0.72rem;
  }
}
</style>
