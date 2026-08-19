// ============================================================
// AULOAVA · Generador de borradores en lote (script)
// Lee los productos de Firebase y genera un borrador de post por
// producto con OpenRouter, volcándolos a scripts/posts-drafts.md.
//
// Uso:
//   OPENROUTER_API_KEY=sk-or-v1-... node scripts/generatePosts.mjs
//   OPENROUTER_API_KEY=... LIMIT=20 node scripts/generatePosts.mjs
// ============================================================
import { readFileSync } from 'node:fs'
import { writeFileSync } from 'node:fs'
import admin from 'firebase-admin'

const KEY = process.env.OPENROUTER_API_KEY
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
const LIMIT = Number(process.env.LIMIT || '0') || 0
const DELAY = Number(process.env.DELAY || '800')

if (!KEY) {
  console.error('Falta OPENROUTER_API_KEY. Usa: OPENROUTER_API_KEY=sk-... node scripts/generatePosts.mjs')
  process.exit(1)
}

const sa = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))
admin.initializeApp({
  credential: admin.credential.cert(sa),
  databaseURL: 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app',
})
const db = admin.database()

const PROMPT_SYSTEM = [
  'Eres un redactor de contenido para redes sociales, experto en marketing de afiliados.',
  'Crea un borrador ORIGINAL de post para TikTok a partir de la información de un producto.',
  'REGLAS:',
  '1) No copies ni plagies descripciones ajenas; escribe con tus propias palabras.',
  '2) Estilo cercano, entusiasta y breve, adecuado a TikTok (frases cortas, gancho inicial).',
  '3) Incluye al final entre 5 y 10 hashtags relevantes y populares.',
  '4) Devuelve SOLO el texto del post (caption + hashtags). Sin explicaciones ni comillas.',
  'Referencia de estilo (NO copiar, sólo inspirarse): "Clean and protect virtually all of your interior surfaces with Total Interior Cleaner & Protectant! #detailing #springcleaning #cars #truck #clean #interior #beforeandafter #easy #simple #protect"',
].join(' ')

function userPrompt(p) {
  return [
    `Producto: ${p.title || ''}`,
    `Categoría: ${p.category || ''}`,
    `Descripción original (sólo referencia, NO copiar): ${p.description || ''}`,
    `Plataforma: tiktok`,
    ``,
    `Crea el borrador.`,
  ].join('\n')
}

async function generate(p) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEY}`,
      'HTTP-Referer': 'https://auloava.app',
      'X-Title': 'Auloava',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: PROMPT_SYSTEM },
        { role: 'user', content: userPrompt(p) },
      ],
      temperature: 0.9,
      max_tokens: 300,
    }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`OpenRouter ${res.status}: ${txt.slice(0, 200)}`)
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content?.trim() || ''
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const snap = await db.ref('products').get()
if (!snap.exists()) {
  console.error('No hay productos en la BD.')
  process.exit(1)
}
let list = Object.entries(snap.val()).map(([id, p]) => ({ id, ...p }))
if (LIMIT > 0) list = list.slice(0, LIMIT)

const lines = ['# Borradores para TikTok (Auloava)', '']
let ok = 0
let fail = 0

for (const p of list) {
  try {
    const draft = await generate(p)
    ok++
    lines.push(`## ${p.title || p.id}`)
    lines.push(`- Categoría: ${p.category || '—'}`)
    lines.push(`- Enlace: ${p.affiliateUrl || '—'}`)
    lines.push('')
    lines.push(draft)
    lines.push('')
    lines.push('---')
    lines.push('')
    console.log(`✔ ${p.title || p.id}`)
  } catch (e) {
    fail++
    lines.push(`## ${p.title || p.id}`)
    lines.push(`ERROR: ${e.message}`)
    lines.push('---')
    lines.push('')
    console.error(`✖ ${p.title || p.id}: ${e.message}`)
  }
  await sleep(DELAY)
}

writeFileSync(new URL('./posts-drafts.md', import.meta.url), lines.join('\n'), 'utf8')
console.log(`\nListo. ${ok} generados, ${fail} fallidos. -> scripts/posts-drafts.md`)
process.exit(0)
