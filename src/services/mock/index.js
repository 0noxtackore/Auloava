// ============================================================
// AULOAVA · Mock de backend (modo demo)
// Simula un API REST usando localStorage y latencias realistas.
// Permite que el proyecto funcione sin servidor.
// Cuando tengas un backend real, desactívalo con VITE_MOCK_API=false.
// ============================================================
import { storage } from '@/utils/storage'
import { PLATFORM_LIST, CATEGORIES } from '@/constants'
import nailProducts from '../../../data/nail-products.json'

const DB_PRODUCTS = 'db_products'
const DB_VERSION = 3

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms))

// En desarrollo el mock está activo salvo que se fuerce false.
// En producción solo se usa si VITE_MOCK_API=true explícitamente
// (si no, se usa Firebase vía el agente).
const MOCK_ENABLED = import.meta.env.DEV
  ? import.meta.env.VITE_MOCK_API !== 'false'
  : import.meta.env.VITE_MOCK_API === 'true'

/* ---------- Capa de "base de datos" (localStorage) ---------- */

const ids = {
  next: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
}

/** Devuelve la lista de productos (inicializándola la primera vez) */
function getProducts() {
  const store = storage.get(DB_PRODUCTS)
  if (!store || store.v !== DB_VERSION || !store.items || !store.items.length) {
    const items = seedProducts()
    storage.set(DB_PRODUCTS, { v: DB_VERSION, items })
    return items
  }
  return store.items
}

function saveProducts(items) {
  storage.set(DB_PRODUCTS, { v: DB_VERSION, items })
}

/* ---------- Datos semilla ---------- */

/** Productos reales de uñas extraídos de Amazon Best Sellers (data/nail-products.json). */
function seedProducts() {
  return nailProducts.map((p, i) => ({
    id: ids.next(),
    clicks: 0,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
    ...p,
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
    saveProducts(items)
    return product
  },

  async update(id, payload) {
    await delay()
    const items = getProducts()
    const index = items.findIndex((p) => p.id === id)
    if (index === -1) throw apiError('Producto no encontrado', 404)
    items[index] = { ...items[index], ...payload, updatedAt: new Date().toISOString() }
    saveProducts(items)
    return items[index]
  },

  async remove(id) {
    await delay()
    const items = getProducts()
    const next = items.filter((p) => p.id !== id)
    if (next.length === items.length) {
      throw apiError('Producto no encontrado', 404)
    }
    saveProducts(next)
    return { ok: true }
  },

  async registerClick(id) {
    const items = getProducts()
    const index = items.findIndex((p) => p.id === id)
    if (index !== -1) {
      items[index] = { ...items[index], clicks: (Number(items[index].clicks) || 0) + 1 }
      saveProducts(items)
    }
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
    { name: 'Elena Ruiz', role: 'Compradora exigente', text: 'Encontré la misma cámara 40€ más barata en otro marketplace. La comparativa es increíble.', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
    { name: 'Sofía Navarro', role: 'Community manager', text: 'Diseño impecable y ofertas reales de AliExpress. Lo recomiendo al 100%.', avatar: 'https://i.pravatar.cc/96?img=32' },
    { name: 'Hugo Moreno', role: 'Comprador tech', text: 'Comparar los 3 marketplaces en una sola vista me ahorra un montón de tiempo. Top.', avatar: 'https://randomuser.me/api/portraits/men/52.jpg' },
    { name: 'Daniel Castro', role: 'Padre y comprador', text: 'Compro juguetes y electrónica para la familia y siempre encuentro el mejor precio aquí.', avatar: 'https://randomuser.me/api/portraits/men/76.jpg' },
    { name: 'Pablo Serra', role: 'Estudiante', text: 'De alumno, cualquier euro cuenta. La comparativa de comisiones me ha salvado más de una vez.', avatar: 'https://randomuser.me/api/portraits/men/14.jpg' },
  ],
}

export { productHandlers, MOCK_ENABLED }
