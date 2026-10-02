// ============================================================
// AULOAVA · Añade MUEBLES y LÁMPARAS (hogar) al catálogo.
// - Extrae best sellers de Amazon vía la función Netlify zgbs.
// - Construye productos normalizados, evita duplicar ASINs.
// - Actualiza data/auloava-products.json (mock/seed local).
// - Publica en Firebase (RTDB) sólo los nuevos.
// Uso:
//   node scripts/add-muebles-lamparas.mjs            # genera JSON + publica RTDB
//   node scripts/add-muebles-lamparas.mjs --dry-run  # solo genera el JSON
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs'
import admin from 'firebase-admin'

const ZGBS_URL = 'https://auloava.netlify.app/.netlify/functions/zgbs'
const AMZ_TAG = 'auloava-20'
const DRY_RUN = process.argv.includes('--dry-run')
const r2 = (n) => Math.round(n * 100) / 100

const img = (key) =>
  `https://images-na.ssl-images-amazon.com/images/I/${String(key).replace(/\.jpg$/, '')}._AC_SX679_.jpg`

const asinOf = (u = '') => String(u).match(/\/dp\/([A-Z0-9]{10})/i)?.[1] || ''

const CATS = [
  {
    category: 'Muebles',
    commission: 4,
    discount: 0.3,
    maxPrice: 250,
    count: 12,
    slug: 'furniture',
    url: 'https://www.amazon.com/gp/bestsellers/home-garden/1063306',
    keep: /bed frame|mattress|dresser|bookshelf|book shelf|bookcase|chair|desk|table|shoe rack|storage|rack|shelf|sofa|couch|ottoman|bench|nightstand|vanity|wardrobe|cabinet/i,
    drop: /topper|pad\b|wall mount|mount|door mat|doormat|trash|step stool|laundry|protector|magnifying|hanger|cushion|curtain|hamper/i,
  },
  {
    category: 'Lámparas',
    commission: 5,
    discount: 0.35,
    maxPrice: 45,
    count: 12,
    slug: 'lighting',
    url: 'https://www.amazon.com/gp/bestsellers/hi/495224',
    keep: /light|lamp|candle|bulb|led|solar|string|lantern|reading/i,
    drop: /cam\b|security|camera|floodlight cam|ring indoor|ring outdoor|blink/i,
  },
]

async function callZgbs(url, tries = 2) {
  for (let i = 0; i <= tries; i++) {
    try {
      const res = await fetch(ZGBS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const j = await res.json()
      if (j.ok && j.items?.length) return j.items
      console.warn(`  reintento ${i + 1}: ${j.error || 'sin items'} (robot: ${j.robot})`)
    } catch (e) {
      console.warn(`  reintento ${i + 1}: error ${e.message}`)
    }
    if (i < tries) await new Promise((r) => setTimeout(r, 2500))
  }
  return []
}

function build(cat, item) {
  const original = r2(item.price / (1 - cat.discount))
  const image = img(item.imageKey)
  return {
    title: item.title,
    category: cat.category,
    platform: 'amazon',
    image,
    photos: [image],
    price: r2(item.price),
    originalPrice: original,
    rating: Number(item.rating || 0),
    ratingCount: Number(item.ratingCount || 0),
    stock: 50,
    commission: cat.commission,
    affiliateUrl: `https://www.amazon.com/dp/${item.asin}?tag=${AMZ_TAG}`,
    source: `bestsellers-${cat.slug}`,
  }
}

const keyOf = (p) => p.asin || asinOf(p.affiliateUrl || p.url) || ''

async function main() {
  const local = JSON.parse(readFileSync(new URL('../data/auloava-products.json', import.meta.url), 'utf8'))
  const byKey = new Map(local.filter((p) => keyOf(p)).map((p) => [keyOf(p), p]))
  const all = []

  // Firebase (para deduplicar)
  let db = null
  let remoteAsins = new Set()
  if (!DRY_RUN) {
    const sa = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      databaseURL: 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app',
    })
    db = admin.database()
    const snap = await db.ref('products').once('value')
    const existing = snap.val() || {}
    for (const k in existing) {
      const u = existing[k].affiliateUrl || existing[k].url || ''
      const m = u.match(/\/dp\/([A-Z0-9]{10})/)
      if (m) remoteAsins.add(m[1])
    }
  }

  for (const cat of CATS) {
    console.log(`\n📦 ${cat.category} — ${cat.url}`)
    const items = (await callZgbs(cat.url)).filter(
      (i) => cat.keep.test(i.title) && !cat.drop.test(i.title),
    )
    console.log(`   ${items.length} best sellers relevantes`)
    const picks = items
      .filter((i) => i.price && i.price <= cat.maxPrice)
      .sort((a, b) => b.ratingCount - a.ratingCount)
      .slice(0, cat.count)
    for (const item of picks) {
      const p = build(cat, item)
      const k = keyOf(p)
      if (!k || byKey.has(k)) continue
      byKey.set(k, p)
      all.push(p)
      console.log(`   ✅ ${k} · $${p.price} · ${p.title.slice(0, 60)}`)
    }
    // Guarda la fuente extraída (igual que data/zgbs-*.json)
    writeFileSync(
      new URL(`../data/zgbs-${cat.slug}.json`, import.meta.url),
      JSON.stringify(items, null, 2) + '\n',
    )
  }

  // Actualiza el catálogo local solo con los nuevos de esta categoría
  writeFileSync(
    new URL('../data/auloava-products.json', import.meta.url),
    JSON.stringify([...byKey.values()], null, 2),
  )
  console.log(`\n📚 Catálogo local: ${local.length} -> ${byKey.size}`)

  if (DRY_RUN) {
    console.log(`⏭️  dry-run: ${all.length} productos nuevos NO publicados`)
    return
  }

  let n = 0
  for (const p of all) {
    if (remoteAsins.has(keyOf(p).trim())) continue
    const ref = db.ref('products').push()
    await ref.set({
      ...p,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    n++
    console.log(`✔ ${p.category}: ${p.title.slice(0, 46)}`)
  }
  console.log(`\n🚀 Publicados ${n} productos en Firebase (${all.length - n} ya existían)`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})