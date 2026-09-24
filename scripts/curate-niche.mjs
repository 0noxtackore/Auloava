// ============================================================
// AULOAVA · Curado del catálogo al nicho:
// "Hallazgos asequibles de tecnología, hogar, cocina, belleza y
// oficina" (mismo producto comparado entre marketplaces).
// - Fuentes: bestseller-products.json (180 Best Sellers) +
//   zgbs-beauty-tools.json + zgbs-office-desk.json
// - Re-etiqueta a las 5 categorías del nicho y añade los
//   hallazgos nuevos (gadgets de belleza y organización).
// - Quita: marca fija sin contra-oferta, commodities y lo ajeno.
// Uso: node scripts/curate-niche.mjs
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs'

const CATEGORIES = ['Tecnología', 'Hogar', 'Cocina', 'Belleza', 'Oficina']
const IMG = 'https://images-na.ssl-images-amazon.com/images/I/'
const AFF = (asin) => `https://www.amazon.com/dp/${asin}?tag=auloava-20`
const COMMISSIONS = { Tecnología: 4, Hogar: 5, Cocina: 5, Belleza: 6, Oficina: 5 }

// ---- 1) Re-categorización de los 180 Best Sellers (por ASIN) ----
const REMAP = {
  // Tecnología: gadgets de audio y carga
  B0C3HCD34R: 'Tecnología', B09FT58QQP: 'Tecnología', B0CRTYZG5C: 'Tecnología',
  B0DN45YMP6: 'Tecnología', B09DT48V16: 'Tecnología', B08R6S1M1K: 'Tecnología',
  // Hogar: energía, TV mounts y vida en casa / drinkware
  B09PDLBFKY: 'Hogar', B0DPKKMPBD: 'Hogar', B0DZ254SSR: 'Hogar', B092J8LPWR: 'Hogar',
  B00SFSU53G: 'Hogar', B07SHFPD8S: 'Hogar', B085DVHQ57: 'Hogar', B0CQVWT2NH: 'Hogar',
  B0DF472VMZ: 'Hogar', B0CP9YB3Q4: 'Hogar', B0DCDZP98B: 'Hogar', B073WJMKHN: 'Hogar',
  B0B56CHMSC: 'Hogar', B0DBDKT4QC: 'Hogar',
  // Cocina: gadgets de cocina y almacenado
  B0113UZJE2: 'Cocina', B06X9NQ8GX: 'Cocina', B0CYJBB2JQ: 'Cocina', B07YP2VH4B: 'Cocina',
  B0GVM8N2CK: 'Cocina', B0CJF94M8J: 'Cocina', B00S93EQUK: 'Cocina', B0B2P4P2R4: 'Cocina',
  B08N9Q24M9: 'Cocina', B0C3QZ7SNF: 'Cocina', B01FHOWYA2: 'Cocina', B07PZF3QS3: 'Cocina',
  B079M8FPTW: 'Cocina', B0CP4XY9QC: 'Cocina', B0CPLVLFK2: 'Cocina', B08FLKHG8J: 'Cocina',
  B0CBM682SQ: 'Cocina',
  // Oficina: gestión de cable del catálogo previo
  B07FW3GTXB: 'Oficina', B08TVLYB3Q: 'Oficina',
}

