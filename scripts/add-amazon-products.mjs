// Agrega productos de Amazon al catálogo (Firebase) vía el agente.
// Uso: node scripts/add-amazon-products.mjs
const AGENT = process.env.AGENT_URL || 'https://auloava.netlify.app/.netlify/functions/agent'
const KEY = process.env.AGENT_KEY || 'auloava'

const URLS = [
  'https://www.amazon.com/-/es/Accesorio-Suministro-Spider-Man-Rojo-Azul/dp/B07958N8MB/ref=sr_1_8?__mk_es_US=%C3%85M%C3%85%C5%BD%C3%95%C3%91&sr=8-8',
  'https://www.amazon.com/-/es/Marvel-Spider-Man-caracter%C3%ADsticas-interactivas-ajustable/dp/B073VBBX59/ref=pd_sbs_d_sccl_1_1/147-9000661-6758417',
  'https://www.amazon.com/-/es/Fullware-escritura-pulgadas-garabatos-almohadilla/dp/B0D2D1VLSB/ref=pd_sbs_d_sccl_3_21/147-9000661-6758417',
  'https://www.amazon.com/-/es/Qumcou-Juguetes-juguetes-superh%C3%A9roes-transformables/dp/B0FPG5PLJ7/ref=pd_sbs_d_sccl_1_16/147-9000661-6758417',
]

async function call(body) {
  const res = await fetch(AGENT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-key': KEY },
    body: JSON.stringify(body),
  })
  return res.json()
}

for (const url of URLS) {
  const scraped = await call({ action: 'scrape', url })
  if (!scraped.ok) {
    console.error('SCRAPE FALLÓ:', url, scraped.error)
    continue
  }
  // Quita id para que Firebase lo genere, y limpia campos internos.
  const { id, ...product } = scraped
  const created = await call({ action: 'create-product', product })
  if (created.ok) {
    console.log('AGREGADO:', created.product?.title || url, '->', created.product?.affiliateUrl)
  } else {
    console.error('CREATE FALLÓ:', url, created.error)
  }
}
