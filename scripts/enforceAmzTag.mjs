// One-time: garantiza que TODOS los enlaces de Amazon en la BD live
// tengan el tag y el param de atribucion: ?tag=auloava-20&th=1
// (el agente ya canoniza el enlace al guardar; este script solo dispara
//  la actualizacion de los productos que no cumplan todavia).
const ENDPOINT = 'https://auloava.netlify.app/.netlify/functions/agent'
const AGENT_KEY = 'auloava'

const ASIN_RE = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i
const COMPLIANT_RE = /^https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]{10}\?tag=auloava-20&th=0$/i

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
let checked = 0
let fixed = 0

for (const p of products) {
  const url = p.affiliateUrl || p.url || ''
  const isAmazon = ASIN_RE.test(url) || /amazon\./i.test(url)
  if (!isAmazon) continue
  checked++
  if (COMPLIANT_RE.test(url)) continue
  // El agente canoniza y anhade ?tag=auloava-20&th=1 al guardar.
  const ok = await update(p.id, { affiliateUrl: url, platform: 'amazon' })
  if (ok) fixed++
}

console.log(`Amazon en BD: ${checked} | corregidos: ${fixed}`)
