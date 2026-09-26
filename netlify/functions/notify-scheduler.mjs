// ============================================================
// AULOAVA · Notify Scheduler (Netlify Scheduled Function)
// Corre cada día y alimenta la bandeja de notificaciones de los
// usuarios (notifications/{uid}):
//   1) Anuncia "nuevo producto" (máx. 3 por corrida, descartando
//      los que lleven más de 7 días anunciados). El resto se marca
//      anunciado en silencio para no spamear el primer arranque.
//   2) Recomienda el producto MÁS ECONÓMICO de cada nicho del
//      usuario (máx. 2/día) o, si no tiene nichos, la oferta del
//      día global (el más barato del catálogo). Una vez al día.
// La lógica vive en runNotifications(db) para poder invocarse
// también a mano (scripts/notify-now.mjs).
// Cron: en netlify.toml -> [functions.notify-scheduler]
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

function buildNotif(type, product, category, opts = {}) {
  const title = String(product.title || 'Producto').slice(0, 120)
  const cat = String(category || product.category || '').trim()
  const now = Date.now()
  if (type === 'new-product') {
    return {
      type,
      title: 'Nuevo producto',
      message: cat
        ? `Llegó al catálogo: ${title} (${cat})`
        : `Llegó al catálogo: ${title}`,
      category: cat,
      productId: product.id,
      productTitle: title,
      image: product.image || (product.images && product.images[0]) || '',
      price: Number(product.price) || 0,
      action: 'catalog-search',
      read: false,
      createdAt: now,
    }
  }
  // cheap-pick
  return {
    type,
    title: opts.global ? 'Oferta del día' : `El más económico en ${cat}`,
    message: opts.global
      ? `Hoy el producto más barato del catálogo es "${title}" por $${Number(product.price) || 0}.`
      : `Hoy te recomendamos "${title}" por $${Number(product.price) || 0} — la mejor oferta en ${cat}.`,
    category: cat,
    productId: product.id,
    productTitle: title,
    image: product.image || (product.images && product.images[0]) || '',
    price: Number(product.price) || 0,
    action: 'catalog-category',
    read: false,
    createdAt: now,
  }
}

// ---------- 1) Anunciar productos nuevos (sin spam) ----------
// Friega: entre los NO anunciados, anuncia como mucho NEW_PICK_LIMIT
// (los más recientes) siempre que tengan menos de FRESH_MS. Todos los
// demás se marcan anunciados en silencio.
async function announceNewProducts(db, users) {
  const productsSnap = await db.ref('products').get()
  const announcedSnap = await db.ref('system/announcedProducts').get()
  const announced = announcedSnap.exists() ? announcedSnap.val() : {}
  if (!productsSnap.exists()) return { announced: 0, marked: 0 }

  const FRESH_MS = 7 * 86400000
  const NEW_PICK_LIMIT = 3
  const now = Date.now()

  const pending = Object.entries(productsSnap.val() || {})
    .map(([id, product]) => ({ id, ...product }))
    .filter((p) => p && typeof p === 'object' && !announced[p.id])
    .sort((a, b) => (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))

  let announcedCount = 0
  const marks = {}
  for (const p of pending) {
    marks[p.id] = true
    const fresh = now - new Date(p.createdAt || 0).getTime() <= FRESH_MS
    if (!users.length || !fresh || announcedCount >= NEW_PICK_LIMIT) continue
    const notif = buildNotif('new-product', p, p.category)
    announcedCount += 1
    await Promise.all(users.map((user) => db.ref(`notifications/${user.uid}`).push(notif)))
  }
  await db.ref('system/announcedProducts').update(marks)
  return { announced: announcedCount, marked: pending.length }
}

// ---------- 2) Producto más económico (nicho o global) ----------
async function recommendCheapest(db, users) {
  const productsSnap = await db.ref('products').get()
  const products = productsSnap.exists()
    ? Object.entries(productsSnap.val() || {}).map(([id, p]) => ({ id, ...p }))
    : []
  if (!products.length) return 0

  const byCategory = new Map()
  let globalPick = null
  for (const p of products) {
    const key = normalizeCategory(p.category)
    if (!key) continue
    const cheapest = byCategory.get(key)
    if (!cheapest || productPrice(p) < productPrice(cheapest)) byCategory.set(key, p)
    if (!globalPick || productPrice(p) < productPrice(globalPick)) globalPick = p
  }

  const dateKey = localDateKey()
  let count = 0

  for (const user of users) {
    const niches = Array.isArray(user.niches) ? user.niches : []
    const catKeys = new Set(niches.map(normalizeCategory).filter(Boolean))

    // Por nicho (máx 2 recomendaciones/día/usuario)
    let sent = 0
    for (const key of catKeys) {
      if (sent >= 2) break
      const pick = byCategory.get(key)
      if (!pick || productPrice(pick) === Infinity) continue
      const dedupe = `${dateKey}:${user.uid}:niche:${key}`
      const sentSnap = await db.ref(`system/cheapSent/${dedupe}`).get()
      if (sentSnap.exists()) continue
      await db.ref(`notifications/${user.uid}`).push(buildNotif('cheap-pick', pick, pick.category))
      await db.ref(`system/cheapSent/${dedupe}`).set(true)
      sent += 1
      count += 1
    }

    // Sin nichos (o ninguno con oferta): oferta del día global
    if (!catKeys.size && globalPick && productPrice(globalPick) !== Infinity) {
      const dedupe = `${dateKey}:${user.uid}:global`
      const sentSnap = await db.ref(`system/cheapSent/${dedupe}`).get()
      if (sentSnap.exists()) continue
      await db.ref(`notifications/${user.uid}`).push(
        buildNotif('cheap-pick', globalPick, globalPick.category, { global: true })
      )
      await db.ref(`system/cheapSent/${dedupe}`).set(true)
      count += 1
    }
  }
  return count
}

// ---------- Núcleo (reutilizable por la script/ahora y el cron) ----------
export async function runNotifications(db) {
  const usersSnap = await db.ref('users').get()
  const users = []
  if (usersSnap.exists()) {
    Object.entries(usersSnap.val() || {}).forEach(([uid, u]) => {
      if (u && typeof u === 'object') users.push({ uid, ...u })
    })
  }

  const fresh = await announceNewProducts(db, users)
  const cheap = await recommendCheapest(db, users)

  console.log(
    `[notify] usuarios=${users.length} nuevo-producto=${fresh.announced} (marcados=${fresh.marked}) recomendaciones=${cheap}`
  )
  return { users: users.length, fresh, cheap }
}

export const handler = async () => {
  const db = ensureAdmin()
  await runNotifications(db)
  return { statusCode: 200, body: 'OK' }
}