// ============================================================
// AULOAVA · Enriquecer galería de imágenes (Best Sellers Amazon)
// Scrapea cada página de producto, extrae la galería completa
// (colorImages: ángulos y colores) y guarda:
//   - photos: todas las fotos (SX679)
//   - image:  una de ellas, elegida de forma MIXTA/determinista
//             (no siempre la portada) para que el catálogo varie.
// Uso: node scripts/enrich-gallery.mjs
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'

const baseKey = (u) => {
  const m = u.match(/\/(?:images\/|dp\/images\/)?I\/([A-Za-z0-9+_-]{8,})\./)
  return m ? m[1] : null
}

function parseGallery(html) {
  const idx = html.indexOf('colorImages')
  if (idx < 0) return []
  const from = html.slice(idx)
  const pj = from.indexOf('A.$.parseJSON(')
  if (pj < 0 || pj > 30000) return []
  const start = from.indexOf("'", pj) + 1
  const end = from.indexOf("]'", start)
  if (end < 0 || end - start > 100000) return []
  const raw = from.slice(start, end + 1)
  try {
    let arr
    try {
      arr = JSON.parse(raw)
      if (!Array.isArray(arr)) throw new Error('not array')
    } catch {
      arr = JSON.parse(JSON.parse('"' + raw + '"'))
    }
    const keys = new Set()
    for (const v of arr) {
      ;[v.hiRes, v.large, v.thumb].filter(Boolean).forEach((u) => {
        const b = baseKey(u)
        if (b) keys.add(b)
      })
      if (v && v.main && typeof v.main === 'object') {
        Object.keys(v.main).forEach((u) => {
          const b = baseKey(u)
          if (b) keys.add(b)
        })
      }
    }
    return [...keys]
  } catch {
    return []
  }
}

async function fetchGallery(asin, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`https://www.amazon.com/dp/${asin}`, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()
      return parseGallery(html)
    } catch (err) {
      if (attempt === retries) return []
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
    }
  }
  return []
}

const imgUrl = (key) => `https://images-na.ssl-images-amazon.com/images/I/${key}._AC_SX679_.jpg`

function main() {
  const file = new URL('../data/bestseller-products.json', import.meta.url)
  const products = JSON.parse(readFileSync(file, 'utf8'))
  const asinOf = (p) => (p.affiliateUrl || '').match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1]

  const CONCURRENCY = 5
  let index = 0
  const worker = async () => {
    while (index < products.length) {
      const i = index++
      const p = products[i]
      const asin = asinOf(p)
      let urls = [p.image]
      if (asin) {
        const keys = await fetchGallery(asin)
        if (keys.length) {
          urls = keys.map(imgUrl)
          if (!urls.includes(p.image)) urls.unshift(p.image)
        }
      }
      // Portada (la primera imagen es la principal; alternamos con el resto)
      const coverIdx = urls.indexOf(p.image) >= 0 ? urls.indexOf(p.image) : 0
      const picked = urls[(i + coverIdx) % urls.length] || p.image
      p.photos = urls
      p.image = picked
      console.log(`✔ ${i + 1}/${products.length}  ${p.title.slice(0, 40)}  (${urls.length} fotos)`)
    }
  }

  return Promise.all(Array.from({ length: CONCURRENCY }, worker)).then(() => {
    writeFileSync(file, JSON.stringify(products, null, 2) + '\n')
    const withGallery = products.filter((p) => p.photos && p.photos.length > 1).length
    console.log(`\nOK → data/bestseller-products.json`)
    console.log(`  ${withGallery}/${products.length} productos con galería mixta`)
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})