// ---- 2) Hallazgos nuevos: Belleza (gadgets) y Oficina (organización) ----
const PICK = {
  Belleza: [
    'B0DK8DCVK7', // Goddvenus Lash Clusters Kit 300pcs
    'B08V3JGB1F', // Kitsch Dermaplane Razor 12 pcs
    'B098NSHBQK', // Ear & Nose Hair Trimmer 2026
    'B08GSTPT8Y', // AOA makeup sponge set
    'B0000532A2', // Revlon Slant Tweezer
    'B07GRD5WLD', // BeautifyBeauties spray bottle
    'B0CYX9W5B1', // Facial Hair Remover (as seen on TV)
  ],
  Oficina: [
    'B0BMTSL48B', // YSAGi desk protector
    'B086BLQZ5L', // Aothia desk pad
    'B09DV56338', // Logitech mouse pad
    'B0B1M6ML2J', // 25 pcs drawer organizer
    'B0C9ZHWC9K', // SKYDUE pen organizer
    'B077B9W343', // Nulaxy laptop stand
    'B07B7LBPNZ', // MROCO mouse pad gaming
    'B09MCKK9NX', // Lamicall phone stand
    'B0DCVVZ6CT', // MOSISO wrist rest set
    'B0BRMX3SWH', // Memo board monitor
    'B08XXF1VCS', // JMH magnifying glass LED
    'B0G2RTY746', // WALI monitor stand
    'B0GN1TZZ9W', // WALI file organizer
    'B0DJKSMV2T', // gianotter dual monitor stand
    'B07C3XZMC6', // JIKIOU 3-pack mouse pads
    // Novelty/Fidget: hallazgos antiestrés para el escritorio
    'B07HDX46HS', // Crayola Globbles fidget 6ct
    'B0DSVTXFNW', // Silicone magnetic balls fidget 4pc
    'B0DC69M33Y', // Worry stones texturizados 6pk
    'B0G51RMM8D', // Cloud squishy glow in the dark
    'B0DG2VRFV7', // Squishies kawaii 30 pack
    'B0G22BHS13', // Toymendous squishy carrot jumbo
  ],
  // "SÍ, pero solo accesorios/gadgets":
  Tecnología: [
    // Computadoras y Accesorios (periféricos y carga)
    'B0B1HJ666G', // 118W USB-C MacBook charger
    'B089T1SX32', // HP 65W laptop charger
    'B0B4SBR4RN', // 65W Surface charger
    'B0CJ88NGPG', // Dell 65W USB-C charger
    'B0BQLLB61B', // Anker USB-C hub 5-in-1
    'B0BR3M8XHK', // UGREEN USB-C hub 5-in-1
    'B0874M3KW4', // Anker 8-in-1 docking station
    'B08BRCT4JH', // BESIGN aluminum laptop stand
    'B00NNMB3KS', // havit laptop cooling pad
    'B09KC792R5', // Peslv magnetic privacy screen
    'B08H8ZLKKK', // TP-Link Archer AX21 router
    // Celulares y Accesorios (protección, carga, soporte)
    'B0FDQKL8JZ', // Ailun 3-pack screen protector
    'B0H6LMZPWK', // Mkeke clear iPhone case
    'B0H5WKDT2P', // TORRAS crystal case
    'B07WRBDXZ8', // Misxi Apple Watch protector
    'B0CB1FW5FC', // INIU 10000mAh power bank
    'B0B283QP2N', // iPhone USB-C fast charger
    'B0CPSBD68W', // 2-pack USB-C charger block
    'B07P29XQR4', // PopSockets grip
    // Cámaras y Fotografía (óptica + gadgets de creadores)
    'B0756BXDTX', // Occer 12x25 binoculars
    'B0CJRTRRTG', // 20x50 hd binoculars
    'B07Q1GHB5X', // Hontry 10x25 binoculars
    'B07GQ8J4QX', // POLDR pocket 12x25
    'B0C53781Q5', // AHFLRITO foldable binoculars
    'B07QB79SN6', // Elikliv digital microscope 1000x
    'B07DVFBVPF', // Skybasic wifi microscope
    'B081RJ8DW1', // Gskyer telescope 70mm
    'B0DCVTJGCD', // TOMLOV P10 handheld microscope
  ],
  Cocina: [
    'B0BWHZJHPL', // EUHOMY countertop ice maker
    'B0BXXKFJK2', // Silonn countertop ice maker
    'B0F42MT8JX', // Antarctic Star ice maker
  ],
  Hogar: [
    'B0DFY8QRB1', // EUHOMY 24-can mini fridge
  ],
}

const read = (p) => JSON.parse(readFileSync(new URL(`../data/${p}`, import.meta.url), 'utf8'))

function main() {
  const bestsellers = read('bestseller-products.json')
  const byAsin = new Map(bestsellers.map((p) => [p.affiliateUrl.match(/\/dp\/([A-Z0-9]{10})/i)?.[1], p]))
  const zgbsFiles = [
  'zgbs-beauty-tools.json',
  'zgbs-office-desk.json',
  'zgbs-computers.json',
  'zgbs-phones.json',
  'zgbs-electronics.json',
  'zgbs-appliances.json',
  'zgbs-photo.json',
  'zgbs-toys.json',
  'zgbs-toys-novelty.json',
]
const zgbs = zgbsFiles.flatMap(read)
  const zgbsByAsin = new Map(zgbs.map((x) => [x.asin, x]))

  // Catálogo base: los que están en REMAP, con categoría del nicho
  const curated = []
  for (const [asin, category] of Object.entries(REMAP)) {
    const p = byAsin.get(asin)
    if (!p) {
      console.warn('no se encontró en 180:', asin)
      continue
    }
    curated.push({ ...p, category })
  }

  // Hallazgos nuevos con imagen/affiliate del esquema
  for (const [category, asins] of Object.entries(PICK)) {
    for (const asin of asins) {
      const x = zgbsByAsin.get(asin)
      if (!x) {
        console.warn('no se encontró en zgbs:', asin)
        continue
      }
      const image = `${IMG}${x.imageKey.replace(/\.jpg$/i, '')}._AC_SX679_.jpg`
      curated.push({
        title: x.title,
        platform: 'amazon',
        category,
        price: x.price,
        originalPrice: null,
        rating: x.rating,
        ratingCount: x.ratingCount,
        commission: COMMISSIONS[category],
        stock: 300,
        image,
        affiliateUrl: AFF(asin),
        rank: curated.length + 1,
        source: 'auloava-nichos-2026-09-23',
        photos: [image],
      })
    }
  }

  curated.sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category))
  curated.forEach((p, i) => (p.rank = i + 1))

  writeFileSync(
    new URL('../data/auloava-products.json', import.meta.url),
    JSON.stringify(curated, null, 2) + '\n',
  )

  const byCat = {}
  for (const p of curated) byCat[p.category] = (byCat[p.category] || 0) + 1
  console.log(`OK → data/auloava-products.json (${curated.length} productos curados)`)
  console.log('  ' + JSON.stringify(byCat))
  const missingImg = curated.filter((p) => !p.image)
  const missingAff = curated.filter((p) => !p.affiliateUrl)
  const badRat = curated.filter((p) => Number.isNaN(p.rating))
  console.log(`Check: sin imagen ${missingImg.length} · sin affiliate ${missingAff.length} · rating inválido ${badRat.length}`)
  for (const p of curated.filter((x) => [...missingImg, ...missingAff].includes(x))) console.log('  ⚠', p.title)
}

main()