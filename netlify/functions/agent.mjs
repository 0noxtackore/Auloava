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
import admin from 'firebase-admin'
import { getDatabase } from 'firebase-admin/database'

const AGENT_KEY = process.env.AGENT_API_KEY || ''
const APP_KEY = process.env.ALIEXPRESS_APP_KEY || ''
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET || ''
const TRACKING_ID = process.env.ALIEXPRESS_TRACKING_ID || ''
const SEARCH = process.env.AGENT_SEARCH || 'gadgets'
const COUNT = Math.max(1, parseInt(process.env.AGENT_COUNT || '12', 10))

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

    if (action === 'scrape') {
      const result = await scrapeProduct(payload.url)
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify(result) }
    }

    // ---------- CRUD de productos (persistencia real en Firebase) ----------
    if (action === 'list-products') {
      const db = ensureAdmin()
      const snap = await db.ref('products').get()
      if (!snap.exists()) return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, products: [] }) }
      const obj = snap.val()
      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ ok: true, products: Object.entries(obj).map(([id, d]) => ({ id, ...d })) }),
      }
    }

    if (action === 'get-product') {
      const db = ensureAdmin()
      const snap = await db.ref(`products/${payload.id}`).get()
      if (!snap.exists()) return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ ok: false, error: 'Producto no encontrado' }) }
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, product: { id: payload.id, ...snap.val() } }) }
    }

    if (action === 'create-product') {
      const db = ensureAdmin()
      const now = new Date().toISOString()
      const product = { clicks: 0, createdAt: now, updatedAt: now, ...(payload.product || {}) }
      if (!product.affiliateUrl && product.url) product.affiliateUrl = product.url
      product.affiliateUrl = injectAffiliateTag(product.affiliateUrl || '', product.platform)
      const newRef = db.ref('products').push()
      await newRef.set(product)
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, product: { id: newRef.key, ...product } }) }
    }

    if (action === 'update-product') {
      const db = ensureAdmin()
      const updated = { ...(payload.product || {}), updatedAt: new Date().toISOString() }
      if (!updated.affiliateUrl && updated.url) updated.affiliateUrl = updated.url
      updated.affiliateUrl = injectAffiliateTag(updated.affiliateUrl || '', updated.platform)
      await db.ref(`products/${payload.id}`).update(updated)
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, product: { id: payload.id, ...updated } }) }
    }

    if (action === 'delete-product') {
      const db = ensureAdmin()
      await db.ref(`products/${payload.id}`).remove()
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) }
    }

    // ---------- Nichos (categorías) para el onboarding ----------
    async function getNiches() {
      const ndb = ensureAdmin()
      const [prodSnap, nicheSnap] = await Promise.all([
        ndb.ref('products').get(),
        ndb.ref('niches').get(),
      ])
      const set = new Set()
      if (prodSnap.exists()) {
        Object.values(prodSnap.val() || {}).forEach((p) => {
          const c = ((p && p.category) || '').trim()
          if (c) set.add(c)
        })
      }
      if (nicheSnap.exists()) {
        const v = nicheSnap.val()
        const arr = Array.isArray(v) ? v : Object.values(v || {})
        arr.forEach((n) => {
          const name = n && typeof n === 'object' ? n.name : n
          if (name && String(name).trim()) set.add(String(name).trim())
        })
      }
      return [...set].sort((a, b) => a.localeCompare(b))
    }

    if (action === 'list-niches') {
      const niches = await getNiches()
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, niches }) }
    }

    if (action === 'create-niche') {
      const name = String(payload.name || '').trim()
      if (!name) {
        return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ ok: false, error: 'Falta el nombre del nicho' }) }
      }
      const ndb = ensureAdmin()
      const snap = await ndb.ref('niches').get()
      const list = snap.exists()
        ? (Array.isArray(snap.val())
            ? snap.val()
            : Object.values(snap.val() || {}).map((n) => (n && n.name) || n)
          ).map(String).map((s) => s.trim()).filter(Boolean)
        : []
      if (!list.includes(name)) list.push(name)
      await ndb.ref('niches').set(list)
      const niches = await getNiches()
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, niches }) }
    }

    // ---------- Perfil de usuario (nichos elegidos) ----------
    if (action === 'get-profile') {
      const ndb = ensureAdmin()
      const snap = await ndb.ref(`users/${payload.uid}`).get()
      const profile = snap.exists() ? { id: payload.uid, ...snap.val() } : null
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, profile }) }
    }

    if (action === 'save-profile') {
      const ndb = ensureAdmin()
      const { uid, email, niches } = payload
      if (!uid) {
        return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ ok: false, error: 'Falta uid' }) }
      }
      const now = new Date().toISOString()
      const snap = await ndb.ref(`users/${uid}`).get()
      const existing = snap.exists() ? snap.val() : {}
      const profile = {
        ...existing,
        email: email || existing.email || '',
        niches: Array.isArray(niches) ? niches : existing.niches || [],
        updatedAt: now,
      }
      if (!existing.createdAt) profile.createdAt = now
      await ndb.ref(`users/${uid}`).set(profile)
      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ ok: true, profile: { id: uid, ...profile } }),
      }
    }

    // Acumulador de clicks: suma +1 al contador del producto (atómico)
    if (action === 'click-product') {
      const db = ensureAdmin()
      const ref = db.ref(`products/${payload.id}`)
      const snap = await ref.get()
      if (!snap.exists()) {
        return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ ok: false, error: 'Producto no encontrado' }) }
      }
      await ref.update({ clicks: admin.database.ServerValue.increment(1) })
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) }
    }

    // Genera un borrador de post para redes (TikTok/IG) con IA (OpenRouter)
    if (action === 'generate-post') {
      const result = await generateSocialPost(payload.product || {}, payload.platform || 'tiktok')
      return {
        statusCode: result.ok ? 200 : 502,
        headers: HEADERS,
        body: JSON.stringify({ ok: result.ok, draft: result.draft || '', error: result.error || null }),
      }
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
    const svc = parseServiceAccount()
    _adminApp = admin.initializeApp({
      credential: admin.credential.cert(svc),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    })
  }
  const { getDatabase } = await import('firebase-admin/database')
  const db = getDatabase(_adminApp)
  await db.ref('products').set(products)
}

