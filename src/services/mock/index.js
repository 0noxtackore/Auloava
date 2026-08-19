// ============================================================
// AULOAVA · Mock de backend (modo demo)
// Simula un API REST usando localStorage y latencias realistas.
// Permite que el proyecto funcione sin servidor.
// Cuando tengas un backend real, desactívalo con VITE_MOCK_API=false.
// ============================================================
import { storage } from '@/utils/storage'
import { PLATFORM_LIST, CATEGORIES } from '@/constants'

const DB_PRODUCTS = 'db_products'

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms))

const MOCK_ENABLED = import.meta.env.VITE_MOCK_API !== 'false'

/* ---------- Capa de "base de datos" (localStorage) ---------- */

const ids = {
  next: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
}

/** Devuelve la lista de productos (inicializándola la primera vez) */
function getProducts() {
  let items = storage.get(DB_PRODUCTS)
  if (!items || !items.length) {
    items = seedProducts()
    storage.set(DB_PRODUCTS, items)
  }
  return items
}

/* ---------- Datos semilla ---------- */

/** 12 productos afiliados de ejemplo (AliExpress, Amazon, Alibaba) */
function seedProducts() {
  const base = [
    ['Auriculares Bluetooth Pro', 'aliexpress', 'Electrónica', 24.99, 49.99, 4.6, 12, 340, 1284],
    ['Reloj Inteligente S9 Ultra', 'aliexpress', 'Electrónica', 39.9, 79.9, 4.4, 15, 210, 986],
    ['Funda de silicona para iPhone', 'aliexpress', 'Accesorios', 5.5, 12.0, 4.3, 20, 900, 2105],
    ['Lámpara LED de escritorio', 'amazon', 'Hogar', 29.99, 45.0, 4.7, 10, 150, 743],
    ['Aspiradora robótica inteligente', 'amazon', 'Hogar', 189.0, 269.0, 4.8, 8, 45, 512],
    ['Tablet e-Reader Paperwhite', 'amazon', 'Tecnología', 119.99, 149.99, 4.9, 6, 88, 634],
    ['Bolso de mano de cuero', 'alibaba', 'Moda', 18.4, 32.0, 4.2, 18, 1200, 1520],
    ['Silla de oficina ergonómica', 'alibaba', 'Mayorista', 62.0, 110.0, 4.5, 14, 400, 890],
    ['Kit de herramientas 96 piezas', 'aliexpress', 'Hogar', 21.75, 39.99, 4.5, 11, 260, 760],
    ['Cafetera espresso compacta', 'amazon', 'Hogar', 84.5, 120.0, 4.6, 9, 130, 445],
    ['Panel solar 300W', 'alibaba', 'Mayorista', 96.0, 150.0, 4.4, 16, 500, 1203],
    ['Kit de maquillaje profesional', 'aliexpress', 'Belleza', 14.25, 28.0, 4.1, 22, 780, 1890],
  ]

  return base.map(([title, platform, category, price, originalPrice, rating, commission, stock, clicks], i) => ({
    id: ids.next(),
    title,
    platform,
    category,
    price,
    originalPrice,
    rating,
    commission,
    stock,
    clicks,
    image: `https://picsum.photos/seed/auloava-${i + 1}/480/320`,
    affiliateUrl: `https://www.${platform}.com/auloava/${i + 1}`,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
  }))
}

/* ---------- Lanzar error con la misma forma que axios ---------- */
function apiError(message, status = 400) {
  const error = new Error(message)
  error.response = { status, data: { message } }
  return error
}

/* ---------- Handlers de productos (CRUD) ---------- */

const productHandlers = {
  async list() {
    await delay()
    return getProducts()
  },

  async get(id) {
    await delay()
    const product = getProducts().find((p) => p.id === id)
    if (!product) throw apiError('Producto no encontrado', 404)
    return product
  },

  async create(payload) {
    await delay()
    const items = getProducts()
    const now = new Date().toISOString()
    const product = {
      id: ids.next(),
      image: `https://picsum.photos/seed/auloava-${ids.next()}/480/320`,
      clicks: 0,
      createdAt: now,
      updatedAt: now,
      ...payload,
    }
    items.unshift(product)
    storage.set(DB_PRODUCTS, items)
    return product
  },

  async update(id, payload) {
    await delay()
    const items = getProducts()
    const index = items.findIndex((p) => p.id === id)
    if (index === -1) throw apiError('Producto no encontrado', 404)
    items[index] = { ...items[index], ...payload, updatedAt: new Date().toISOString() }
    storage.set(DB_PRODUCTS, items)
    return items[index]
  },

  async remove(id) {
    await delay()
    const items = getProducts()
    const next = items.filter((p) => p.id !== id)
    if (next.length === items.length) {
      throw apiError('Producto no encontrado', 404)
    }
    storage.set(DB_PRODUCTS, next)
    return { ok: true }
  },
}

/* ---------- Datos para la landing (públicos) ---------- */

export const landingData = {
  stats: [
    { label: 'Productos curados', value: 1200 },
    { label: 'Marketplaces', value: 3 },
    { label: 'Comisión media', value: '14%' },
    { label: 'Ahorro medio', value: '38%' },
  ],
  platforms: PLATFORM_LIST,
  categories: CATEGORIES,
  steps: [
    { title: 'Explora', text: 'Navega por productos curados y verificados de los 3 gigantes del ecommerce.' },
    { title: 'Compara', text: 'Compara precios, comisiones y valoraciones en una sola vista.' },
    { title: 'Compra', text: 'Consigue el mejor precio del mercado con enlaces seguros de afiliado.' },
    { title: 'Ahorra', text: 'Acumula el ahorro real de cada compra y revive tus mejores decisiones.' },
    { title: 'Recibe alertas', text: 'Te avisamos cuando un producto baja de precio en cualquiera de los 3 marketplaces.' },
    { title: 'Comparte', text: 'Envía tu pin favorito a amigos o redes con un solo clic.' },
  ],
  testimonials: [
    { name: 'Lucía Fernández', role: 'Compradora frecuente', text: 'He ahorrado un 35% en mi última compra. La comparativa es clarísima.', avatar: 'https://i.pravatar.cc/96?img=47' },
    { name: 'Lucía Fernández', role: 'Compradora exigente', text: 'Encontré la misma cámara 40€ más barata en otro marketplace. La comparativa es increíble.', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { name: 'Sofía Navarro', role: 'Community manager', text: 'Diseño impecable y ofertas reales de AliExpress. Lo recomiendo al 100%.', avatar: 'https://i.pravatar.cc/96?img=32' },
  ],
}

export { productHandlers, MOCK_ENABLED }
