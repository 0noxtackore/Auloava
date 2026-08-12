// ============================================================
// AULOAVA · Servicio de productos (CRUD)
// Ejemplo de llamadas API desde servicios.
// ============================================================
import api from './api'
import { productHandlers, MOCK_ENABLED } from './mock'

export const productService = {
  /** Lista todos los productos */
  async getAll() {
    if (MOCK_ENABLED) return productHandlers.list()
    return (await api.get('/products')).data
  },

  /** Obtiene un producto por id */
  async getById(id) {
    if (MOCK_ENABLED) return productHandlers.get(id)
    return (await api.get(`/products/${id}`)).data
  },

  /** Crea un producto nuevo */
  async create(payload) {
    if (MOCK_ENABLED) return productHandlers.create(payload)
    return (await api.post('/products', payload)).data
  },

  /** Actualiza un producto existente */
  async update(id, payload) {
    if (MOCK_ENABLED) return productHandlers.update(id, payload)
    return (await api.put(`/products/${id}`, payload)).data
  },

  /** Elimina un producto */
  async remove(id) {
    if (MOCK_ENABLED) return productHandlers.remove(id)
    return (await api.delete(`/products/${id}`)).data
  },
}
