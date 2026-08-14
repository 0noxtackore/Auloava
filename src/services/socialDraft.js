// ============================================================
// AULOAVA · Borradores sociales (cola de aprobación 80/20)
// El agente de IA genera borradores en /socialDrafts con estado
// "pending". Un humano los aprueba (o rechaza) desde el panel
// admin; solo los aprobados se publican en la red correspondiente.
// ============================================================
import { ref, get, push, set, update, remove } from 'firebase/database'
import { db } from './firebase'

const PATH = 'socialDrafts'

export const socialDrafts = {
  async getAll() {
    const snapshot = await get(ref(db, PATH))
    if (!snapshot.exists()) return []
    const obj = snapshot.val()
    return Object.entries(obj)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  },

  async getPending() {
    const all = await this.getAll()
    return all.filter((d) => d.status === 'pending')
  },

  async create(payload) {
    const now = new Date().toISOString()
    const draft = {
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      ...payload,
    }
    const newRef = push(ref(db, PATH))
    await set(newRef, draft)
    return { id: newRef.key, ...draft }
  },

  async setStatus(id, status, extra = {}) {
    await update(ref(db, `${PATH}/${id}`), {
      status,
      updatedAt: new Date().toISOString(),
      ...extra,
    })
    return { id, status }
  },
}
