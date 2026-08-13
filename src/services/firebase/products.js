// ============================================================
// AULOAVA · Productos en Realtime Database (backend Firebase)
// Implementa la misma interfaz que el mock/REST:
//   getAll, getById, create, update, remove
// Estructura: /products/{pushId}
// ============================================================
import { ref, get, push, set, update, remove } from 'firebase/database'
import { db } from '../firebase'

const PATH = 'products'

/** Lanza un error con la misma forma que axios (reutiliza el manejo de errores) */
function apiError(message, status = 400) {
  const error = new Error(message)
  error.response = { status, data: { message } }
  return error
}

export const firebaseProducts = {
  /** Lista todos los productos */
  async getAll() {
    const snapshot = await get(ref(db, PATH))
    if (!snapshot.exists()) return []
    const obj = snapshot.val()
    return Object.entries(obj).map(([id, data]) => ({ id, ...data }))
  },

  /** Obtiene un producto por id */
  async getById(id) {
    const snapshot = await get(ref(db, `${PATH}/${id}`))
    if (!snapshot.exists()) throw apiError('Producto no encontrado', 404)
    return { id, ...snapshot.val() }
  },

  /** Crea un producto nuevo (id autogenerado por push) */
  async create(payload) {
    const now = new Date().toISOString()
    const product = { clicks: 0, createdAt: now, updatedAt: now, ...payload }
    const newRef = push(ref(db, PATH))
    await set(newRef, product)
    return { id: newRef.key, ...product }
  },

  /** Actualiza un producto existente */
  async update(id, payload) {
    const updated = { ...payload, updatedAt: new Date().toISOString() }
    await update(ref(db, `${PATH}/${id}`), updated)
    return { id, ...payload }
  },

  /** Elimina un producto */
  async remove(id) {
    await remove(ref(db, `${PATH}/${id}`))
    return { ok: true }
  },
}
