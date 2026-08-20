// Extrae productos reales de uñas desde las páginas Best Sellers de Amazon.
// No hace scraping de datos de ventas (ilegal); solo lee título, imagen y ASIN
// de la página pública de best-sellers y construye el enlace de afiliado dp.
// Uso: node scripts/fetchAmazonNails.mjs
import { writeFileSync } from 'node:fs'

const PARTNER_TAG = 'auloava-20'

// Nodos de subcategorías de uñas (Beauty > Nail Art & Polish)
const PAGES = [
  { node: '21579733011', category: 'Uñas postizas' },
  { node: '11059311', category: 'Esmalte y nail art' },
  { node: '21579833011', category: 'Lámparas UV' },
  { node: '17242866011', category: 'Cuidado de uñas' },
  { node: '21579734011', category: 'Kits acrílicos' },
]

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0 Safari/537.36'

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
}

function extractProducts(html, category) {
  const out = []
  const re = /data-asin="(B0[A-Z0-9]{8})"/g
  let m
  while ((m = re.exec(html))) {
    const asin = m[1]
    const start = m.index
    const chunk = html.slice(start, start + 4000)
    const img = chunk.match(/<img[^>]*\bsrc="([^"]+)"[^>]*\balt="([^"]*)"/)
    const img2 = chunk.match(/<img[^>]*\balt="([^"]*)"[^>]*\bsrc="([^"]+)"/)
    let image = img ? img[1] : img2 ? img2[2] : ''
    let title = img ? img[2] : img2 ? img2[1] : ''
    if (!title) {
      const t = chunk.match(/class="[^"]*p13n-sc-css-line-clamp[^"]*"[^>]*>([^<]+)</)
      title = t ? t[1] : ''
    }
    const priceM = chunk.match(/\$([0-9]+(?:\.[0-9]{2})?)/)
    const price = priceM ? Number(priceM[1]) : null
    if (!asin || !title) continue
    out.push({
      asin,
      title: decode(title.trim()),
      image: image.startsWith('//') ? 'https:' + image : image,
      price,
      category,
    })
  }
  return out
}

async function main() {
  const all = []
  for (const p of PAGES) {
    const url = `https://www.amazon.com/Best-Sellers-${encodeURIComponent(
      p.category,
    )}/zgbs/beauty/${p.node}`
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html' },
      })
      const html = await res.text()
      const items = extractProducts(html, p.category)
      console.log(`✓ ${p.category} (${p.node}): ${items.length} productos`)
      all.push(...items)
    } catch (e) {
      console.error(`✗ ${p.category}: ${e.message}`)
    }
  }
  const seen = new Set()
  const unique = all.filter((p) => {
    if (seen.has(p.asin)) return false
    seen.add(p.asin)
    return true
  })
  console.log(`\nTotal únicos: ${unique.length}`)

  const products = unique.map((p, i) => ({
    title: p.title,
    platform: 'amazon',
    category: p.category,
    price: p.price ?? 9.99,
    originalPrice: p.price ? Math.round(p.price * 1.4 * 100) / 100 : 15.99,
    rating: 4.5,
    commission: 10,
    stock: 300,
    image: p.image,
    affiliateUrl: `https://www.amazon.com/dp/${p.asin}?tag=${PARTNER_TAG}`,
  }))
  writeFileSync(
    new URL('../data/nail-products.json', import.meta.url),
    JSON.stringify(products, null, 2),
  )
  console.log(`Guardado data/nail-products.json con ${products.length} productos`)
}
main()
