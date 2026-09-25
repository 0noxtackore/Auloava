// ============================================================
// AULOAVA · Añade productos de 8 categorías nuevas al catálogo
// (Moda y accesorios, Deportes y fitness, Mascotas, Jardín y
// exteriores, Herramientas y bricolaje, Bebé y niños, Salud y
// cuidado personal, Juguetes y juegos).
// - NO toca los productos existentes (solo añade, deduplica por ASIN).
// - Actualiza data/auloava-products.json (repo, mock y seed local).
// - Publica en Firebase (RTDB) sólo los nuevos, sin borrar nada,
//   y amplía el nodo `niches` con las categorías añadidas.
// Uso:
//   node scripts/add-new-niches.mjs            # genera JSON + publica RTDB
//   node scripts/add-new-niches.mjs --dry-run  # solo genera el JSON
// ============================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const DRY_RUN = process.argv.includes('--dry-run')
const DATABASE_URL = 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app'

const IMG = 'https://images-na.ssl-images-amazon.com/images/I/'
const AFF = (asin) => `https://www.amazon.com/dp/${asin}?tag=auloava-20`
const round2 = (n) => Math.round(n * 100) / 100
const asinOf = (u = '') => String(u).match(/\/dp\/([A-Z0-9]{10})/i)?.[1] || ''

const DISCOUNTS = {
  'Moda y accesorios': 0.35,
  'Deportes y fitness': 0.35,
  Mascotas: 0.4,
  'Jardín y exteriores': 0.4,
  'Herramientas y bricolaje': 0.4,
  'Bebé y niños': 0.4,
  'Salud y cuidado personal': 0.35,
  'Juguetes y juegos': 0.45,
}

// Fuente por categoría: (archivo, filtro de categoría en el JSON, máximo, comisión)
const SOURCES = [
  {
    category: 'Moda y accesorios',
    commission: 7,
    maxPrice: 45,
    count: 12,
    file: 'clothing-products.json',
    filter: (p) => ['Ropa de mujer', 'Ropa de niña', 'Ropa de niño'].includes(p.category),
  },
  {
    category: 'Bebé y niños',
    commission: 7,
    maxPrice: 45,
    count: 12,
    file: 'clothing-products.json',
    filter: (p) => p.category === 'Ropa de bebé',
  },
  {
    category: 'Juguetes y juegos',
    commission: 5,
    maxPrice: 40,
    count: 14,
    files: ['zgbs-toys.json', 'zgbs-toys-novelty.json'],
  },
  {
    category: 'Salud y cuidado personal',
    commission: 6,
    maxPrice: 45,
    count: 14,
    files: ['zgbs-hpc.json'],
  },
  { category: 'Deportes y fitness', commission: 5, maxPrice: 60, count: 12, files: ['zgbs-sports.json'] },
  { category: 'Mascotas', commission: 5, maxPrice: 50, count: 12, files: ['zgbs-pets.json'] },
  { category: 'Jardín y exteriores', commission: 5, maxPrice: 60, count: 12, files: ['zgbs-lawn-garden.json'] },
  { category: 'Herramientas y bricolaje', commission: 5, maxPrice: 60, count: 12, files: ['zgbs-tools.json'] },
]

const read = (p) => {
  try {
    return JSON.parse(readFileSync(new URL(`../data/${p}`, import.meta.url), 'utf8'))
  } catch {
    return null
  }
}

function toProduct(x, { category, commission }) {
  const image = `${IMG}${String(x.imageKey).replace(/\.jpg$/i, '')}._AC_SX679_.jpg`
  const discount = DISCOUNTS[category] || 0.35
  const originalPrice = x.originalPrice || round2(x.price / (1 - discount))
  return {
    title: x.title,
    platform: 'amazon',
    category,
    price: x.price,
    originalPrice,
    rating: x.rating,
    ratingCount: x.ratingCount ?? null,
    commission,
    stock: 300,
    image,
    affiliateUrl: AFF(x.asin),
    photos: [image],
    source: 'auloava-nuevos-nichos-2026-09-25',
  }
}

