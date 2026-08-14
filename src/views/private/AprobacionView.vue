<script setup>
// ============================================================
// AprobacionView · Cola de borradores sociales (80% IA / 20% humano)
// La IA genera los borradores; tú apruebas o rechazas antes de publicar.
// ============================================================
import { onMounted, ref, computed } from 'vue'
import { socialDrafts } from '@/services/socialDraft'

const drafts = ref([])
const loading = ref(false)
const message = ref('')

const NETWORKS = {
  tiktok: { label: 'TikTok', color: '#ff0050' },
  reddit: { label: 'Reddit', color: '#ff4500' },
  facebook: { label: 'Facebook', color: '#1877f2' },
}

const pending = computed(() => drafts.value.filter((d) => d.status === 'pending'))

async function load() {
  loading.value = true
  try {
    drafts.value = await socialDrafts.getAll()
  } finally {
    loading.value = false
  }
}

async function approve(d) {
  await socialDrafts.setStatus(d.id, 'approved')
  message.value = `Borrador de ${NETWORKS[d.network]?.label || d.network} aprobado y en cola de publicación.`
  await load()
}

async function reject(d) {
  await socialDrafts.setStatus(d.id, 'rejected')
  message.value = 'Borrador rechazado.'
  await load()
}

onMounted(load)
</script>

<template>
  <div class="approve-page">
    <header class="approve-head">
      <h1>Aprobación de publicaciones</h1>
      <p>
        La IA redacta los borradores (80%). Tú apruebas (20%) antes de que se
        publiquen en TikTok, Reddit y Facebook.
      </p>
      <button class="approve-reload" type="button" :disabled="loading" @click="load">
        Recargar
      </button>
    </header>

    <p v-if="message" class="approve-msg">{{ message }}</p>

    <p v-if="!loading && !pending.length" class="approve-empty">
      No hay borradores pendientes. Cuando la IA genere publicaciones aparecerán aquí.
    </p>

    <ul v-else class="approve-list">
      <li v-for="d in pending" :key="d.id" class="approve-card">
        <span
          class="approve-net"
          :style="{ background: NETWORKS[d.network]?.color || '#888' }"
        >
          {{ NETWORKS[d.network]?.label || d.network }}
        </span>
        <p class="approve-copy">{{ d.copy }}</p>
        <div class="approve-actions">
          <button class="approve-btn approve-btn--ok" type="button" @click="approve(d)">
            Aprobar y publicar
          </button>
          <button class="approve-btn" type="button" @click="reject(d)">Rechazar</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.approve-page {
  max-width: 820px;
  margin: 0 auto;
  padding: 28px 18px 60px;
}
.approve-head h1 {
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: var(--ink);
}
.approve-head p {
  color: var(--muted);
  margin: 8px 0 14px;
}
.approve-reload {
  padding: 8px 16px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--line);
  background: var(--white);
  font-weight: 600;
  cursor: pointer;
}
.approve-msg {
  margin: 16px 0;
  padding: 12px 14px;
  border-radius: var(--radius);
  background: var(--green-50);
  color: var(--green-700);
}
.approve-empty {
  color: var(--muted);
  padding: 40px 0;
  text-align: center;
}
.approve-list {
  list-style: none;
  display: grid;
  gap: 14px;
  padding: 0;
}
.approve-card {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px;
  background: var(--white);
}
.approve-net {
  display: inline-block;
  color: #fff;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
}
.approve-copy {
  margin: 12px 0;
  white-space: pre-wrap;
  line-height: 1.5;
}
.approve-actions {
  display: flex;
  gap: 10px;
}
.approve-btn {
  padding: 9px 16px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--line);
  background: var(--white);
  font-weight: 600;
  cursor: pointer;
}
.approve-btn--ok {
  background: linear-gradient(135deg, var(--green-600), var(--green-700));
  color: #fff;
  border-color: transparent;
}
</style>
