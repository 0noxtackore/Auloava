<script setup>
// ============================================================
// EarningsMeter · Medidor de ganancias ESTIMADAS por AdSense
// + bloque de anuncio real (requiere cuenta de AdSense aprobada).
// La cifra es una estimación visual (no datos reales de AdSense).
// ============================================================
import { computed, onMounted, ref } from 'vue'

// RPM estimado: ganancia supuesta por cada 1.000 vistas.
// Ajusta este valor al CPM real de tu nicho/país.
const RPM = 1.0
const STORAGE_KEY = 'auloava_ad_views'

const views = ref(0)
const earnings = computed(() => (views.value * RPM) / 1000)
const nextDollarProgress = computed(() => (earnings.value % 1) * 100)

onMounted(() => {
  const stored = Number(localStorage.getItem(STORAGE_KEY) || 0)
  views.value = stored + 1
  localStorage.setItem(STORAGE_KEY, String(views.value))

  // Empuja el bloque de anuncio de AdSense (si el script está cargado)
  if (window.adsbygoogle) {
    window.adsbygoogle.push({})
  }
})
</script>

<template>
  <aside class="ads-meter" aria-label="AdSense">
    <div class="ads-meter__info" aria-hidden="true">
      <div class="ads-meter__head">
        <span class="ads-meter__badge">AdSense</span>
        <span class="ads-meter__label">Ganancia estimada</span>
      </div>

      <div class="ads-meter__amount">${{ earnings.toFixed(2) }}</div>

      <div class="ads-meter__bar">
        <span :style="{ width: nextDollarProgress + '%' }" />
      </div>

      <p class="ads-meter__hint">
        {{ views }} vista(s) · ~${{ RPM.toFixed(2) }} / 1.000 vistas (estimación)
      </p>
    </div>

    <div class="ads-meter__ad">
      <ins
        class="adsbygoogle"
        style="display: block; width: 100%"
        data-ad-client="ca-pub-0000000000000000"
        data-ad-slot="0000000000"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  </aside>
</template>

<style scoped>
.ads-meter {
  max-width: 420px;
  margin: 0 auto;
}

/* Medidor de ganancias oculto a los usuarios (solo tracking interno) */
.ads-meter__info {
  display: none;
}

.ads-meter__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ads-meter__badge {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: var(--green-600);
  color: var(--white);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.ads-meter__label {
  font-size: 0.82rem;
  color: var(--muted);
  font-weight: 600;
}

.ads-meter__amount {
  margin-top: 10px;
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 800;
  color: var(--green-700);
}

.ads-meter__bar {
  margin-top: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--green-100);
  overflow: hidden;
}
.ads-meter__bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--green-600), var(--green-400));
  transition: width 0.4s ease;
}

.ads-meter__hint {
  margin-top: 8px;
  font-size: 0.78rem;
  color: var(--muted);
}

.ads-meter__ad {
  margin-top: 14px;
  min-height: 100px;
  border-radius: var(--radius);
  background: var(--off-white);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
