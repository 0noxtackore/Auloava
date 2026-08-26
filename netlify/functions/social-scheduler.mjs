// ============================================================
// AULOAVA · Social Scheduler (Netlify Scheduled Function)
// Reemplaza a n8n: corre solo cada día (cron en netlify.toml) y
// publica en las redes automatizables (Facebook, Pinterest) sin
// intervención humana. TikTok/Quora no tienen API de publicación,
// así que solo se genera el borrador y (opcionalmente) se envía a
// Discord para que el humano lo pegue a mano.
// ============================================================
const AGENT = process.env.AGENT_URL || 'https://auloava.netlify.app/.netlify/functions/agent'
const KEY = process.env.AGENT_KEY || 'auloava'

async function callAgent(body) {
  const res = await fetch(AGENT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-key': KEY },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function publishFacebook(product, draft) {
  const TOKEN = process.env.FACEBOOK_PAGE_TOKEN
  const PAGE = process.env.FACEBOOK_PAGE_ID || '61593917245819'
  if (!TOKEN) {
    console.log('Facebook: sin token, omito.')
    return
  }
  const url = (product.images && product.images[0]) || product.image
  if (!url) return
  const r = await fetch(`https://graph.facebook.com/v18.0/${PAGE}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, caption: `${draft}\n${product.affiliateUrl}`, access_token: TOKEN }),
  })
  console.log('Facebook status:', r.status)
}

async function publishPinterest(product, draft) {
  const TOKEN = process.env.PINTEREST_ACCESS_TOKEN
  const BOARD = process.env.PINTEREST_BOARD_ID
  if (!TOKEN || !BOARD) {
    console.log('Pinterest: sin token/board (pendiente aprobación), omito.')
    return
  }
  const url = (product.images && product.images[0]) || product.image
  if (!url) return
  const r = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      board_id: BOARD,
      title: (product.title || '').slice(0, 100),
      description: draft,
      link: product.affiliateUrl,
      media: { source_type: 'image_url', url },
    }),
  })
  console.log('Pinterest status:', r.status)
}

async function notifyDiscord(platform, product, draft) {
  const webhook = process.env.DISCORD_WEBHOOK
  if (!webhook || !draft) return
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `Borrador ${platform} (pégalo a mano):\n${draft}\n\n${product.affiliateUrl}`,
    }),
  })
}

export const handler = async () => {
  const list = await callAgent({ action: 'list-products' })
  const all = list.products || []
  if (!all.length) {
    console.log('Sin productos.')
    return { statusCode: 200, body: 'Sin productos' }
  }
  const pick = all[Math.floor(Math.random() * all.length)]
  console.log('Producto elegido:', pick.title)

  // --- Redes automatizables ---
  const fb = await callAgent({ action: 'generate-post', product: pick, platform: 'facebook' })
  if (fb.ok) await publishFacebook(pick, fb.draft)

  const pin = await callAgent({ action: 'generate-post', product: pick, platform: 'pinterest' })
  if (pin.ok) await publishPinterest(pick, pin.draft)

  // --- Redes sin API (borrador para pegar a mano) ---
  for (const platform of ['tiktok', 'quora']) {
    const gen = await callAgent({ action: 'generate-post', product: pick, platform })
    if (gen.ok) await notifyDiscord(platform, pick, gen.draft)
  }

  return { statusCode: 200, body: 'OK' }
}
