// ============================================================
// AULOAVA · Servicio de productos (CRUD)
// Orquesta el backend: Firebase (VITE_USE_FIREBASE=true) >
// mock (VITE_MOCK_API != 'false') > API REST real.
// ============================================================
import api from './api'
import { productHandlers, MOCK_ENABLED } from './mock'

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

// Firebase se importa de forma diferida para que su SDK no forme parte
// del bundle inicial de las páginas públicas (sólo se carga con
// VITE_USE_FIREBASE=true o al entrar al área privada).
let backendPromise = null
function getBackend() {
  if (backendPromise) return backendPromise
  if (USE_FIREBASE) {
    backendPromise = import('./firebase/products').then((m) => m.firebaseProducts)
  } else if (MOCK_ENABLED) {
    backendPromise = Promise.resolve(mockBackend)
  } else {
    backendPromise = Promise.resolve(restBackend)
  }
  return backendPromise
}

export const productService = {
  /** Lista todos los productos */
  getAll: async () => (await getBackend()).getAll(),

  /** Obtiene un producto por id */
  getById: async (id) => (await getBackend()).getById(id),

  /** Crea un producto nuevo */
  create: async (payload) => (await getBackend()).create(payload),

  /** Actualiza un producto existente */
  update: async (id, payload) => (await getBackend()).update(id, payload),

  /** Elimina un producto */
  remove: async (id) => (await getBackend()).remove(id),
}

export { USE_FIREBASE }
