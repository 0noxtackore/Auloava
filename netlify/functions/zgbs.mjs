// ============================================================
// AULOAVA · Netlify Function: extrae Best Sellers de Amazon (zgbs)
// Exponía POST /.netlify/functions/zgbs  { url } -> lista de items
// (title, asin, rating, ratingCount, price, imageKey)
// Se usa desde scripts/fetch-new-niches.mjs: Amazon no bloquea la
// IP de Netlify (a diferencia de entornos locales/CI).
// ============================================================
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-agent-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function decodeEntities(s = '') {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function clean(t = '') {
  return decodeEntities(t).replace(/\s+/g, ' ').trim()
}

function parsePage(html) {
  const blocks = html.match(/<div id="p13n-asin-index-\d+"[\s\S]*?(?=<div id="p13n-asin-index-|$)/g) || []
  const items = []
  for (const b of blocks) {
    const asin = b.match(/data-asin="([A-Z0-9]{10})"/)?.[1]
    const title = clean(b.match(/p13n-sc-css-line-clamp-3[^>]*>([\s\S]*?)<\/div>/)?.[1])
    const imgRaw = b.match(/src="(https:\/\/[^"]*\/images\/I\/[^"]+)"/)?.[1] || ''
    const imageKey = imgRaw.match(/\/images\/I\/([A-Za-z0-9+.-]+)\._AC_/)?.[1]
    const rating = Number(b.match(/a-icon-alt">([\d.]+) out of 5 stars/)?.[1])
    const countRaw = b.match(/a-size-small">([\d,]+)<\/span>/)?.[1]
    const priceRaw =
      b.match(/_cDEzb_p13n-sc-price[^>]*>\$([\d.,]+)<\/span>/)?.[1] ||
      b.match(/offers from[^$]*\$([\d.,]+)/)?.[1]
    if (asin && title && imageKey && rating && priceRaw) {
      items.push({
        title,
        asin,
        rating,
        ratingCount: countRaw ? Number(countRaw.replace(/,/g, '')) : null,
        price: Number(priceRaw.replace(/,/g, '')),
        imageKey: `${imageKey}.jpg`,
      })
    }
  }
  return items
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS }
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) }

  let payload = {}
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    payload = {}
  }

  const { url, retries = 3 } = payload || {}
  if (!url)
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Falta la url' }) }

  try {
    let lastHtml = ''
    for (let i = 0; i <= retries; i++) {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
      const html = await res.text()
      const items = parsePage(html)
      if (items.length > 0) {
        return {
          statusCode: 200,
          headers: HEADERS,
          body: JSON.stringify({ ok: true, count: items.length, items }),
        }
      }
      lastHtml = html
      if (i < retries) await new Promise((r) => setTimeout(r, 1200))
    }
    const robot = /captcha|Robot|To discuss automated access/i.test(lastHtml)
    return {
      statusCode: 422,
      headers: HEADERS,
      body: JSON.stringify({ ok: false, error: 'Sin items', url, robot, bytes: lastHtml.length }),
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: String((e && e.message) || e) }),
    }
  }
}