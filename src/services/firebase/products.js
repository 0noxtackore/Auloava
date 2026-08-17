// ============================================================
// AULOAVA · Productos (vía Agente / Firebase)
// El cliente delega en la Netlify Function (agente), que usa la
// cuenta de servicio (admin SDK) y persiste en Realtime Database
// sin depender de reglas ni de auth del cliente.
// Si el agente/Firebase no está disponible, cae a localStorage
// (mock) para no romper el sitio.
// Interfaz: getAll, getById, create, update, remove
// ============================================================
import { productHandlers } from '../mock'

const AGENT_KEY = import.meta.env.VITE_AGENT_KEY || ''
const endpoint = `${import.meta.env.BASE_URL}.netlify/functions/agent`

let warned = false
function warnFallback() {
  if (!warned) {
    warned = true
    console.warn('[Auloava] Firebase/agente no disponible: usando almacenamiento local (no es BD compartida).')
  }
}

async function call(action, body = {}) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-key': AGENT_KEY },
    body: JSON.stringify({ action, ...body }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.ok) throw new Error(data.error || 'Error del agente')
  return data
}

export const firebaseProducts = {
  async getAll() {
    try {
      const d = await call('list-products')
      return d.products || []
    } catch {
      warnFallback()
      return productHandlers.list()
    }
  },

  async getById(id) {
    try {
      const d = await call('get-product', { id })
      if (d.product) return d.product
      throw new Error('missing')
    } catch {
      warnFallback()
      return productHandlers.get(id)
    }
  },

  async create(payload) {
    try {
      const d = await call('create-product', { product: payload })
      return d.product
    } catch {
      warnFallback()
      return productHandlers.create(payload)
    }
  },

  async update(id, payload) {
    try {
      const d = await call('update-product', { id, product: payload })
      return d.product
    } catch {
      warnFallback()
      return productHandlers.update(id, payload)
    }
  },

  async remove(id) {
    try {
      await call('delete-product', { id })
      return { ok: true }
    } catch {
      warnFallback()
      return productHandlers.remove(id)
    }
  },
}
