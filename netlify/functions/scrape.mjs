// ============================================================
// AULOAVA · Netlify Function: scrape de producto (Amazon/AliExpress)
// Expone POST /.netlify/functions/scrape  { url } -> datos del producto
// ============================================================
const AMZ_PARTNER_TAG = 'auloava-20'
const ALI_TRACKING_ID = 'auloava'

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function extract(html, re) {
  const m = html.match(re)
  return m
    ? m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim()
    : ''
}
function extractMeta(html, prop) {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]+)"`, 'i'))
  if (!m) {
    const m2 = html.match(new RegExp(`<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="${prop}"`, 'i'))
    return m2 ? m2[1].replace(/&amp;/g, '&').trim() : ''
  }
  return m[1].replace(/&amp;/g, '&').trim()
}
function parsePrice(s) {
  if (!s) return null
  const m = s.replace(/\./g, '').match(/[\d,]+/)
  if (!m) return null
  const n = Number(m[0].replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function injectAffiliateTag(rawUrl, platform) {
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

export async function scrapeProduct(url) {
  const isAmazon = /amazon\./i.test(url)
  const isAli = /aliexpress\./i.test(url)
  const platform = isAmazon ? 'amazon' : isAli ? 'aliexpress' : 'unknown'

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  })
  const html = await res.text()

  const title =
    extract(html, /<span id="productTitle"[^>]*>([^<]+)<\/span>/i) ||
    extractMeta(html, 'og:title') ||
    ''
  const description = extractMeta(html, 'og:description') || ''
  let image = extractMeta(html, 'og:image') || ''
  if (image.startsWith('//')) image = 'https:' + image

  let price = parsePrice(
    extract(html, /id="price_inside_buybox"[^>]*>\s*([^<]+)/i) ||
      extract(html, /id="priceblock_ourprice"[^>]*>\s*([^<]+)/i) ||
      extract(html, /id="priceblock_dealprice"[^>]*>\s*([^<]+)/i) ||
      extractMeta(html, 'product:price:amount'),
  )
  let originalPrice = parsePrice(
    extract(html, /<span class="[^"]*priceBlockStrikePriceString[^"]*"[^>]*>([^<]+)/i),
  )
  if (!originalPrice || originalPrice <= price) originalPrice = null
  let rating =
    parseFloat(
      extract(html, /id="acrPopover"[^>]*>\s*<span[^>]*>([\d.]+)/i) || extractMeta(html, 'og:rating'),
    ) || null

  return {
    title,
    description,
    image,
    price,
    originalPrice,
    rating,
    platform,
    category: '',
    url,
    affiliateUrl: injectAffiliateTag(url, platform),
  }
}

export default async (req) => {
  if (req.method === 'OPTIONS') return { statusCode: 204, headers: HEADERS }
  if (req.method !== 'POST')
    return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' }
  try {
    const { url } = JSON.parse(req.body || '{}')
    if (!url)
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Falta la url' }) }
    const data = await scrapeProduct(url)
    if (!data.title)
      return {
        statusCode: 422,
        headers: HEADERS,
        body: JSON.stringify({ error: 'No se pudo extraer el producto', data }),
      }
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(data) }
  } catch (e) {
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: String((e && e.message) || e) }),
    }
  }
}
