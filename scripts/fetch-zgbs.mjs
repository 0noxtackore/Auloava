// ============================================================
// AULOAVA · Extrae Best Sellers de las categorías del nicho:
//   - Beauty Tools & Accessories (zgbs/beauty/11062741)
//   - Desk Accessories & Workspace Organizers (zgbs/office-products/1069514)
// Uso: node scripts/fetch-zgbs.mjs
// ============================================================
import { writeFileSync } from 'node:fs'

const PAGES = [
  { slug: 'beauty-tools', label: 'Belleza', raw: 'https://www.amazon.com/Best-Sellers-Beauty-Tools-Accessories/zgbs/beauty/11062741' },
  { slug: 'office-desk', label: 'Oficina', raw: 'https://www.amazon.com/Best-Sellers-Desk-Accessories-Workspace-Organizers/zgbs/office-products/1069514' },
  { slug: 'computers', label: 'Computadoras/accesorios', raw: 'https://www.amazon.com/gp/bestsellers/pc/ref=zg_bs_nav_pc_0' },
  { slug: 'phones', label: 'Celulares/accesorios', raw: 'https://www.amazon.com/gp/bestsellers/wireless/ref=zg_bs_nav_wireless_0' },
  { slug: 'electronics', label: 'Electrónica/accesorios', raw: 'https://www.amazon.com/gp/bestsellers/electronics/ref=zg_bs_nav_electronics_0' },
  { slug: 'appliances', label: 'Electrodomésticos', raw: 'https://www.amazon.com/gp/bestsellers/appliances/ref=zg_bs_nav_appliances_0' },
  { slug: 'photo', label: 'Cámaras/Foto', raw: 'https://www.amazon.com/gp/bestsellers/photo/ref=zg_bs_nav_photo_0' },
  { slug: 'toys', label: 'Juguetes/Gadgets', raw: 'https://www.amazon.com/gp/bestsellers/toys-and-games/ref=zg_bs_nav_toys_and_games_0' },
  { slug: 'toys-novelty', label: 'Novelty/Fidget', raw: 'https://www.amazon.com/gp/bestsellers/toys-and-games/166027011/ref=zg_bs_nav_toys_and_games_166027011' },
]

function clean(t = '') {
  return decodeEntities(t).replace(/\s+/g, ' ').trim()
}

function decodeEntities(s = '') {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function parsePage(html) {
  // Cada producto vive en <div id="p13n-asin-index-N" ...> ... </div>
  const blocks = html.match(/<div id="p13n-asin-index-\d+"[\s\S]*?(?=<div id="p13n-asin-index-|$)/g) || []
  const items = []
  for (const b of blocks) {
    const asin = b.match(/data-asin="([A-Z0-9]{10})"/)?.[1]
    const title = clean(b.match(/p13n-sc-css-line-clamp-3[^>]*>([\s\S]*?)<\/div>/)?.[1])
    const imgRaw = b.match(/src="(https:\/\/[^"]*\/images\/I\/[^"]+)"/)?.[1] || ''
    const imageKey = imgRaw.match(/\/images\/I\/([A-Za-z0-9+.-]+)\._AC_/)?.[1]
    const rating = Number(b.match(/a-icon-alt">([\d.]+) out of 5 stars/)?.[1])
    const countRaw = b.match(/a-size-small">([\d,]+)<\/span>/)?.[1]
    // Precio único (Amazon) o el 'desde' de las ofertas múltiples
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
    } else {
      console.warn('SIN DATOS:', asin, title?.slice(0, 40), { imageKey, rating, priceRaw })
    }
  }
  return items
}

async function main() {
  for (const page of PAGES) {
    const res = await fetch(page.raw, { headers: { 'user-agent': 'Mozilla/5.0' } })
    const html = await res.text()
    const items = parsePage(html)
    const out = new URL(`../data/zgbs-${page.slug}.json`, import.meta.url)
    writeFileSync(out, JSON.stringify(items, null, 2) + '\n')
    console.log(`OK → data/zgbs-${page.slug}.json (${items.length} items) · ${page.label}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})