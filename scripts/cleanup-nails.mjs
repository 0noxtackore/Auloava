// Revierte la importación: borra de la web live los 129 productos que este
// script agregó (identificados por su ASIN), dejando intacto el catálogo previo.
import { readFileSync } from 'node:fs'

const ENDPOINT = 'https://auloava.netlify.app/.netlify/functions/agent'
const AGENT_KEY = 'auloava'

const added = JSON.parse(
  readFileSync(new URL('../data/nail-products.json', import.meta.url), 'utf8'),
)
const addedAsins = new Set(added.map((p) => {
  const m = (p.affiliateUrl || '').match(/dp\/([A-Z0-9]{10})/)
  return m ? m[1] : null
}))

function asinOf(url) {
  const m = (url || '').match(/dp\/([A-Z0-9]{10})/)
  return m ? m[1] : null
}

async function list() {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-key': AGENT_KEY },
    body: JSON.stringify({ action: 'list-products' }),
  })
  const d = await res.json()
  return d.products || []
}

async function del(id) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-key': AGENT_KEY },
    body: JSON.stringify({ action: 'delete-product', id }),
  })
  return res.ok
}

const products = await list()
console.log(`Live antes: ${products.length}`)
let removed = 0
for (const p of products) {
  const asin = asinOf(p.affiliateUrl)
  if (asin && addedAsins.has(asin)) {
    const ok = await del(p.id)
    if (ok) removed++
    else console.error(`✗ no se pudo borrar ${p.id}`)
  }
}
const after = await list()
console.log(`Borrados: ${removed}  Live después: ${after.length}`)
