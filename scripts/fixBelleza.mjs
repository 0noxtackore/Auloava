// Corrige los productos de la categoria "Belleza" en la BD live:
// reemplaza los placeholders (enlaces de busqueda + imagen picsum) por
// productos reales de uñas con enlace de producto /dp/ y tag auloava-20.
import { readFileSync } from 'node:fs'

const ENDPOINT = 'https://auloava.netlify.app/.netlify/functions/agent'
const AGENT_KEY = 'auloava'

const real = JSON.parse(
  readFileSync(new URL('../data/nail-products.json', import.meta.url), 'utf8'),
)
const realAsins = new Set(
  real.map((p) => (p.affiliateUrl.match(/dp\/([A-Z0-9]{10})/) || [])[1]),
)

async function list() {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-key': AGENT_KEY },
    body: JSON.stringify({ action: 'list-products' }),
  })
  return (await res.json()).products || []
}

async function update(id, product) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-key': AGENT_KEY },
    body: JSON.stringify({ action: 'update-product', id, product }),
  })
  return res.ok
}

const products = await list()

// Productos reales que AUN no estan en la BD (evita duplicar ASIN).
const dbAsins = new Set(
  products
    .map((p) => (p.affiliateUrl || '').match(/dp\/([A-Z0-9]{10})/) || [])
    .map((m) => m[1])
    .filter(Boolean),
)
const pool = real.filter((p) => {
  const asin = (p.affiliateUrl.match(/dp\/([A-Z0-9]{10})/) || [])[1]
  return asin && !dbAsins.has(asin)
})

// Placeholders en Belleza: enlace de busqueda (/s?k=) en vez de /dp/.
const placeholders = products.filter(
  (p) =>
    (p.category || '').trim().toLowerCase() === 'belleza' &&
    /\/s\?k=/.test(p.affiliateUrl || ''),
)

console.log(`Placeholders en Belleza: ${placeholders.length}`)
console.log(`Pool de productos reales disponibles: ${pool.length}`)

let ok = 0
let fail = 0
for (let i = 0; i < placeholders.length; i++) {
  const target = placeholders[i]
  const realP = pool[i]
  if (!realP) {
    console.error('✗ se agotó el pool real para ' + target.id)
    fail++
    continue
  }
  const updated = {
    ...target,
    title: realP.title,
    image: realP.image,
    affiliateUrl: realP.affiliateUrl,
    price: realP.price,
    originalPrice: realP.originalPrice,
    rating: realP.rating,
    commission: realP.commission,
    stock: realP.stock,
    category: 'Belleza',
  }
  const res = await update(target.id, updated)
  if (res) {
    ok++
    console.log(`✓ ${realP.title.slice(0, 50)}`)
  } else {
    fail++
    console.error(`✗ ${target.id}`)
  }
}
console.log(`\nActualizados: ${ok}  Fallidos: ${fail}`)