function pick(items, count, existingAsins) {
  return items
    .filter((x) => x.asin && !existingAsins.has(x.asin))
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))
    .slice(0, count)
}

function main() {
  const existing = read('auloava-products.json') || []
  const existingAsins = new Set(existing.map((p) => asinOf(p.affiliateUrl)).filter(Boolean))

  const newProducts = []
  const skippedByMissingFile = []

  for (const src of SOURCES) {
    let rows = []
    if (src.file) {
      const d = read(src.file)
      if (!d) {
        skippedByMissingFile.push(src.category)
        console.warn(`⚠ sin dataset: ${src.file} → se omite ${src.category}`)
        continue
      }
      rows = d.filter(src.filter)
    } else if (src.files) {
      const broken = src.files.filter((f) => !existsSync(new URL(`../data/${f}`, import.meta.url)))
      if (broken.length) {
        skippedByMissingFile.push(src.category)
        console.warn(`⚠ sin dataset: ${broken.join(', ')} → se omite ${src.category}`)
        continue
      }
      rows = src.files.flatMap(read)
    }

    const picks = pick(rows.filter((r) => (r.price ?? 999) <= src.maxPrice), src.count, existingAsins)
    if (!picks.length) {
      console.warn(`⚠ ${src.category}: sin picks (dataset vacío o todo duplicado)`)
      continue
    }
    if (picks.length < src.count) {
      console.warn(`⚠ ${src.category}: solo ${picks.length}/${src.count} disponibles tras filtros`)
    }
    for (const x of picks) {
      const product = src.file
        ? {
            ...x,
            category: src.category,
            commission: src.commission,
            originalPrice: x.originalPrice || round2(x.price / (1 - (DISCOUNTS[src.category] || 0.35))),
            source: 'auloava-nuevos-nichos-2026-09-25',
          }
        : toProduct(x, src)
      product.photos = x.photos && x.photos.length ? x.photos : product.photos && Array.isArray(product.photos) ? product.photos : [product.image]
      newProducts.push(product)
      existingAsins.add(asinOf(product.affiliateUrl))
    }
    console.log(`✓ ${src.category}: ${picks.length} productos`)
  }

  const merged = existing.concat(newProducts)
  let rank = 1
  for (const p of merged) p.rank = rank++

  writeFileSync(
    new URL('../data/auloava-products.json', import.meta.url),
    JSON.stringify(merged, null, 2) + '\n',
  )

  const byCat = {}
  for (const p of merged) byCat[p.category] = (byCat[p.category] || 0) + 1
  console.log(`\nOK → data/auloava-products.json (${merged.length} productos totales)`)
  console.log('  ' + JSON.stringify(byCat))

  if (DRY_RUN) {
    console.log('\nDry-run: NO se ha publicado en Firebase.')
    return
  }

  const admin = (await import('firebase-admin')).default
  const sa = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))
  if (!admin.apps.length)
    admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL: DATABASE_URL })
  const db = admin.database()

  return (async () => {
    // --- Publica solo los nuevos (no borra nada) ---
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
    const toAdd = newProducts.filter((p) => !remoteAsins.has(asinOf(p.affiliateUrl)))
    const now = new Date().toISOString()
    let added = 0
    for (const p of toAdd) {
      await db.ref('products').push().set({ clicks: 0, createdAt: now, updatedAt: now, ratingCount: p.ratingCount ?? null, ...p })
      added++
    }

    // --- Amplía el nodo niches (unión, sin repetir) ---
    let currentNiches = []
    const n = await db.ref('niches').get()
    if (n.exists() && Array.isArray(n.val())) currentNiches = n.val()
    const newCategories = SOURCES.map((s) => s.category)
    const union = [...new Set([...currentNiches, ...newCategories])]
    await db.ref('niches').set(union)

    console.log(`\nFirebase:`)
    console.log(`  antes: ${remoteCount} productos`)
    console.log(`  añadidos: ${added} (nuevos, sin duplicar)`)
    console.log(`  niches: ${union.length} categorías (${union.join(', ')})`)
    await db.goOffline()
    process.exit(0)
  })()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})