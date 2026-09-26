// ============================================================
// AULOAVA · Servicio de notificaciones de usuario (bandeja)
// En producción delega en el agente (Netlify Function) que guarda
// notifications/{uid} en Firebase. En dev usa un mock local para
// que la campana funcione sin backend.
// ============================================================
import { MOCK_ENABLED } from '@/services/mock'
import { storage } from '@/utils/storage'

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

/* ---------- Mock local para modo demo ---------- */

const mockKey = (uid) => `mock_notifications_${uid}`

function seedMock() {
  const now = Date.now()
  return [
    {
      id: 'demo-cheap-today',
      type: 'cheap-pick',
      title: 'El más económico en Deportes',
      message: 'Hoy te recomendamos "Balón Nike" por $19.99 — la mejor oferta en Deportes.',
      category: 'Deportes',
      productId: '',
      productTitle: 'Balón Nike',
      price: 19.99,
      action: 'catalog-category',
      read: false,
      createdAt: now - 20 * 60000,
    },
    {
      id: 'demo-new',
      type: 'new-product',
      title: 'Nuevo producto',
      message: 'Nuevo producto en Electrónica: Auriculares Sony — ¡échales un vistazo!',
      category: 'Electrónica',
      productId: '',
      productTitle: 'Auriculares Sony',
      price: 89.99,
      action: 'catalog-search',
      read: false,
      createdAt: now - 5 * 3600000,
    },
    {
      id: 'demo-cheap-old',
      type: 'cheap-pick',
      title: 'El más económico en Hogar',
      message: 'Hoy te recomendamos "Lámpara LED" por $12.50 — la mejor oferta en Hogar.',
      category: 'Hogar',
      productId: '',
      productTitle: 'Lámpara LED',
      price: 12.5,
      action: 'catalog-category',
      read: true,
      createdAt: now - 3 * 86400000,
    },
  ]
}

function getMock(uid) {
  const store = storage.get(mockKey(uid))
  if (!store) {
    const items = seedMock()
    storage.set(mockKey(uid), items)
    return items
  }
  return store
}

function saveMock(uid, items) {
  storage.set(mockKey(uid), items)
}

/* ---------- Interfaz unificada ---------- */

export const notificationsService = MOCK_ENABLED
  ? {
      async list(uid) {
        return getMock(uid)
          .slice()
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      },
      async markRead(uid, id) {
        const items = getMock(uid)
        const item = items.find((i) => i.id === id)
        if (item) item.read = true
        saveMock(uid, items)
      },
      async markAllRead(uid) {
        saveMock(
          uid,
          getMock(uid).map((i) => ({ ...i, read: true }))
        )
      },
      async remove(uid, id) {
        saveMock(uid, getMock(uid).filter((i) => i.id !== id))
      },
    }
  : {
      async list(uid) {
        const d = await call('list-notifications', { uid })
        return d.notifications || []
      },
      async markRead(uid, id) {
        await call('mark-notification-read', { uid, id })
      },
      async markAllRead(uid) {
        await call('mark-all-notifications-read', { uid })
      },
      async remove(uid, id) {
        await call('delete-notification', { uid, id })
      },
    }