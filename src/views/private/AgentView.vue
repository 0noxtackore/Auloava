<script setup>
// ============================================================
// AgentView · Sección del agente de AliExpress (área de admin)
// El navegador solo dispara la Netlify Function; las credenciales
// de AliExpress viven en el servidor (variables de entorno).
// ============================================================
import { ref } from 'vue'

const AGENT_KEY = import.meta.env.VITE_AGENT_KEY || ''
const endpoint = `${import.meta.env.BASE_URL}.netlify/functions/agent`

const loading = ref(false)
const status = ref(null) // { ok, ... }
const message = ref('')

async function callAgent(action) {
  loading.value = true
  status.value = null
  message.value = ''
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-agent-key': AGENT_KEY,
      },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    status.value = data
    if (!res.ok) {
      const diag = data?.diagnostic
      if (diag) {
        message.value =
          `No autorizado. ` +
          `Servidor tiene AGENT_API_KEY: ${diag.agentKeySet ? 'sí' : 'NO'}. ` +
          `Cliente envió clave: ${diag.keyProvided ? 'sí' : 'NO'}. ` +
          `Vars AGENT* presentes en el servidor: [${diag.envAgentKeys?.join(', ') || 'ninguna'}]. ` +
          `Define AGENT_API_KEY y VITE_AGENT_KEY (mismo valor) en Netlify, asegúrate de que AGENT_API_KEY tiene alcance a Functions, y reconstruye.`
      } else {
        message.value = data.error || 'Error del agente'
      }
    } else if (action === 'import-products') {
      message.value = data.ok
        ? `Importados ${data.count} productos. ${data.saved ? 'Guardados en el catálogo real (Firebase).' : 'No se guardaron: falta FIREBASE_SERVICE_ACCOUNT en el servidor.'}`
        : data.error || 'Error al importar productos.'
    } else if (action === 'generate') {
      message.value = data.ok
        ? `Generados ${data.created} borradores (80% IA). Revísalos en "Aprobación" antes de publicar.`
        : data.error || 'Error al generar borradores.'
    } else {
      message.value =
        `Clave agente: ${data.agentKeySet ? 'sí' : 'NO'} · ` +
        `AliExpress API: ${data.aliExpress?.api ? 'sí' : 'NO'} (tracking: ${data.aliExpress?.trackingId || '—'}) · ` +
        `Amazon PA-API: ${data.amazon?.config ? 'sí' : 'NO'} (tag: ${data.amazon?.partnerTag || '—'}) · ` +
        `Firebase: ${data.firebase ? 'sí' : 'NO'} · ` +
        `IA: ${data.aiConfigured ? 'sí' : 'NO'}.`
    }
  } catch (err) {
    message.value = err?.message || 'No se pudo contactar con el agente'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="agent">
    <header class="agent__head">
      <h1 class="agent__title">Agente de AliExpress</h1>
      <p class="agent__lead">
        Ejecuta tareas automatizadas contra tu cuenta de AliExpress. Las credenciales
        se guardan solo en el servidor y nunca se envían al navegador.
      </p>
    </header>

    <div class="agent__actions">
      <button class="agent__btn" type="button" :disabled="loading" @click="callAgent('ping')">
        Comprobar configuración
      </button>
      <button class="agent__btn agent__btn--primary" type="button" :disabled="loading" @click="callAgent('import-products')">
        {{ loading ? 'Importando…' : 'Importar productos reales' }}
      </button>
      <button class="agent__btn" type="button" :disabled="loading" @click="callAgent('generate')">
        {{ loading ? 'Generando…' : 'Generar borradores IA' }}
      </button>
    </div>

    <Transition name="fade">
      <p v-if="message" class="agent__msg" :class="{ 'agent__msg--ok': status && status.ok, 'agent__msg--err': !status || !status.ok }">
        {{ message }}
      </p>
    </Transition>

    <Transition name="fade">
      <ul v-if="status && status.sample" class="agent__sample">
        <li v-for="(s, i) in status.sample" :key="i">
          <span>{{ s.title }}</span>
          <a :href="s.affiliateUrl" target="_blank" rel="noopener">ver enlace</a>
        </li>
      </ul>
    </Transition>

    <p class="agent__hint">
      Más acciones del agente se añadirán según lo que definas a continuación.
    </p>
  </section>
</template>

<style scoped>
.agent {
  max-width: 680px;
}
.agent__head {
  margin-bottom: 24px;
}
.agent__title {
  font-size: 1.6rem;
  margin: 0 0 8px;
  color: var(--green-900);
}
.agent__lead {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}
.agent__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}
.agent__btn {
  padding: 12px 18px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--white);
  color: var(--green-900);
  font-weight: 600;
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition);
}
.agent__btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.agent__btn:disabled {
  opacity: 0.7;
  cursor: default;
}
.agent__btn--primary {
  background: linear-gradient(135deg, var(--green-600), var(--green-700));
  color: var(--white);
  border-color: transparent;
}
.agent__msg {
  padding: 12px 14px;
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-weight: 500;
}
.agent__msg--ok {
  color: var(--green-700);
  background: var(--green-50);
}
.agent__msg--err {
  color: var(--danger);
  background: rgba(220, 53, 69, 0.08);
}
.agent__hint {
  margin-top: 14px;
  font-size: 0.82rem;
  color: var(--muted);
}
.agent__sample {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.agent__sample li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: var(--off-white);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  font-size: 0.85rem;
}
.agent__sample a {
  color: var(--green-700);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
