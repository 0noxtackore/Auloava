// ============================================================
// AULOAVA · Productos (vía Agente / Firebase)
// El cliente delega en la Netlify Function (agente), que usa la
// cuenta de servicio (admin SDK) y persiste en Realtime Database.
// Sin localStorage ni mock: si Firebase no está disponible, el
// error se muestra en el formulario en vez de guardar en falso.
// Interfaz: getAll, getById, create, update, remove
// ============================================================
const AGENT_KEY = import.meta.env.VITE_AGENT_KEY || ''
const endpoint = `${import.meta.env.BASE_URL}.netlify/functions/agent`

async function call(action, body = {}) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-key': AGENT_KEY },
    body: JSON.stringify({ action, ...body }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Error del agente (${res.status})`)
  }
  return data
}

export const firebaseProducts = {
  async getAll() {
    const d = await call('list-products')
    return d.products || []
  },

  async getById(id) {
    const d = await call('get-product', { id })
    if (!d.product) throw new Error('Producto no encontrado')
    return d.product
  },

  async create(payload) {
    const d = await call('create-product', { product: payload })
    return d.product
  },

  async update(id, payload) {
    const d = await call('update-product', { id, product: payload })
    return d.product
  },

  async remove(id) {
    await call('delete-product', { id })
    return { ok: true }
  },
}
