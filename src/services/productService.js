// ============================================================
// AULOAVA · Servicio de productos (CRUD)
// Fuente de verdad: Firebase (vía la Netlify Function agente) en
// producción. En desarrollo/local usa el mock (localStorage) cuando
// VITE_MOCK_API !== 'false', de modo que la app funciona sin backend.
// ============================================================
import { firebaseProducts } from './firebase/products'
import { productHandlers, MOCK_ENABLED } from './mock'

if (MOCK_ENABLED) {
  console.info('[Auloava] Usando backend MOCK (localStorage). Desactívalo con VITE_MOCK_API=false')
} else {
  console.info('[Auloava] Usando backend Firebase (agente).')
}

const backend = MOCK_ENABLED ? productHandlers : firebaseProducts

export const productService = {
  /** Lista todos los productos */
  getAll: (...args) => backend.list(...args),

  /** Obtiene un producto por id */
  getById: (...args) => backend.get(...args),

  /** Crea un producto nuevo */
  create: (...args) => backend.create(...args),

  /** Actualiza un producto existente */
  update: (...args) => backend.update(...args),

  /** Elimina un producto */
  remove: (...args) => backend.remove(...args),

  /** Registra un click (acumulador) */
  registerClick: (...args) => backend.registerClick(...args),
}

export const USE_FIREBASE = !MOCK_ENABLED
