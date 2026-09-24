// ============================================================
// AULOAVA · Reemplaza TODO el catálogo (Realtime DB) por el
// catálogo curado al nicho (data/auloava-products.json):
// hallazgos de tecnología y hogar asequibles.
// ⚠️ Destructivo: borra el nodo `products` y lo recrea, y resetea
// el nodo `niches` a las 3 categorías del nicho.
// ============================================================
import { readFileSync } from 'node:fs'
import admin from 'firebase-admin'

const DATABASE_URL = 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app'
const NICHE_CATEGORIES = ['Tecnología', 'Hogar', 'Cocina', 'Belleza', 'Oficina']

function main() {
  const sa = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))
  admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL: DATABASE_URL })
  const db = admin.database()

  const products = JSON.parse(
    readFileSync(new URL('../data/auloava-products.json', import.meta.url), 'utf8'),
  )

  const now = new Date().toISOString()
  const items = products.map((p) => ({
    clicks: 0,
    createdAt: now,
    updatedAt: now,
    ratingCount: p.ratingCount ?? null,
    ...p,
  }))

  return (async () => {
    const before = await db.ref('products').get()
    const beforeCount = before.exists() && before.val() ? Object.keys(before.val()).length : 0
    if (before.exists()) {
      await db.ref('products').remove()
    }
    const refs = await Promise.all(items.map((p) => db.ref('products').push().set(p)))
    await db.ref('niches').set(NICHE_CATEGORIES)
    const count = refs.length
    console.log(`Reemplazo completado:`)
    console.log(`  antes: ${beforeCount} productos en Firebase`)
    console.log(`  ahora: ${count} productos (catálogo curado al nicho)`)
    console.log(`  categorías: ${NICHE_CATEGORIES.length} (${NICHE_CATEGORIES.join(', ')})`)
    await db.goOffline()
    process.exit(0)
  })()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})