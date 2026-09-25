// ============================================================
// AULOAVA · Extrae Best Sellers de las 5 categorías nuevas sin
// dataset local (Deportes, Mascotas, Jardín, Herramientas, Salud)
// usando la función Netlify zgbs (la IP de Netlify no está bloqueada).
// Uso: node scripts/fetch-new-niches.mjs
// ============================================================
import { writeFileSync } from 'node:fs'

const ZGBS_URL = 'https://auloava.netlify.app/.netlify/functions/zgbs'

const PAGES = [
  { slug: 'sports', label: 'Deportes y fitness', raw: 'https://www.amazon.com/gp/bestsellers/sports/ref=zg_bs_nav_sports_0' },
  { slug: 'pets', label: 'Mascotas', raw: 'https://www.amazon.com/gp/bestsellers/pets/ref=zg_bs_nav_pets_0' },
  { slug: 'lawn-garden', label: 'Jardín y exteriores', raw: 'https://www.amazon.com/gp/bestsellers/lawn-garden/ref=zg_bs_nav_lawngarden_0' },
  { slug: 'tools', label: 'Herramientas y bricolaje', raw: 'https://www.amazon.com/gp/bestsellers/tools/ref=zg_bs_nav_tools_0' },
  { slug: 'hpc', label: 'Salud y cuidado personal', raw: 'https://www.amazon.com/gp/bestsellers/hpc/ref=zg_bs_nav_hpc_0' },
]

async function callZgbs(url, tries = 2) {
  for (let i = 0; i <= tries; i++) {
    try {
      const res = await fetch(ZGBS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const j = await res.json()
      if (j.ok && j.items?.length) return j.items
      console.warn(`  reintento ${i + 1}: ${j.error || 'sin items'} (robot: ${j.robot})`)
    } catch (e) {
      console.warn(`  reintento ${i + 1}: error ${e.message}`)
    }
    if (i < tries) await new Promise((r) => setTimeout(r, 2500))
  }
  return []
}

async function main() {
  const results = []
  for (const page of PAGES) {
    const items = await callZgbs(page.raw)
    if (items.length) {
      writeFileSync(
        new URL(`../data/zgbs-${page.slug}.json`, import.meta.url),
        JSON.stringify(items, null, 2) + '\n',
      )
      console.log(`OK → data/zgbs-${page.slug}.json (${items.length} items) · ${page.label}`)
    } else {
      console.log(`FAIL ${page.slug} (${page.label}) — sin datos`)
    }
    results.push({ slug: page.slug, count: items.length })
  }
  const ok = results.filter((r) => r.count > 0).length
  console.log(`\nResumen: ${ok}/${results.length} categorías extraídas`)
  for (const r of results) console.log(`  ${r.slug}: ${r.count}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})