// Parsea la cuenta de servicio de Firebase. Soporta el valor en base64
// (recomendado en Netlify para evitar problemas con los "\n" del PEM) y
// normaliza el private_key por si llega con saltos de línea literales.
function parseServiceAccount() {
  let raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
  if (/^[A-Za-z0-9+/=]+$/.test(raw)) {
    raw = Buffer.from(raw, 'base64').toString('utf8')
  }
  const svc = JSON.parse(raw)
  if (svc.private_key && svc.private_key.includes('\\n')) {
    svc.private_key = svc.private_key.replace(/\\n/g, '\n')
  }
  return svc
}

function ensureAdmin() {
  if (!_adminApp) {
    const svc = parseServiceAccount()
    _adminApp = admin.initializeApp({
      credential: admin.credential.cert(svc),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    })
  }
  return getDatabase(_adminApp)
}

// ---------- Scraper ligero (sin navegador) para auto-rellenar desde URL ----------
function detectPlatform(url) {
  const u = (url || '').toLowerCase()
  if (u.includes('amazon.')) return 'amazon'
  if (u.includes('aliexpress')) return 'aliexpress'
  if (u.includes('alibaba')) return 'alibaba'
  return 'aliexpress'
}

async function scrapeProduct(rawUrl) {
  if (!rawUrl) return { ok: false, error: 'Falta la URL del producto.' }
  const res = await axios.get(rawUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    },
    timeout: 20000,
    maxRedirects: 5,
    responseType: 'text',
  })
  const html = res.data || ''
  const meta = (name) => {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const m1 = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]*content=["']([^"']*)["']`, 'i'),
    )
    if (m1) return m1[1]
    const m2 = html.match(
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${esc}["']`, 'i'),
    )
    return m2 ? m2[1] : ''
  }
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  let title = (meta('og:title') || meta('twitter:title') || (titleTag && titleTag[1]) || '').trim()
  const ptMatch = html.match(/id="productTitle"[^>]*>([^<]+)</i)
  if (ptMatch) title = ptMatch[1].trim()
  title = title.replace(/^amazon\.com[^:]*:\s*/i, '').trim()

  let image = (meta('og:image') || meta('twitter:image') || '').trim()
  if (!image) {
    const li = html.match(/id="landingImage"[^>]*\ssrc="([^"]+)"/i) || html.match(/id="landingImage"[^>]*\sdata-old-hires="([^"]+)"/i)
    if (li) image = li[1]
    if (!image) {
      const dyn = html.match(/data-a-dynamic-image="([^"]+)"/i)
      if (dyn) {
        try {
          const obj = JSON.parse(dyn[1].replace(/&quot;/g, '"'))
          const first = Object.keys(obj)[0]
          if (first) image = first
        } catch {
          /* ignora */
        }
      }
    }
  }

  // Galería de imágenes reales (Amazon) para que el admin elija la portada
  const imageIds = extractGallery(html)
  if (imageIds.length === 0 && image) {
    const m = image.match(/\/I\/([^"\\]+?)\.(?:_AC|jpg|webp)/)
    if (m) imageIds.push(m[1])
  }
  const images = imageIds.map(
    (id) => `https://images-na.ssl-images-amazon.com/images/I/${id}._AC_SX679_.jpg`,
  )
  if (!image && images.length) image = images[0]

  let description = ''
  const fb = html.match(/id="feature-bullets"[^>]*>([\s\S]*?)<\/ul>/i)
  if (fb) {
    description = fb[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/Acerca de este artículo/i, '')
      .replace(/Sobre este artículo/i, '')
      .trim()
  }
  if (!description) {
    description = (meta('og:description') || meta('twitter:description') || meta('description') || '').trim()
  }

  let priceText = ''
  const whole = html.match(/a-price-whole[^>]*>([0-9.,]+)/i)
  const frac = html.match(/a-price-fraction[^>]*>([0-9]+)/i)
  if (whole) {
    priceText = '$' + whole[1] + (frac ? '.' + frac[1] : '')
  } else {
    const off = html.match(/a-offscreen">\s*\$([0-9.,]+)/i)
    if (off) priceText = '$' + off[1]
    else {
      const pm = html.match(/(?:"price"|precio)[^0-9]{0,20}([0-9][0-9.,]*)/i) || html.match(/[$€£]\s?([0-9][0-9.,]*)/)
      if (pm) priceText = pm[1]
    }
  }

  // Valoración y nº de reseñas
  let rating = 0
  let ratingCount = 0
  const rMatch =
    html.match(/a-icon-alt[^>]*>([0-9.]+)\s*(?:out of|de)\s*5/i) ||
    html.match(/acrPopover[^>]*title="([0-9.]+)\s*de\s*5/i)
  if (rMatch) rating = Number(rMatch[1])
  const rcMatch = html.match(/acrCustomerReviewText[^>]*>([^<]+)</i)
  if (rcMatch) ratingCount = Number(rcMatch[1].replace(/[^0-9]/g, '')) || 0

  // Precio original / recomendado (tachado)
  let originalPrice = 0
  const opMatch =
    html.match(/a-text-strike[^>]*>\s*\$?([0-9.,]+)/i) ||
    html.match(/precio recomendado:\s*US\$([0-9.,]+)/i) ||
    html.match(/list price:\s*\$?([0-9.,]+)/i)
  if (opMatch) originalPrice = Number(opMatch[1].replace(/[^0-9.]/g, '')) || 0

  // Atributos (marca, color, etc.) desde la tabla de detalles
  let attrs = ''
  const details =
    html.match(/id="productDetails[^"]*"[\s\S]*?<\/table>/i) ||
    html.match(/id="productDetails_techSpec[^"]*"[\s\S]*?<\/table>/i)
  if (details) {
    const rows = details[0].matchAll(
      /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi,
    )
    const parts = []
    for (const m of rows) {
      const k = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const v = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (k && v) parts.push(`${k}: ${v}`)
    }
    if (parts.length) attrs = parts.join(' · ')
  }

  // Enriquecer descripción con valoración y atributos
  const metaBits = []
  if (rating) metaBits.push(`Valoración: ${rating} de 5`)
  if (ratingCount) metaBits.push(`${ratingCount} reseñas`)
  if (metaBits.length) {
    description = (description ? description + '\n' : '') + metaBits.join(' · ')
  }
  if (attrs) {
    description = (description ? description + '\n' : '') + attrs
  }

  const platform = detectPlatform(rawUrl)

  return {
    ok: true,
    title,
    image,
    images,
    description,
    priceText,
    price: Number(String(priceText).replace(/[^0-9.]/g, '')) || 0,
    originalPrice,
    rating,
    ratingCount,
    platform,
    category: extractCategory(html, rawUrl),
    url: rawUrl,
    affiliateUrl: injectAffiliateTag(rawUrl, platform),
    note: 'Si faltan datos (p. ej. Amazon bloquea bots), complétalos a mano.',
  }
}

// Extrae la categoria desde las migas de pan (breadcrumbs) de la pagina del
// producto; si no hay, cae al ultimo segmento util del path de la URL.
// Asi la categoria es igual a la del enlace, sin IA ni escritura manual.
function extractCategory(html, url) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim()
  const fromLinks = (block) => {
    if (!block) return ''
    const links = [...block.matchAll(/<a[^>]*>([^<]+)<\/a>/gi)].map((m) => clean(m[1])).filter(Boolean)
    return links.length ? links[links.length - 1] : ''
  }
  // 1) Amazon: contenedor de breadcrumbs
  const wb = html.match(/id="wayfinding-breadcrumbs_feature_div"[\s\S]*?<\/div>/i)
  const c1 = fromLinks(wb && wb[0])
  if (c1) return c1.slice(0, 60)
  // 2) Breadcrumbs genericos (ul/ol o nav con clase breadcrumb)
  const bc =
    html.match(/(?:breadcrumbs?|bread-crumb)[^>]*>([\s\S]*?)<\/ul>/i) ||
    html.match(/(?:breadcrumbs?|bread-crumb)[^>]*>([\s\S]*?)<\/nav>/i) ||
    html.match(/class="[^"]*breadcrumb[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
  const c2 = fromLinks(bc && bc[1])
  if (c2) return c2.slice(0, 60)
  // 3) Fallback: ultimo segmento util del path (evita IDs, .html, ASIN)
  try {
    const u = new URL(url)
    const ignore = /^(dp|gp|product|item|store|s|p|c|html|htm|search|category)$/i
    const seg = u.pathname
      .split('/')
      .filter((s) => s && !ignore.test(s) && !/\.html?$/i.test(s) && !/^\d+$/.test(s) && !/^B0[A-Z0-9]{8}$/i.test(s))
    if (seg.length) return decodeURIComponent(seg[seg.length - 1]).replace(/[-_]/g, ' ').slice(0, 60)
  } catch {}
  return ''
}

// ---------- Generador de borradores para redes sociales (OpenRouter) ----------
// OpenRouter es compatible con la API de OpenAI: usamos el mismo formato
// de chat completions. Genera una descripción ORIGINAL (sin plagiar) para
// un producto, tipo "reference" de TikTok, con hashtags.
async function generateSocialPost(product, platform = 'tiktok') {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return { ok: false, error: 'OpenRouter no está configurado (OPENROUTER_API_KEY).' }
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'

  const title = product.title || ''
  const description = product.description || ''
  const category = product.category || ''

  const isPinterest = platform === 'pinterest'
  const system = isPinterest
    ? [
        `Eres un redactor de Pinterest experto en marketing de afiliados.`,
        `Crea la descripción ORIGINAL de un Pin a partir de la información del producto.`,
        `REGLAS:`,
        `1) No plagies; escribe con tus propias palabras.`,
        `2) Formato de Pin que convierte:`,
        `   - Línea 1: gancho emocional con emoji (p. ej. "💕 Práctico, bonito y perfecto para los pequeños.").`,
        `   - 3 a 5 viñetas, cada una con un emoji + un beneficio concreto (p. ej. "🥄 Incluye cuchara", "❄️ Mantiene la comida fría o caliente", "🎒 Ideal para la escuela y paseos").`,
        `   - Línea final: llamada a la acción con emoji que invite a hacer clic en el ENLACE DE AFILIADO (p. ej. "👉 Haz clic en el enlace para ver el precio y comprarlo 🩷").`,
        `3) Al final, añade de 3 a 5 hashtags relevantes y populares, e incluye "#affiliate" o mención de que es contenido de afiliado.`,
        `4) Devuelve SOLO la descripción (gancho + viñetas + CTA + hashtags). Sin explicaciones ni comillas.`,
      ].join(' ')
    : [
        `Eres un redactor de contenido para redes sociales, experto en marketing de afiliados.`,
        `Crea un borrador ORIGINAL de post para ${platform} a partir de la información de un producto.`,
        `REGLAS:`,
        `1) No copies ni plagies descripciones ajenas; escribe con tus propias palabras.`,
        `2) Estilo cercano, entusiasta y breve, adecuado a ${platform} (frases cortas, gancho inicial).`,
        `3) Incluye al final una llamada a la acción CLARA que invite a hacer clic en el ENLACE DE AFILIADO (p. ej. "🔗 Consíguelo en el enlace de la bio / en el primero comentario", "👉 Haz clic para ver el precio"). No escribas la URL tú; solo dirige al enlace, que se añade aparte.`,
        `4) Añade una breve mención de que es contenido de afiliado (p. ej. "#affiliate" o "como afiliado puedo ganar una comisión").`,
        `5) Incluye al final entre 5 y 10 hashtags relevantes y populares.`,
        `6) Devuelve SOLO el texto del post (caption + CTA + hashtags). Sin explicaciones ni comillas.`,
        `Referencia de estilo (NO copiar, sólo inspirarse): "Clean and protect virtually all of your interior surfaces with Total Interior Cleaner & Protectant! #detailing #springcleaning #cars #truck #clean #interior #beforeandafter #easy #simple #protect"`,
      ].join(' ')

  const user = [
    `Producto: ${title}`,
    `Categoría: ${category}`,
    `Descripción original (sólo referencia, NO copiar): ${description}`,
    `Plataforma: ${platform}`,
    ``,
    `Crea el borrador.`,
  ].join('\n')

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'https://auloava.app',
        'X-Title': 'Auloava',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.9,
        max_tokens: 300,
      }),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      return { ok: false, error: `OpenRouter ${res.status}: ${txt.slice(0, 300)}` }
    }
    const data = await res.json()
    const draft = data?.choices?.[0]?.message?.content?.trim() || ''
    if (!draft) return { ok: false, error: 'La IA no devolvió texto.' }
    return { ok: true, draft }
  } catch (err) {
    return { ok: false, error: String(err?.message || err) }
  }
}

