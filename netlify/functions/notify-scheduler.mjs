// ============================================================
// AULOAVA · Notify Scheduler (Netlify Scheduled Function)
// Corre cada día y alimenta la bandeja de notificaciones de los
// usuarios (notifications/{uid}):
//   1) Anuncia "nuevo producto" si llegaron productos frescos (48h)
//      que todavía no fueron anunciados (los antiguos se marcan
//      como anunciados sin spam).
//   2) Recomienda el producto MÁS ECONÓMICO de cada nicho en el que
//      el usuario esté apuntado (una vez al día por nicho).
// Solo necesita firebase-admin (mismo servicio de cuenta que el
// agente). Cron: en netlify.toml -> [functions.notify-scheduler]
// ============================================================
import admin from 'firebase-admin'
import { getDatabase } from 'firebase-admin/database'

let _adminApp = null

function parseServiceAccount() {
  const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
  if (!svc.project_id) throw new Error('Falta FIREBASE_SERVICE_ACCOUNT')
  if (svc.private_key) svc.private_key = svc.private_key.replace(/\\n/g, '\n')
  return svc
}

function ensureAdmin() {
  if (!_adminApp) {
    const svc = parseServiceAccount()
    _adminApp = admin.initializeApp({
      credential: admin.credential.cert(svc),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    })
  }
  return getDatabase(_adminApp)
}

// ---------- Utilidades ----------
function productPrice(product) {
  const n = Number(product && product.price)
  if (!Number.isFinite(n) || n <= 0) return Infinity
  return n
}

function normalizeCategory(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function localDateKey() {
  return new Date().toISOString().slice(0, 10)
}

// ---------- 1) Anunciar productos frescos ----------
async function announceFreshProducts(db, users) {
  const productsSnap = await db.ref('products').get()
  const announcedSnap = await db.ref('system/announcedProducts').get()
  const announced = announcedSnap.exists() ? announcedSnap.val() : {}
  if (!productsSnap.exists()) return { announced: 0, marked: 0 }

  const now = Date.now()
  const FRESH_MS = 48 * 3600 * 1000
  let announcedCount = 0
  let markedCount = 0
  const marks = {}

  for (const [id, product] of Object.entries(productsSnap.val() || {})) {
    if (!product || typeof product !== 'object' || announced[id]) continue
    marks[id] = true
    markedCount += 1

    const created = new Date(product.createdAt || 0).getTime()
    if (!users.length || now - created > FRESH_MS) continue // backfill silencioso

    const title = String(product.title || 'Nuevo producto').slice(0, 120)
    const category = String(product.category || '').trim()
    const notif = {
      type: 'new-product',
      title: 'Nuevo producto',
      message: category
        ? `Nuevo producto en ${category}: ${title}`
        : `Nuevo producto en el catálogo: ${title}`,
      category,
      productId: id,
      productTitle: title,
      image: product.image || (product.images && product.images[0]) || '',
      price: Number(product.price) || 0,
      action: 'catalog-search',
      read: false,
      createdAt: now,
    }
    announcedCount += 1
    await Promise.all(
      users.map((uid) => db.ref(`notifications/${uid}`).push(notif))
    )
  }

  if (Object.keys(marks).length) {
    await db.ref('system/announcedProducts').update(marks)
  }
  return { announced: announcedCount, marked: markedCount }
}

// ---------- 2) Producto más económico por nicho ----------
async function recommendCheapest(db, users) {
  const productsSnap = await db.ref('products').get()
  const products = productsSnap.exists()
    ? Object.entries(productsSnap.val() || {}).map(([id, p]) => ({ id, ...p }))
    : []
  if (!products.length) return 0

  // Cheapest por categoría normalizada
  const byCategory = new Map()
  for (const p of products) {
    const key = normalizeCategory(p.category)
    if (!key) continue
    const cheapest = byCategory.get(key)
    if (!cheapest || productPrice(p) < productPrice(cheapest)) byCategory.set(key, p)
  }

  const dateKey = localDateKey()
  let count = 0

  for (const user of users) {
    const niches = Array.isArray(user.niches) ? user.niches : []
    if (!niches.length) continue
    for (const niche of niches.slice(0, 2)) {
      const key = normalizeCategory(niche)
      if (!key) continue
      const pick = byCategory.get(key)
      if (!pick || productPrice(pick) === Infinity) continue
      const dedupeKey = `${dateKey}:${user.uid}:${key}`
      const sentSnap = await db.ref(`system/cheapSent/${dedupeKey}`).get()
      if (sentSnap.exists()) continue

      const notif = {
        type: 'cheap-pick',
        title: `El más económico en ${pick.category}`,
        message: `Hoy te recomendamos "${pick.title}" por ${pick.price} — la mejor oferta en ${pick.category}.`,
        category: pick.category,
        productId: pick.id,
        productTitle: pick.title,
        image: pick.image || (pick.images && pick.images[0]) || '',
        price: Number(pick.price) || 0,
        action: 'catalog-category',
        read: false,
        createdAt: Date.now(),
      }
      await db.ref(`notifications/${user.uid}`).push(notif)
      await db.ref(`system/cheapSent/${dedupeKey}`).set(true)
      count += 1
    }
  }
  return count
}

export const handler = async () => {
  const db = ensureAdmin()

  const usersSnap = await db.ref('users').get()
  const users = []
  if (usersSnap.exists()) {
    Object.entries(usersSnap.val() || {}).forEach(([uid, u]) => {
      if (u && typeof u === 'object') users.push({ uid, ...u })
    })
  }

  const fresh = await announceFreshProducts(db, users)
  const cheap = await recommendCheapest(db, users)

  console.log(
    `[notify-scheduler] usuarios=${users.length} nuevo-producto=${fresh.announced} (marcados=${fresh.marked}) recomendaciones=${cheap}`
  )
  return { statusCode: 200, body: 'OK' }
}