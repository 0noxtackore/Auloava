// ============================================================
// AULOAVA · Servicio de productos (CRUD)
// Orquesta el backend: Firebase (VITE_USE_FIREBASE=true) >
// mock (VITE_MOCK_API != 'false') > API REST real.
// ============================================================
import api from './api'
import { productHandlers, MOCK_ENABLED } from './mock'
import { firebaseProducts } from './firebase/products'

const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true'

/** Backend REST real (axios) adaptado a la interfaz del servicio */
const restBackend = {
  getAll: async () => (await api.get('/products')).data,
  getById: async (id) => (await api.get(`/products/${id}`)).data,
  create: async (payload) => (await api.post('/products', payload)).data,
  update: async (id, payload) => (await api.put(`/products/${id}`, payload)).data,
  remove: async (id) => (await api.delete(`/products/${id}`)).data,
}

/** Backend mock adaptado a la misma interfaz */
const mockBackend = {
  getAll: productHandlers.list,
  getById: productHandlers.get,
  create: productHandlers.create,
  update: productHandlers.update,
  remove: productHandlers.remove,
}

const backend = USE_FIREBASE ? firebaseProducts : MOCK_ENABLED ? mockBackend : restBackend

export const productService = {
  /** Lista todos los productos */
  getAll: () => backend.getAll(),

  /** Obtiene un producto por id */
  getById: (id) => backend.getById(id),

  /** Crea un producto nuevo */
  create: (payload) => backend.create(payload),

  /** Actualiza un producto existente */
  update: (id, payload) => backend.update(id, payload),

  /** Elimina un producto */
  remove: (id) => backend.remove(id),
}

export { USE_FIREBASE }
