import { readFileSync } from 'node:fs'
import admin from 'firebase-admin'

const DATABASE_URL = 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app'
const asinOf = (u = '') => String(u).match(/\/dp\/([A-Z0-9]{10})/i)?.[1] || ''

const sa = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL: DATABASE_URL })
const db = admin.database()

const products = JSON.parse(readFileSync(new URL('../data/auloava-products.json', import.meta.url), 'utf8'))

const snap = await db.ref('products').get()
const remoteAsins = new Set()
let remoteCount = 0
if (snap.exists()) {
  for (const [id, d] of Object.entries(snap.val())) {
    remoteCount++
    const a = asinOf(d.affiliateUrl)
    if (a) remoteAsins.add(a)
  }
}

const toAdd = products.filter((p) => p.category && !p.category.startsWith('__') && !remoteAsins.has(asinOf(p.affiliateUrl)))
const now = new Date().toISOString()
let added = 0
for (const p of toAdd) {
  await db.ref('products').push().set({ clicks: 0, createdAt: now, updatedAt: now, ratingCount: p.ratingCount ?? null, ...p })
  added++
}
console.log(`remote ${remoteCount} → añadidos ${added} → total ${remoteCount + added}`)
await db.goOffline()
process.exit(0)