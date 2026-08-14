// ============================================================
// AULOAVA · Agente de AliExpress (Netlify Function)
// Backend serverless. Las credenciales de AliExpress se leen
// SOLO desde variables de entorno; nunca se envían al navegador.
// Protegida con AGENT_API_KEY (debe coincidir con VITE_AGENT_KEY).
//
// Flujo "import-products":
//   1) login en AliExpress (Puppeteer headless)
//   2) raspado de N productos aleatorios de una búsqueda/categoría
//   3) generación del enlace de afiliado (API oficial > portal > fallback)
//   4) guardado en el catálogo real (Firebase Realtime DB vía firebase-admin)
//
// NOTAS:
//   - AliExpress puede pedir captcha/verificación: el login puede fallar.
//   - Los selectores de la búsqueda cambian con frecuencia: ver SCRAPE_SELECTORS.
//   - Enlaces de afiliado reales necesitan la API oficial o el portal; si no
//     hay credenciales, se usa la URL cruda (no es un link de afiliado válido).
// ============================================================

const AGENT_KEY = process.env.AGENT_API_KEY || ''
const EMAIL = process.env.ALIEXPRESS_EMAIL || ''
const PASSWORD = process.env.ALIEXPRESS_PASSWORD || ''
const SEARCH = process.env.AGENT_SEARCH || 'gadgets'
const COUNT = Math.max(1, parseInt(process.env.AGENT_COUNT || '12', 10))
const AFF_ID = process.env.ALIEXPRESS_AFF_ID || ''
const APP_KEY = process.env.ALIEXPRESS_APP_KEY || ''
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET || ''
const TRACKING_ID = process.env.ALIEXPRESS_TRACKING_ID || ''

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-agent-key',
}

// Selectores candidatos en la página de resultados de AliExpress.
// Si AliExpress cambia el DOM, ajusta aquí.
const SCRAPE_SELECTORS = [
  'a[data-p4p-pid]',
  '.product-card',
  '.list--gallery .item',
  'a.search-item-card-wrapper',
]

let _adminApp = null

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS }
  }

  const key = event.headers['x-agent-key'] || event.headers['X-Agent-Key'] || ''
  if (!AGENT_KEY || key !== AGENT_KEY) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ ok: false, error: 'No autorizado' }) }
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
          configured: Boolean(EMAIL && PASSWORD),
          firebase: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT),
          affiliateApi: Boolean(APP_KEY && APP_SECRET && TRACKING_ID),
        }),
      }
    }

    if (action === 'login') {
      const r = await runWithBrowser(async (page) => {
        const loggedIn = await doLogin(page)
        return { loggedIn }
      })
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: r.loggedIn, email: EMAIL, loggedIn: r.loggedIn }) }
    }

    if (action === 'import-products') {
      const result = await importProducts()
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify(result) }
    }

    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ ok: false, error: 'Acción no soportada' }) }
  } catch (err) {
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ ok: false, error: String(err?.message || err) }) }
  }
}

// ---------- Navegador ----------
async function runWithBrowser(fn) {
  let browser
  try {
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = await import('puppeteer-core')
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  } catch {
    const puppeteer = await import('puppeteer')
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  }
  try {
    const page = await browser.newPage()
    return await fn(page)
  } finally {
    await browser.close()
  }
}

// ---------- Login ----------
async function doLogin(page) {
  if (!EMAIL || !PASSWORD) return false
  await page.goto('https://login.aliexpress.com/', { waitUntil: 'networkidle2', timeout: 30000 })
  await page.waitForSelector('#fm-login-id', { timeout: 15000 }).catch(() => {})
  await page.type('#fm-login-id', EMAIL, { delay: 30 }).catch(() => {})
  await page.type('#fm-login-password', PASSWORD, { delay: 30 }).catch(() => {})
  await page.click('.fm-button-wrap button').catch(() => {})
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {})
  return page.evaluate(
    () => !document.querySelector('#fm-login-id') && Boolean(document.querySelector('.user-nav, .top-user, .user-account')),
  )
}

// ---------- Importación ----------
async function importProducts() {
  const products = await runWithBrowser(async (page) => {
    const loggedIn = await doLogin(page)
    if (!loggedIn) {
      throw new Error('No se pudo iniciar sesión en AliExpress (captcha/verificación).')
    }

    await page.goto(`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(SEARCH)}`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // Espera a que aparezca algún selector de producto
    let selector = null
    for (const sel of SCRAPE_SELECTORS) {
      const found = await page.$(sel)
      if (found) {
        selector = sel
        break
      }
    }
    if (!selector) {
      throw new Error('No se encontraron productos en la página de resultados (selectores desactualizados).')
    }

    const raw = await page.evaluate((sel, count) => {
      const cards = Array.from(document.querySelectorAll(sel)).slice(0, count * 3)
      return cards
        .map((card) => {
          const a = card.closest('a') || card.querySelector('a')
          const href = a ? a.href : ''
          const img = card.querySelector('img')
          const titleEl =
            card.querySelector('h1, .product-title, .title, h3') || (a && a.querySelector('h1, .title'))
          const priceEl = card.querySelector('.price, .product-price, [class*="price"]')
          return {
            url: href,
            image: img ? img.src || img.dataset.src || '' : '',
            title: titleEl ? titleEl.textContent.trim() : '',
            priceText: priceEl ? priceEl.textContent.trim() : '',
          }
        })
        .filter((p) => p.url && p.title)
        .slice(0, count)
    }, selector, COUNT)

    const list = []
    for (const p of raw) {
      list.push({
        id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
        title: p.title,
        image: p.image,
        priceText: p.priceText,
        url: p.url,
        affiliateUrl: await generateAffiliateLink(page, p.url),
        source: 'aliexpress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    return list
  })

  // Persistir en el catálogo real (Firebase) si está configurado
  let saved = false
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    await saveToStore(products)
    saved = true
  }

  return {
    ok: true,
    count: products.length,
    saved,
    affiliateApi: Boolean(APP_KEY && APP_SECRET && TRACKING_ID),
    sample: products.slice(0, 3).map((p) => ({ title: p.title, affiliateUrl: p.affiliateUrl })),
  }
}

// ---------- Enlace de afiliado ----------
async function generateAffiliateLink(page, productUrl) {
  // 1) API oficial de afiliados (más fiable). Requiere APP_KEY/APP_SECRET/TRACKING_ID.
  if (APP_KEY && APP_SECRET && TRACKING_ID) {
    try {
      const url = await generateLinkViaApi(productUrl)
      if (url) return url
    } catch {
      /* fallback */
    }
  }
  // 2) Portal de afiliados (frágil, requiere sesión de afiliado).
  // TODO: navegar a portals.aliexpress.com y convertir la URL.
  // 3) Fallback: URL cruda (NO es un link de afiliado válido).
  return AFF_ID ? `${productUrl}${productUrl.includes('?') ? '&' : '?'}aff_id=${AFF_ID}` : productUrl
}

async function generateLinkViaApi(productUrl) {
  // AliExpress Affiliate Link Generate (API antigua sync). Requiere firma HMAC.
  // Ver https://developers.aliexpress.com . Implementación de firma pendiente;
  // por ahora devolvemos null para usar el fallback.
  return null
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
  // Reemplaza los productos demo por los reales (sobrescribe el nodo "products")
  await db.ref('products').set(products)
}
