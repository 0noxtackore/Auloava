// ============================================================
// AULOAVA · Constantes globales
// ============================================================

/** Marketplaces afiliados */
export const PLATFORMS = {
  aliexpress: {
    id: 'aliexpress',
    name: 'AliExpress',
    color: '#E6422A',
    tagline: 'Ofertas globales',
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    color: '#146EB4',
    tagline: 'Envío rápido',
  },
  alibaba: {
    id: 'alibaba',
    name: 'Alibaba',
    color: '#FF6A00',
    tagline: 'Mayorista B2B',
  },
}

/** Lista ordenada de marketplaces (para filtros y tarjetas) */
export const PLATFORM_LIST = Object.values(PLATFORMS)

/** Categorías de productos */
export const CATEGORIES = [
  'Electrónica',
  'Hogar',
  'Moda',
  'Belleza',
  'Tecnología',
  'Accesorios',
  'Mayorista',
  'Otros',
]

/** Moneda por defecto */
export const CURRENCY = 'USD'
