// ============================================================
// AULOAVA · Harvester LEGAL de best-sellers (solo APIs oficiales)
// ------------------------------------------------------------
// Fuentes:
//   - Amazon Product Advertising API 5.0 (PA-API)  -> requiere APP_KEY/SECRET
//     (orden por reseñas como proxy de popularidad; Amazon no expone ranking por ventas vía API)
//   - AliExpress Affiliate API (aliexpress.affiliate.product.query) -> sort=sales (best-sellers reales)
//
// NO hace scraping de páginas de Best Sellers (eso violaría el ToS).
//
// Uso:
//   node scripts/harvester.mjs                 # corre y guarda en Firebase
//   node scripts/harvester.mjs --dry-run       # solo muestra lo que obtendría
//
// Requisitos (env vars):
//   FIREBASE_SERVICE_ACCOUNT  (JSON)  o scripts/serviceAccount.json
//   AMZ_ACCESS_KEY, AMZ_SECRET_KEY, AMZ_PARTNER_TAG (=auloava-20), AMZ_HOST, AMZ_REGION
//   ALI_APP_KEY, ALI_APP_SECRET, ALI_TRACKING_ID (=auloava)
// ============================================================
import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'
import admin from 'firebase-admin'

// ---------- Config de categorías a cosechar ----------
// Amazon: BrowseNodeId (nodos de categoría). Sort siempre por reseñas (proxy).
// AliExpress: keywords + sort=sales (best-sellers reales por ventas).
const CATEGORIES = [
  { source: 'amazon', nodeId: '289754', name: 'Kitchen Utensils & Gadgets' },
  { source: 'amazon', nodeId: '284507', name: 'Kitchen & Dining' },
  { source: 'amazon', nodeId: '1063252', name: 'Bedding' },
  { source: 'amazon', nodeId: '1063236', name: 'Bath' },
  { source: 'amazon', nodeId: '3610841', name: 'Storage & Organization' },
  { source: 'aliexpress', keywords: 'phone case', name: 'Phone Cases' },
  { source: 'aliexpress', keywords: 'led strip lights', name: 'LED Strip Lights' },
  { source: 'aliexpress', keywords: 'home decor', name: 'Home Decor' },
]

const AMZ_PARTNER_TAG = process.env.AMZ_PARTNER_TAG || 'auloava-20'
const AMZ_HOST = process.env.AMZ_HOST || 'webservices.amazon.com'
const AMZ_REGION = process.env.AMZ_REGION || 'us-east-1'
const ALI_TRACKING_ID = process.env.ALI_TRACKING_ID || 'auloava'

const DRY_RUN = process.argv.includes('--dry-run')

// ---------- Firebase ----------
function getDb() {
  if (admin.apps.length) return admin.database()
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app',
  })
  return admin.database()
}

// ---------- Tag injection (por seguridad, re-aplica el tag) ----------
function injectAffiliateTag(rawUrl, platform) {
  try {
    const u = new URL(rawUrl)
    if (platform === 'amazon') {
      u.searchParams.set('tag', AMZ_PARTNER_TAG)
      u.searchParams.delete('ascsubtag')
    } else if (platform === 'aliexpress') {
      u.searchParams.set('trackingId', ALI_TRACKING_ID)
    }
    return u.toString()
  } catch {
    return rawUrl
  }
}

// ============================================================
// Amazon PA-API 5.0 (SigV4)
// ============================================================
function sha256hex(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex')
}
function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest()
}
function signV4({ method, url, service, region, accessKey, secretKey, payload, headers }) {
  const u = new URL(url)
  const amzdate = headers['x-amz-date']
  const datestamp = amzdate.slice(0, 8)
  const payloadHash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex')
  const sortedKeys = Object.keys(headers).sort()
  const canonicalHeaders = sortedKeys.map((k) => `${k.toLowerCase()}:${headers[k].trim()}\n`).join('')
  const signedHeaders = sortedKeys.map((k) => k.toLowerCase()).join(';')
  const canonicalRequest = [method, u.pathname, '', canonicalHeaders, signedHeaders, payloadHash].join('\n')
  const scope = `${datestamp}/${region}/${service}/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', amzdate, scope, sha256hex(canonicalRequest)].join('\n')
  const kDate = hmac(`AWS4${secretKey}`, datestamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  const kSigning = hmac(kService, 'aws4_request')
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex')
  return `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}

