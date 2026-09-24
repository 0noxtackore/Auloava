// ============================================================
// AULOAVA · Constantes globales
// ============================================================

/** Marketplaces afiliados */
export const PLATFORMS = {
  aliexpress: {
    id: 'aliexpress',
    name: 'AliExpress',
    color: '#E6422A',
    logo: 'images/platforms/aliexpress.svg',
    tagline: 'Ofertas globales',
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    color: '#146EB4',
    logo: 'images/platforms/amazon.svg',
    tagline: 'Envío rápido',
  },
  alibaba: {
    id: 'alibaba',
    name: 'Alibaba',
    color: '#FF6A00',
    logo: 'images/platforms/alibaba.svg',
    tagline: 'Mayorista B2B',
  },
}

/** Lista ordenada de marketplaces (para filtros y tarjetas) */
export const PLATFORM_LIST = Object.values(PLATFORMS)

/** Categorías de productos · Nicho Auloava: hallazgos asequibles (tech, hogar, cocina, belleza, oficina) */
export const CATEGORIES = [
  'Tecnología',
  'Hogar',
  'Cocina',
  'Belleza',
  'Oficina',
]

/** Moneda por defecto */
export const CURRENCY = 'USD'
