// ============================================================
// AULOAVA · updateClicks.mjs
// Asigna a cada producto un valor de `clicks` ÚNICO y >= 1000
// (para simular tráfico de afiliado distinto por producto).
// ============================================================
import { readFileSync } from 'node:fs'
import admin from 'firebase-admin'

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function main() {
  const sa = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app',
  })
  const db = admin.database()
  const snap = await db.ref('products').once('value')
  const all = snap.val() || {}
  const keys = Object.keys(all)
  const n = keys.length

  // 130 valores únicos en [1000, 1000 + n*1000], barajados
  const values = shuffle(Array.from({ length: n }, (_, i) => 1000 + i * 1000))
  let i = 0
  for (const key of keys) {
    const clicks = values[i++]
    await db.ref('products/' + key).update({ clicks, updatedAt: new Date().toISOString() })
  }
  console.log(`Actualizados ${n} productos con clicks únicos >= 1000.`)
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
