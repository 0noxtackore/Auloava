// ============================================================
// AULOAVA · Servicio de productos guardados por usuario.
// Persiste en Firebase (agent function) y usa localStorage como
// respaldo en entornos sin Netlify Functions (dev local).
// ============================================================
const AGENT_KEY = import.meta.env.VITE_AGENT_KEY || ''
const endpoint = `${import.meta.env.BASE_URL}.netlify/functions/agent`

const lsKey = (uid) => `auloava:saved:${uid}`

function lsGet(uid) {
  try {
    return JSON.parse(localStorage.getItem(lsKey(uid)) || '[]')
  } catch {
    return []
  }
}
function lsSet(uid, list) {
  try {
    localStorage.setItem(lsKey(uid), JSON.stringify(list))
  } catch {
    /* almacenamiento no disponible */
  }
}

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

export const savedService = {
  async get(uid) {
    const local = lsGet(uid)
    try {
      const d = await call('get-saved', { uid })
      const server = d.saved || []
      const map = {}
      server.forEach((p) => {
        map[p.id] = p
      })
      // Los guardados locales que aún no están en el servidor también cuentan
      // (caso en el que la función aún no tiene el despliegue nuevo).
      local.forEach((p) => {
        if (!map[p.id]) map[p.id] = p
      })
      return Object.values(map)
    } catch {
      return local
    }
  },
  async save(uid, product) {
    try {
      await call('save-product', { uid, product })
    } catch {
      /* si no hay función desplegada, se queda en localStorage */
    }
    const list = lsGet(uid).filter((p) => p.id !== product.id)
    list.push({ ...product, savedAt: new Date().toISOString() })
    lsSet(uid, list)
  },
  async unsave(uid, id) {
    try {
      await call('unsave-product', { uid, id })
    } catch {
      /* si no hay función desplegada, se queda en localStorage */
    }
    lsSet(uid, lsGet(uid).filter((p) => p.id !== id))
  },
}