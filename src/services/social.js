// ============================================================
// AULOAVA · Servicio de generación de contenido para redes
// Delega en la Netlify Function (agente) que usa OpenRouter (IA).
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

export const socialService = {
  /** Genera un borrador de post para un producto en la plataforma dada */
  async generatePost(product, platform = 'tiktok') {
    const d = await call('generate-post', { product, platform })
    return d.draft || ''
  },
}