async function searchAmazon(nodeId, count = 10) {
  const accessKey = process.env.AMZ_ACCESS_KEY
  const secretKey = process.env.AMZ_SECRET_KEY
  if (!accessKey || !secretKey) throw new Error('Faltan AMZ_ACCESS_KEY / AMZ_SECRET_KEY')
  const url = `https://${AMZ_HOST}/paapi5/searchitems`
  const body = JSON.stringify({
    PartnerTag: AMZ_PARTNER_TAG,
    PartnerType: 'Associates',
    BrowseNodeId: nodeId,
    ItemCount: count,
    SortBy: 'AvgCustomerReviews',
    Resources: [
      'ItemInfo.Title',
      'ItemInfo.ByLineInfo',
      'Offers.Listings.Price',
      'Images.Primary.Large',
      'CustomerReviews',
      'DetailPageURL',
      'BrowseNodeInfo.BrowseNodes',
    ],
  })
  const amzdate = new Date().toISOString().replace(/:/g, '').replace(/\.\d{3}Z$/, 'Z')
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    host: AMZ_HOST,
    'x-amz-date': amzdate,
    'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
    'x-amz-content-sha256': crypto.createHash('sha256').update(body, 'utf8').digest('hex'),
  }
  headers['Authorization'] = signV4({
    method: 'POST',
    url,
    service: 'ProductAdvertisingAPI',
    region: AMZ_REGION,
    accessKey,
    secretKey,
    payload: body,
    headers,
  })
  const res = await fetch(url, { method: 'POST', headers, body })
  if (!res.ok) throw new Error(`PA-API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const items = (data.SearchResult && data.SearchResult.Items) || []
  return items.map((it) => {
    const price = it.Offers?.Listings?.[0]?.Price?.Amount ?? null
    const original = it.Offers?.Listings?.[0]?.Price?.Savings?.Amount ?? null
    const rating = it.CustomerReviews?.StarRating?.Value ?? null
    const reviews = it.CustomerReviews?.Count ?? null
    const rawUrl = it.DetailPageURL || ''
    return {
      title: it.ItemInfo?.Title?.DisplayValue || '',
      description: (it.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || '') + '',
      image: it.Images?.Primary?.Large?.URL || '',
      price,
      originalPrice: original ? price + original : null,
      rating,
      reviews,
      platform: 'amazon',
      category: '',
      url: rawUrl,
      affiliateUrl: injectAffiliateTag(rawUrl, 'amazon'),
      commission: 0,
      clicks: 0,
    }
  })
}

// ============================================================
// AliExpress Affiliate API (TOP sign md5)
// ============================================================
function aliSign(params, secret) {
  const sorted = Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== '')
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('')
  const raw = secret + sorted + secret
  return crypto.createHash('md5').update(raw).digest('hex').toUpperCase()
}

async function searchAliExpress(keywords, count = 10) {
  const appKey = process.env.ALI_APP_KEY
  const appSecret = process.env.ALI_APP_SECRET
  if (!appKey || !appSecret) throw new Error('Faltan ALI_APP_KEY / ALI_APP_SECRET')
  const params = {
    app_key: appKey,
    method: 'aliexpress.affiliate.product.query',
    timestamp: Date.now(),
    format: 'json',
    v: '1.0',
    sign_method: 'md5',
    keywords,
    sort: 'sales',
    page_size: String(count),
    target_currency: 'USD',
    tracking_id: ALI_TRACKING_ID,
  }
  params.sign = aliSign(params, appSecret)
  const body = new URLSearchParams(params).toString()
  const res = await fetch('https://api.aliexpress.com/router', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`AliExpress ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const products = data?.result_list?.products || data?.aliexpress_affiliate_product_query_response?.result_list?.products || []
  return products.map((p) => {
    const rawUrl = p.product_detail_url || p.product_url || ''
    const price = p.sale_price ? Number(p.sale_price) : null
    const original = p.original_price ? Number(p.original_price) : null
    return {
      title: p.product_title || '',
      description: '',
      image: p.product_main_image_url || '',
      price,
      originalPrice: original && original > price ? original : null,
      rating: p.evaluation_rate ? Number(p.evaluation_rate) : null,
      reviews: p.orders ? Number(p.orders) : null,
      platform: 'aliexpress',
      category: '',
      url: rawUrl,
      affiliateUrl: injectAffiliateTag(rawUrl, 'aliexpress'),
      commission: 0,
      clicks: 0,
    }
  })
}

// ============================================================
// Guardar en Firebase
// ============================================================
async function saveProducts(db, products) {
  const ref = db.ref('products')
  for (const p of products) {
    if (DRY_RUN) {
      console.log(`  [dry] ${p.platform} | ${p.title?.slice(0, 60)} | ${p.affiliateUrl}`)
      continue
    }
    const newRef = ref.push()
    await newRef.set({ ...p, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  }
}

// ============================================================
// Main
// ============================================================
async function main() {
  const db = DRY_RUN ? null : getDb()
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== HARVESTING (legal, APIs oficiales) ===')
  for (const cat of CATEGORIES) {
    console.log(`\n# ${cat.name} (${cat.source})`)
    try {
      let products = []
      if (cat.source === 'amazon') products = await searchAmazon(cat.nodeId)
      else if (cat.source === 'aliexpress') products = await searchAliExpress(cat.keywords)
      console.log(`  ${products.length} productos obtenidos`)
      if (products.length) await saveProducts(db, products)
    } catch (e) {
      console.error(`  ERROR: ${e.message}`)
    }
  }
  console.log('\nListo.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
