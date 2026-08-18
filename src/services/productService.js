// ============================================================
// AULOAVA · Servicio de productos (CRUD)
// Única fuente de verdad: Firebase (vía la Netlify Function
// agente, que usa la cuenta de servicio / admin SDK).
// No hay mock ni localStorage: si Firebase no está disponible,
// la operación falla visiblemente en vez de guardar en falso.
// ============================================================
import { firebaseProducts } from './firebase/products'

export const productService = {
  /** Lista todos los productos */
  getAll: (...args) => firebaseProducts.getAll(...args),

  /** Obtiene un producto por id */
  getById: (...args) => firebaseProducts.getById(...args),

  /** Crea un producto nuevo */
  create: (...args) => firebaseProducts.create(...args),

  /** Actualiza un producto existente */
  update: (...args) => firebaseProducts.update(...args),

  /** Elimina un producto */
  remove: (...args) => firebaseProducts.remove(...args),
}

export const USE_FIREBASE = true
