// Añade exactamente 35 productos de uñas (reales, con enlace de producto y
// imagen reales) al catálogo live, sin tocar el resto. También deja
// data/nail-products.json con esos 35 para que sea la fuente coherente.
import { readFileSync, writeFileSync } from 'node:fs'

const ENDPOINT = 'https://auloava.netlify.app/.netlify/functions/agent'
const AGENT_KEY = 'auloava'

const all = JSON.parse(
  readFileSync(new URL('../data/nail-products.json', import.meta.url), 'utf8'),
)

// 7 productos de cada categoría (reparte equitativamente los 35)
const byCat = {}
for (const p of all) (byCat[p.category] ||= []).push(p)
const cats = Object.keys(byCat)
const per = Math.floor(35 / cats.length)
let selected = []
for (const c of cats) selected.push(...byCat[c].slice(0, per))
while (selected.length < 35) {
  for (const c of cats) {
    if (selected.length >= 35) break
    if (byCat[c].length > per) selected.push(byCat[c][per])
  }
}
selected = selected.slice(0, 35)

writeFileSync(
  new URL('../data/nail-products.json', import.meta.url),
  JSON.stringify(selected, null, 2),
)

let ok = 0
let fail = 0
for (const p of selected) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-key': AGENT_KEY },
    body: JSON.stringify({ action: 'create-product', product: p }),
  })
  const d = await res.json().catch(() => ({}))
  if (res.ok && d.ok) ok++
  else {
    fail++
    console.error(`✗ ${p.title}: ${d.error || res.status}`)
  }
}
console.log(`Añadidos: ${ok}  Fallidos: ${fail}  (catálogo queda en ${165 + ok})`)
