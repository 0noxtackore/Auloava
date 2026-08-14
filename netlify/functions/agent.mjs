// ============================================================
// AULOAVA · Agente de AliExpress (Netlify Function)
// Backend serverless. Las credenciales de AliExpress se leen
// SOLO desde variables de entorno; nunca se envían al navegador.
// Protegida con AGENT_API_KEY (debe coincidir con VITE_AGENT_KEY).
// ============================================================

const AGENT_KEY = process.env.AGENT_API_KEY || ''
const EMAIL = process.env.ALIEXPRESS_EMAIL || ''
const PASSWORD = process.env.ALIEXPRESS_PASSWORD || ''

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-agent-key',
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS }
  }

  // Protección: solo con la API key del agente
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
        body: JSON.stringify({ ok: true, configured: Boolean(EMAIL && PASSWORD) }),
      }
    }

    if (action === 'login') {
      const result = await loginToAliExpress(EMAIL, PASSWORD)
      // Nunca devolvemos la contraseña ni las cookies al cliente.
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify(result) }
    }

    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ ok: false, error: 'Acción no soportada' }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ ok: false, error: String(err?.message || err) }),
    }
  }
}

// Inicia sesión en AliExpress con navegador headless (Puppeteer).
// En serverless usa @sparticuz/chromium; en local usa puppeteer completo.
// NOTA: AliExpress puede pedir captcha/verificación; puede requerir ajustes.
async function loginToAliExpress(email, password) {
  if (!email || !password) {
    return { ok: false, error: 'Faltan credenciales de AliExpress en el entorno' }
  }

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
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  try {
    const page = await browser.newPage()
    await page.goto('https://login.aliexpress.com/', { waitUntil: 'networkidle2', timeout: 30000 })

    // Selectores de AliExpress (pueden cambiar; base a ajustar según el flujo real)
    await page.waitForSelector('#fm-login-id', { timeout: 15000 })
    await page.type('#fm-login-id', email, { delay: 30 })
    await page.type('#fm-login-password', password, { delay: 30 })

    await page.click('.fm-button-wrap button')
    await page
      .waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      .catch(() => {})

    // Detecta si quedó logueado (ajustar al DOM real)
    const loggedIn = await page.evaluate(
      () => !document.querySelector('#fm-login-id') && Boolean(document.querySelector('.user-nav, .top-user, .user-account')),
    )

    if (!loggedIn) {
      return {
        ok: false,
        email,
        loggedIn: false,
        error: 'No se detectó sesión. AliExpress puede pedir captcha/verificación.',
      }
    }

    return { ok: true, email, loggedIn: true }
  } finally {
    await browser.close()
  }
}
