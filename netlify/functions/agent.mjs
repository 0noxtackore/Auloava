// ============================================================
// AULOAVA · Agente de AliExpress (Netlify Function)
// Backend serverless SIN navegador: usa la API oficial de AliExpress
// Affiliate (HTTP), por lo que NO requiere puppeteer/Chromium y
// compila sin problemas en Netlify.
//
// Requisitos (variables de entorno):
//   ALIEXPRESS_APP_KEY     -> app key de la API de afiliados
//   ALIEXPRESS_APP_SECRET  -> app secret
//   ALIEXPRESS_TRACKING_ID -> tracking id de tu cuenta de afiliado
//   FIREBASE_SERVICE_ACCOUNT + FIREBASE_DATABASE_URL -> para guardar productos
//
// Flujo "import-products":
//   1) busca productos con aliexpress.affiliate.product.query
//   2) genera el link de afiliado con aliexpress.affiliate.link.generate
//   3) guarda en el catálogo real (Firebase Realtime DB)
// ============================================================

import crypto from 'node:crypto'
import axios from 'axios'

const AGENT_KEY = process.env.AGENT_API_KEY || ''
const APP_KEY = process.env.ALIEXPRESS_APP_KEY || ''
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET || ''
const TRACKING_ID = process.env.ALIEXPRESS_TRACKING_ID || ''
const SEARCH = process.env.AGENT_SEARCH || 'gadgets'
const COUNT = Math.max(1, parseInt(process.env.AGENT_COUNT || '12', 10))
const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase()
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL || ''

// AliExpress
// Amazon (PA-API 5.0)
const AMZ_PARTNER_TAG = process.env.AMAZON_PARTNER_TAG || ''
const AMZ_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY || ''
const AMZ_SECRET_KEY = process.env.AMAZON_SECRET_KEY || ''
const AMZ_HOST = process.env.AMAZON_HOST || 'webservices.amazon.com'
const AMZ_REGION = process.env.AMAZON_REGION || 'us-east-1'

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-agent-key',
}

const GATEWAY = 'https://gw.api.aliexpress.com/openapi/param2/1/portals'

let _adminApp = null

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS }

  const key = event.headers['x-agent-key'] || event.headers['X-Agent-Key'] || ''
  if (!AGENT_KEY || key !== AGENT_KEY) {
    return {
      statusCode: 401,
      headers: HEADERS,
      body: JSON.stringify({
        ok: false,
        error: 'No autorizado',
        diagnostic: {
          agentKeySet: Boolean(AGENT_KEY),
          keyProvided: Boolean(key),
          envAgentKeys: Object.keys(process.env)
            .filter((k) => k.toUpperCase().includes('AGENT'))
            .sort(),
        },
      }),
    }
  }

  let payload = {}
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    payload = {}
  }

  const action = payload.action || 'ping'

  try {
    if (action === 'ping') {
      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({
          ok: true,
          apiConfigured: Boolean(APP_KEY && APP_SECRET && TRACKING_ID),
          firebase: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT),
          agentKeySet: Boolean(AGENT_KEY),
          aiConfigured: Boolean(AI_API_KEY),
          aliExpress: { api: Boolean(APP_KEY && APP_SECRET && TRACKING_ID), trackingId: TRACKING_ID || null },
          amazon: {
            config: Boolean(AMZ_ACCESS_KEY && AMZ_SECRET_KEY && AMZ_PARTNER_TAG),
            partnerTag: AMZ_PARTNER_TAG || null,
          },
        }),
      }
    }

    if (action === 'import-products') {
      const result = await importProducts()
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify(result) }
    }

    if (action === 'generate') {
      const result = await generateDrafts()
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify(result) }
    }

    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ ok: false, error: 'Acción no soportada' }) }
  } catch (err) {
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ ok: false, error: String(err?.message || err) }) }
  }
}

// ---------- Cliente API AliExpress (TOP, signing MD5) ----------
function sign(params, secret) {
  const qs = Object.keys(params)
    .sort()
    .map((k) => k + params[k])
    .join('')
  return crypto.createHash('md5').update(secret + qs + secret, 'utf8').digest('hex').toUpperCase()
}

async function callApi(method, params) {
  const base = {
    method,
    app_key: APP_KEY,
    sign_method: 'md5',
    timestamp: new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    format: 'json',
    v: '2.0',
    ...params,
  }
  base.sign = sign(base, APP_SECRET)
  const url = `${GATEWAY}/${method}/${APP_KEY}`
  const res = await axios.post(url, new URLSearchParams(base).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 30000,
  })
  return res.data
}

