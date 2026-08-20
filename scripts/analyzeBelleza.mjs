// Analiza los productos de categoria "Belleza" en la BD live:
// Enlaces de afiliado de Amazon (formato, tag, dominio), imagenes y precio.
import { writeFileSync } from 'node:fs'

const ENDPOINT = 'https://auloava.netlify.app/.netlify/functions/agent'
const AGENT_KEY = 'auloava'
const PARTNER_TAG = 'auloava-20'

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-agent-key': AGENT_KEY },
  body: JSON.stringify({ action: 'list-products' }),
})
const data = await res.json()
const products = data.products || []

const belleza = products.filter(
  (p) => (p.category || '').trim().toLowerCase() === 'belleza',
)

function analyze(p) {
  const url = p.affiliateUrl || ''
  const img = p.image || ''
  const dp = url.match(/amazon\.[a-z.]+\/dp\/([A-Z0-9]{10})/i)
  const isSearch = /amazon\.[a-z.]+\/s\?/i.test(url)
  const hasTag = url.includes('tag=' + PARTNER_TAG)
  const domainOk = /amazon\.(com|es|[a-z]{2})\b/i.test(url) || isSearch
  const wrongTag = /tag=[^&]+/.test(url) && !hasTag
  const imgOk =
    /amazon|ssl-images-amazon|media-amazon/i.test(img) || img.startsWith('https://')
  return {
    id: p.id,
    title: (p.title || '').slice(0, 70),
    platform: p.platform,
    price: p.price,
    issues: [
      !url && 'SIN_URL',
      !dp && !isSearch && 'NO_ES_DP_NI_SEARCH',
      isSearch && 'ES_BUSQUEDA_NO_PRODUCTO',
      !hasTag && 'SIN_TAG_AFILIADO',
      wrongTag && 'TAG_DISTINTO',
      !domainOk && 'DOMINIO_NO_AMAZON',
      !imgOk && 'IMAGEN_INVALIDA',
      !(p.price > 0) && 'SIN_PRECIO',
    ].filter(Boolean),
    url,
  }
}

const rows = belleza.map(analyze)
const withIssues = rows.filter((r) => r.issues.length)
const searchLinks = rows.filter((r) => r.issues.includes('ES_BUSQUEDA_NO_PRODUCTO'))
const noTag = rows.filter((r) => r.issues.includes('SIN_TAG_AFILIADO'))
const noImg = rows.filter((r) => r.issues.includes('IMAGEN_INVALIDA'))
const noPrice = rows.filter((r) => r.issues.includes('SIN_PRECIO'))

const report = {
  totalBelleza: belleza.length,
  totalProductos: products.length,
  conProblemas: withIssues.length,
  busquedaEnLugarDeProducto: searchLinks.length,
  sinTagAfiliado: noTag.length,
  imagenInvalida: noImg.length,
  sinPrecio: noPrice.length,
  detalle: rows.map((r) => ({
    title: r.title,
    platform: r.platform,
    issues: r.issues,
    url: r.url,
  })),
}
writeFileSync(new URL('../data/_belleza_analysis.json', import.meta.url), JSON.stringify(report, null, 2))

console.log('=== ANÁLISIS BELLEZA ===')
console.log(`Total productos BD: ${products.length}`)
console.log(`Belleza: ${belleza.length}  | con problemas: ${withIssues.length}`)
console.log(`  - enlaces de BÚSQUEDA (no producto): ${searchLinks.length}`)
console.log(`  - sin tag de afiliado: ${noTag.length}`)
console.log(`  - imagen inválida: ${noImg.length}`)
console.log(`  - sin precio: ${noPrice.length}`)
console.log('\nPrimeros 15 con problemas:')
for (const r of withIssues.slice(0, 15)) {
  console.log(` • [${r.issues.join(', ')}] ${r.title}`)
  console.log(`     ${r.url}`)
}
console.log(`\nDetalle completo en data/_belleza_analysis.json`)