// Inyecta/normaliza el tag de afiliado en la URL según la plataforma.
function injectAffiliateTag(url, platform) {
  try {
    if (platform === 'amazon') {
      // Canonicaliza a la forma limpia https://www.amazon.com/dp/<ASIN>?tag=...
      // extrayendo el ASIN y descartando ref=/locale/session-id que provocan
      // la página interstitial "Continue shopping" de Amazon.
      const m = String(url).match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)
      const tag = AMZ_PARTNER_TAG || 'auloava-20'
      if (m) return `https://www.amazon.com/dp/${m[1].toUpperCase()}?tag=${tag}&th=0`
      const u = new URL(url)
      u.searchParams.set('tag', tag)
      u.searchParams.set('th', '0')
      return u.toString()
    }
    if (platform === 'aliexpress') {
      const u = new URL(url)
      const tid = TRACKING_ID || 'auloava'
      u.searchParams.set('trackingId', tid)
      return u.toString()
    }
    return url
  } catch {
    return url
  }
}

// Extrae los IDs de imagen de la galería de Amazon desde el HTML de la
// página del producto (data-a-dynamic-image, colorImages, /I/ enlinea).
function extractGallery(html) {
  const ids = []
  const push = (url) => {
    if (!url) return
    const m = String(url).match(/\/I\/([^"\\]+?)\.(?:_AC|jpg|webp)/)
    if (m && /^[A-Za-z0-9+_-]+$/.test(m[1]) && !ids.includes(m[1])) ids.push(m[1])
  }
  const dyn = html.match(/data-a-dynamic-image="([^"]+)"/)
  if (dyn) {
    try {
      const o = JSON.parse(dyn[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
      Object.keys(o).forEach(push)
    } catch {
      /* ignora */
    }
  }
  const blobs =
    html.match(/'(?:colorImages|colorImagesByAngle|imageGalleryData|imageData)'[\s\S]*?'large'\s*:\s*'([^']+)'/g) || []
  blobs.forEach((b) => {
    const m = b.match(/'large'\s*:\s*'([^']+)'/)
    if (m) push(m[1])
  })
  const all = html.match(/https?:\/\/[^"')\s]*\/I\/[^"')\s]+?\.(?:_AC|jpg|webp)/g) || []
  all.forEach(push)
  return ids
}
