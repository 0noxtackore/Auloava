import { writeFileSync } from 'node:fs'

const AGENT = process.env.AGENT_URL || 'https://auloava.netlify.app/.netlify/functions/agent'
const KEY = process.env.AGENT_KEY || 'auloava'
const PLATFORM = process.env.PLATFORM || 'instagram'
const DISCORD = process.env.DISCORD_WEBHOOK || ''
const CATEGORY = process.env.CATEGORY || ''

async function call(body) {
  const res = await fetch(AGENT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-key': KEY },
    body: JSON.stringify(body),
  })
  return res.json()
}

const list = await call({ action: 'list-products' })
const all = list.products || []
const pool = CATEGORY ? all.filter((p) => (p.category || '').includes(CATEGORY)) : all
if (!pool.length) {
  console.error('No hay productos para', CATEGORY || 'cualquier categoría')
  process.exit(1)
}
const pick = pool[Math.floor(Math.random() * pool.length)]

const gen = await call({ action: 'generate-post', product: pick, platform: PLATFORM })
if (!gen.ok) {
  console.error('generate-post falló:', gen.error)
  process.exit(1)
}

const message = `${gen.draft}\n\n${pick.affiliateUrl}`
console.log('PRODUCTO:', pick.title)
console.log('BORRADOR:\n', message)

if (DISCORD) {
  const r = await fetch(DISCORD, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message }),
  })
  console.log('Publicado en Discord:', r.status)
}

writeFileSync('scripts/.last-social-post.json', JSON.stringify({ product: pick.title, platform: PLATFORM, draft: gen.draft, url: pick.affiliateUrl }, null, 2))