// ---------- Importación ----------
async function importProducts() {
  if (!APP_KEY || !APP_SECRET || !TRACKING_ID) {
    return {
      ok: false,
      error:
        'Faltan credenciales de la API de afiliados (ALIEXPRESS_APP_KEY, ALIEXPRESS_APP_SECRET, ALIEXPRESS_TRACKING_ID).',
    }
  }

  const search = await callApi('aliexpress.affiliate.product.query', {
    keywords: SEARCH,
    page_no: 1,
    page_size: COUNT,
    sort: 'commissionDesc',
  })

  const list = search?.aliexpress_affiliate_product_query_response?.result_list?.product_list || []
  if (!list.length) {
    return { ok: false, error: 'La API no devolvió productos. Revisa la búsqueda o las credenciales.', raw: search }
  }

  const products = []
  for (const p of list.slice(0, COUNT)) {
    const id = String(p.product_id)
    const detailUrl = p.product_detail_url || `https://www.aliexpress.com/item/${id}.html`

    let affiliateUrl = detailUrl
    try {
      const link = await callApi('aliexpress.affiliate.link.generate', {
        tracking_id: TRACKING_ID,
        link_type: '0',
        product_ids: id,
      })
      affiliateUrl =
        link?.aliexpress_affiliate_link_generate_response?.result_list?.promotion_links?.[0]
          ?.promotion_link || detailUrl
    } catch {
      /* usa URL cruda si falla la generación */
    }

    products.push({
      id: `ax-${id}`,
      title: p.product_title || '',
      image: p.product_main_image_url || (p.image_urls && p.image_urls[0]) || '',
      priceText: p.sale_price ? `${p.sale_price} ${p.sale_price_currency || ''}`.trim() : '',
      url: detailUrl,
      affiliateUrl,
      commission: p.commission_rate ? `${p.commission_rate}%` : '',
      source: 'aliexpress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  let saved = false
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    await saveToStore(products)
    saved = true
  }

  return {
    ok: true,
    count: products.length,
    saved,
    sample: products.slice(0, 3).map((p) => ({ title: p.title, affiliateUrl: p.affiliateUrl })),
  }
}

// ---------- Persistencia en Firebase ----------
async function saveToStore(products) {
  if (!_adminApp) {
    const admin = await import('firebase-admin')
    const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    _adminApp = admin.initializeApp({
      credential: admin.credential.cert(svc),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    })
  }
  const { getDatabase } = await import('firebase-admin/database')
  const db = getDatabase(_adminApp)
  await db.ref('products').set(products)
}

async function loadProducts() {
  if (!_adminApp) {
    const admin = await import('firebase-admin')
    const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    _adminApp = admin.initializeApp({
      credential: admin.credential.cert(svc),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    })
  }
  const { getDatabase } = await import('firebase-admin/database')
  const db = getDatabase(_adminApp)
  const snap = await db.ref('products').get()
  if (!snap.exists()) return []
  const obj = snap.val()
  return Object.entries(obj).map(([id, d]) => ({ id, ...d }))
}

// ---------- Capa de IA (OpenAI / Claude) ----------
async function callAI(system, prompt) {
  if (!AI_API_KEY) throw new Error('Falta AI_API_KEY (define AI_PROVIDER y AI_API_KEY en el servidor).')
  if (AI_PROVIDER === 'openai') {
    const r = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: AI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      },
      { headers: { Authorization: `Bearer ${AI_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 30000 },
    )
    return r.data.choices[0].message.content.trim()
  }
  if (AI_PROVIDER === 'claude') {
    const r = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: AI_MODEL || 'claude-3-5-sonnet-latest',
        max_tokens: 600,
        system,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: { 'x-api-key': AI_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        timeout: 30000,
      },
    )
    return r.data.content[0].text.trim()
  }
  throw new Error(`AI_PROVIDER no soportado: ${AI_PROVIDER}`)
}

// ---------- Generación de borradores sociales (80% IA) ----------
async function generateDrafts() {
  if (!AI_API_KEY) {
    return { ok: false, error: 'Falta la IA: define AI_PROVIDER y AI_API_KEY en el servidor.' }
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    return { ok: false, error: 'Falta FIREBASE_SERVICE_ACCOUNT para leer productos y guardar borradores.' }
  }

  const products = await loadProducts()
  if (!products.length) {
    return { ok: false, error: 'No hay productos en la BD. Importa productos primero.' }
  }

  const networks = ['tiktok', 'reddit', 'facebook']
  const system =
    'Eres un redactor de afiliados experto. Escribes posts cortos y persuasivos para promocionar ' +
    'productos de AliExpress/Amazon/Alibaba. Nunca inventes enlaces; usa el que se te da. ' +
    'Tono acorde a cada red. Responde SOLO con el texto del post, sin explicaciones.'

  let created = 0
  for (const p of products.slice(0, COUNT)) {
    for (const net of networks) {
      const prompt =
        `Producto: ${p.title}\nPrecio: ${p.priceText || 'ver enlace'}\nEnlace afiliado: ${p.affiliateUrl || p.url || ''}\n` +
        `Red: ${net}. Escribe un post atractivo (con 2-4 hashtags y un CTA). Máx 220 palabras.`
      let copy = ''
      try {
        copy = await callAI(system, prompt)
      } catch (e) {
        copy = `[borrador pendiente] ${p.title} — ${p.affiliateUrl || p.url || ''}`
      }
      await saveDraft({
        productId: p.id,
        network: net,
        copy,
        status: 'pending',
      })
      created++
    }
  }

  return { ok: true, created, note: 'Borradores en cola de aprobación (80% IA / 20% humano).' }
}

async function saveDraft(draft) {
  if (!_adminApp) {
    const admin = await import('firebase-admin')
    const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    _adminApp = admin.initializeApp({
      credential: admin.credential.cert(svc),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    })
  }
  const { getDatabase } = await import('firebase-admin/database')
  const db = getDatabase(_adminApp)
  const now = new Date().toISOString()
  await db.ref('socialDrafts').push({ ...draft, createdAt: now, updatedAt: now })
}
