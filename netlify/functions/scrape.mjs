// ============================================================
// AULOAVA · Netlify Function: scrape de producto (Amazon/AliExpress)
// Expone POST /.netlify/functions/scrape  { url } -> datos del producto
// Devuelve también `imageIds` (galería) para poder elegir la
// miniatura 1ª/3ª/4ª/5ª en vez de siempre la primera.
// ============================================================
const AMZ_PARTNER_TAG = 'auloava-20'
const ALI_TRACKING_ID = 'auloava'

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function decodeHtmlEntities(str) {
  if (!str) return ''
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

function extract(html, re) {
  const m = html.match(re)
  return m ? decodeHtmlEntities(m[1].trim()) : ''
}
function extractMeta(html, prop) {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]+)"`, 'i'))
  if (!m) {
    const m2 = html.match(new RegExp(`<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="${prop}"`, 'i'))
    return m2 ? decodeHtmlEntities(m2[1].trim()) : ''
  }
  return decodeHtmlEntities(m[1].trim())
}
function parsePrice(s) {
  if (!s) return null
  const m = s.replace(/\./g, '').match(/[\d,]+/)
  if (!m) return null
  const n = Number(m[0].replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

// Extrae los IDs de imagen de la galería desde varias fuentes del HTML
function extractGallery(html) {
  const ids = []
  const push = (url) => {
    if (!url) return
    const m = String(url).match(/\/I\/([^"\\]+?)\.(?:_AC|jpg|webp)/)
    if (m && /^[A-Za-z0-9+_-]+$/.test(m[1]) && !ids.includes(m[1])) ids.push(m[1])
  }
  // 1) data-a-dynamic-image (objeto URL -> [w,h])
  const dyn = html.match(/data-a-dynamic-image="([^"]+)"/)
  if (dyn) {
    try {
      const o = JSON.parse(dyn[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
      Object.keys(o).forEach(push)
    } catch {
      /* ignore */
    }
  }
  // 2) colorImages / imageGalleryData embebidos en <script>
  const blobs = html.match(/'(?:colorImages|colorImagesByAngle|imageGalleryData|imageData)'[\s\S]*?'large'\s*:\s*'([^']+)'/g) || []
  blobs.forEach((b) => {
    const m = b.match(/'large'\s*:\s*'([^']+)'/)
    if (m) push(m[1])
  })
  // 3) cualquier /I/<id>._AC_ en el HTML (fallback amplio)
  const all = html.match(/https?:\/\/[^"')\s]*\/I\/[^"')\s]+?\.(?:_AC|jpg|webp)/g) || []
  all.forEach(push)
  return ids
}

export function injectAffiliateTag(rawUrl, platform) {
  try {
    const u = new URL(rawUrl)
    if (platform === 'amazon') {
      u.searchParams.set('tag', AMZ_PARTNER_TAG)
      u.searchParams.set('th', '0')
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
  // Fallback de imagen principal: la 1ª del data-a-dynamic-image
  if (!image) {
    const dyn = html.match(/data-a-dynamic-image="([^"]+)"/)
    if (dyn) {
      try {
        const o = JSON.parse(dyn[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
        const first = Object.keys(o)[0]
        if (first) image = first
      } catch {
        /* ignore */
      }
    }
  }
  if (image.startsWith('//')) image = 'https:' + image

  const imageIds = extractGallery(html)
  // Si la galería no trajo nada, derivamos el ID de og:image
  if (imageIds.length === 0 && image) {
    const m = image.match(/\/I\/([^"\\]+?)\.(?:_AC|jpg|webp)/)
    if (m) imageIds.push(m[1])
  }

  let price = parsePrice(
    extract(html, /id="price_inside_buybox"[^>]*>\s*([^<]+)/i) ||
      extract(html, /id="priceblock_ourprice"[^>]*>\s*([^<]+)/i) ||
      extract(html, /id="priceblock_dealprice"[^>]*>\s*([^<]+)/i) ||
      extract(html, /<span class="a-price-whole">([\d.,]+)/i) ||
      extract(html, /<span class="a-offscreen">\$([\d.,]+)/i) ||
      extractMeta(html, 'product:price:amount'),
  )
  let originalPrice = parsePrice(
    extract(html, /<span class="[^"]*priceBlockStrikePriceString[^"]*"[^>]*>([^<]+)/i) ||
      extract(html, /<span class="a-text-strike"[^>]*>\$([\d.,]+)/i),
  )
  if (!originalPrice || originalPrice <= price) originalPrice = null
  let rating =
    parseFloat(
      extract(html, /id="acrPopover"[^>]*>\s*<span[^>]*>([\d.]+)/i) ||
        extract(html, /<span class="a-icon-alt">([\d.]+) out of/i) ||
        extract(html, /([\d.]+)\s+out of\s+5\s+stars/i) ||
        extract(html, /([\d.]+)\s+de\s+5\s+estrellas/i) ||
        extractMeta(html, 'og:rating'),
    ) || null

  return {
    title,
    description,
    image,
    imageIds,
    images: imageIds.map(
      (id) => `https://images-na.ssl-images-amazon.com/images/I/${id}._AC_SX679_.jpg`,
    ),
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
  if (req.method === 'OPTIONS')
    return new Response(null, { statusCode: 204, headers: HEADERS })
  if (req.method !== 'POST')
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      statusCode: 405,
      headers: HEADERS,
    })
  try {
    const payload = typeof req.json === 'function' ? await req.json() : JSON.parse(req.body || '{}')
    const { url } = payload || {}
    if (!url)
      return new Response(JSON.stringify({ error: 'Falta la url' }), {
        statusCode: 400,
        headers: HEADERS,
      })
    const data = await scrapeProduct(url)
    if (!data.title)
      return new Response(JSON.stringify({ error: 'No se pudo extraer el producto', data }), {
        statusCode: 422,
        headers: HEADERS,
      })
    return new Response(JSON.stringify(data), { statusCode: 200, headers: HEADERS })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String((e && e.message) || e) }),
      { statusCode: 500, headers: HEADERS },
    )
  }
}
