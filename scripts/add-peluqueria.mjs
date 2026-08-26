// Busca productos de peluquería en Amazon a partir de una URL de búsqueda,
// extrae los ASIN y los agrega al catálogo (Firebase) vía el agente.
// Uso: node scripts/add-peluqueria.mjs
const AGENT = process.env.AGENT_URL || 'https://auloava.netlify.app/.netlify/functions/agent'
const KEY = process.env.AGENT_KEY || 'auloava'

const SEARCH =
  'https://www.amazon.com/s?k=kit+de+peluqueria+profesional&rh=p_n_g-101014971069111%3A119653281011&s=exact-aware-popularity-rank&dc&ds=v1%3AefAZ7foQbG7YFYhDCTfrQF0LgPzw02YG1808I3sToyg'

const MAX = 15

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

async function call(body) {
  const res = await fetch(AGENT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-key': KEY },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function getSearchHtml() {
  const res = await fetch(SEARCH, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' },
    redirect: 'follow',
  })
  return res.text()
}

function extractAsins(html) {
  const set = new Set()
  const re = /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/g
  let m
  while ((m = re.exec(html))) set.add(m[1])
  // También formato /gp/product/
  const re2 = /\/gp\/product\/([A-Z0-9]{10})/g
  while ((m = re2.exec(html))) set.add(m[1])
  return [...set]
}

const html = await getSearchHtml()
const asins = extractAsins(html)
console.log('ASINs encontrados:', asins.length)

let added = 0
for (const asin of asins.slice(0, MAX)) {
  const url = `https://www.amazon.com/dp/${asin}`
  const scraped = await call({ action: 'scrape', url })
  if (!scraped.ok) {
    console.error('SCRAPE FALLÓ', asin, scraped.error)
    continue
  }
  const { id, ...product } = scraped
  const created = await call({ action: 'create-product', product })
  if (created.ok) {
    added++
    console.log('AGREGADO:', created.product?.title || asin, '->', created.product?.affiliateUrl)
  } else {
    console.error('CREATE FALLÓ', asin, created.error)
  }
}
console.log(`\nTotal agregados: ${added}`)
