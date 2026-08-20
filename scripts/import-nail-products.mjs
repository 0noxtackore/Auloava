// Importa los productos de uñas a la catálogo vivo (Firebase vía la Netlify Function).
// Uso: node scripts/import-nail-products.mjs
const fs = await import('node:fs')
const products = JSON.parse(fs.readFileSync(new URL('../data/nail-products.json', import.meta.url), 'utf8'))

const ENDPOINT = 'https://auloava.netlify.app/.netlify/functions/agent'
const AGENT_KEY = 'auloava'

let ok = 0
let fail = 0
for (const p of products) {
  const body = JSON.stringify({ action: 'create-product', product: p })
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-agent-key': AGENT_KEY },
      body,
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.ok) {
      ok++
      console.log(`✓ #${ok} ${p.title}`)
    } else {
      fail++
      console.error(`✗ ${p.title}: ${data.error || res.status}`)
    }
  } catch (e) {
    fail++
    console.error(`✗ ${p.title}: ${e.message}`)
  }
}
console.log(`\nImportados: ${ok}  Fallidos: ${fail}  Total: ${products.length}`)
