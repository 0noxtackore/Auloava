// ============================================================
// AULOAVA · fixThumbnails.mjs
// Reasigna miniaturas variadas (1ª/3ª/4ª/5ª) usando la galería
// que ahora expone el endpoint scrape. Reintenta en bucle con
// enfriamientos porque Amazon rate-limit el IP de Netlify.
// ============================================================
import { readFileSync } from 'node:fs'
import admin from 'firebase-admin'

const SCRAPE_ENDPOINT =
  process.env.SCRAPE_ENDPOINT ||
  'https://wonderful-cranachan-def7d4.netlify.app/.netlify/functions/scrape'

// Índices candidatos de la galería: 1ª(0), 3ª(2), 4ª(3), 5ª(4)
const CANDIDATES = [0, 2, 3, 4]
const DEADLINE = Date.now() + 9 * 60 * 1000 // 9 minutos
const COOLDOWN = 90_000

function hashAsin(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (31 * h + s.charCodeAt(i)) >>> 0
  return h
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchGallery(url) {
  const res = await fetch(SCRAPE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  const data = await res.json().catch(() => ({}))
  return data.imageIds || []
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
  const pending = Object.keys(all).filter(
    (k) => all[k].platform === 'amazon' && all[k].url && !(Array.isArray(all[k].imageIds) && all[k].imageIds.length),
  )
  let updated = 0
  console.log(`Pendientes: ${pending.length}`)

  while (pending.length && Date.now() < DEADLINE) {
    let consecutiveEmpty = 0
    for (let i = pending.length - 1; i >= 0; i--) {
      const key = pending[i]
      const p = all[key]
      let ids = []
      try {
        ids = await fetchGallery(p.url)
      } catch (e) {
        console.log(`! ${p.title.slice(0, 30)}: ${e.message}`)
      }
      if (ids.length === 0) {
        consecutiveEmpty++
        if (consecutiveEmpty >= 3) {
          console.log(`⏸ bloqueo detectado, espero ${COOLDOWN / 1000}s...`)
          await sleep(COOLDOWN)
          consecutiveEmpty = 0
        }
        await sleep(2000 + Math.floor(Math.random() * 2000))
        continue
      }
      consecutiveEmpty = 0
      const idx = CANDIDATES[hashAsin(p.url) % CANDIDATES.length]
      const chosen = ids[Math.min(idx, ids.length - 1)]
      const newImage = `https://images-na.ssl-images-amazon.com/images/I/${chosen}._AC_SX679_.jpg`
      await db.ref('products/' + key).update({
        image: newImage,
        imageIds: ids,
        updatedAt: new Date().toISOString(),
      })
      updated++
      console.log(`✔ ${updated} ${p.title.slice(0, 38)} -> foto#${Math.min(idx, ids.length - 1) + 1} (${ids.length} galería)`)
      pending.splice(i, 1)
      await sleep(2500 + Math.floor(Math.random() * 2000))
    }
    if (pending.length && Date.now() < DEADLINE) {
      console.log(`↻ queda(n) ${pending.length}, nuevo intento...`)
      await sleep(COOLDOWN)
    }
  }
  console.log(`\nTerminado. Esta sesión: ${updated} | Pendientes restantes: ${pending.length}`)
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
