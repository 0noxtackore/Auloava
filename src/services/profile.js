// ============================================================
// AULOAVA · Servicio de perfil de usuario (nichos elegidos)
// Delega en la Netlify Function (agente) que usa Firebase admin.
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

export const profileService = {
  /** Lista de nichos disponibles (categorías de productos + nichos personalizados) */
  async listNiches() {
    const d = await call('list-niches')
    return d.niches || []
  },
  /** Crea un nicho nuevo y devuelve la lista actualizada */
  async createNiche(name) {
    const d = await call('create-niche', { name })
    return d.niches || []
  },
  /** Obtiene el perfil de un usuario (o null si no existe) */
  async get(uid) {
    const d = await call('get-profile', { uid })
    return d.profile || null
  },
  /** Guarda/crea el perfil con los nichos elegidos */
  async save(uid, email, niches) {
    const d = await call('save-profile', { uid, email, niches })
    return d.profile
  },
}
