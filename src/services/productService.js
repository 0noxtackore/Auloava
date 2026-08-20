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

// El mock expone list/get; Firebase expone getAll/getById. Unificamos la
// interfaz para que el resto de la app no tenga que saber qué backend usa.
export const productService = MOCK_ENABLED
  ? {
      getAll: (...args) => productHandlers.list(...args),
      getById: (...args) => productHandlers.get(...args),
      create: (...args) => productHandlers.create(...args),
      update: (...args) => productHandlers.update(...args),
      remove: (...args) => productHandlers.remove(...args),
      registerClick: (...args) => productHandlers.registerClick(...args),
    }
  : firebaseProducts

export const USE_FIREBASE = !MOCK_ENABLED
