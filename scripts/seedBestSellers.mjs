// ============================================================
// AULOAVA · Seed manual: 18 best-sellers (Hogar y Cocina)
// Inserta en Firebase los productos extraídos de Amazon Best Sellers.
// (El fetch directo a Amazon quedó bloqueado por bot-detection,
//  así que usamos los datos ya obtenidos de las páginas de Best Sellers.)
// ============================================================
import { readFileSync } from 'node:fs'
import admin from 'firebase-admin'

const AMZ_PARTNER_TAG = 'auloava-20'

function injectAffiliateTag(rawUrl) {
  try {
    const u = new URL(rawUrl)
    u.searchParams.set('tag', AMZ_PARTNER_TAG)
    u.searchParams.delete('ascsubtag')
    return u.toString()
  } catch {
    return rawUrl
  }
}

const img = (id) => `https://images-na.ssl-images-amazon.com/images/I/${id}._AC_SX679_.jpg`
const mk = (slug, asin, id, title, price, rating, reviews, category) => {
  const url = `https://www.amazon.com/${slug}/dp/${asin}`
  return {
    title,
    description: '',
    platform: 'amazon',
    category,
    image: img(id),
    price,
    originalPrice: null,
    commission: 0,
    rating,
    reviewCount: reviews,
    affiliateUrl: injectAffiliateTag(url),
    url,
    clicks: 0,
  }
}

const PRODUCTS = [
  mk('Etekcity-Multifunction-Stainless-Batteries-Included', 'B0113UZJE2', '91YrLTBnMcL',
    'Etekcity Food Kitchen Scale, Digital Grams and Ounces, 11lb | Tare function, ideal for baking, weight loss, keto, meal prep, packages, liquids and jewelry, 304 Stainless Steel',
    8.68, 4.6, 176445, 'Utensilios de Cocina'),
  mk('Amazon-Basics-Disposable-Striped-Assorted', 'B0D6T59JGQ', '71RkeQUbHgL',
    'Amazon Basics Disposable Striped Plastic Flex Straws, BPA Free, Food-Safe, 7.5" Long, Assorted Colors, 100 Count',
    2.29, 4.7, 8601, 'Utensilios de Cocina'),
  mk('Thermometer-Cooking-BACKLIGHT-WATERPROOF-Temperature', 'B00S93EQUK', '81bpKKv68-L',
    'Alpha Grillers Instant Read Meat Thermometer Digital, Cooking, Food, Grill | 1-2 Second Ultra-Fast Response Time, Bright Backlit Display, Waterproof (IP67), Pre-Calibrated & Ready to Use',
    14.97, 4.8, 91289, 'Utensilios de Cocina'),
  mk('YARRAMATE-Dispenser-Sprayer-Cooking-Food-grade', 'B0CP4XY9QC', '71ZjnwrH7iL',
    'YARRAMATE 16 oz 2-in-1 Glass Olive Oil Sprayer for Cooking, Black | Food-grade dispenser bottle, 470 ml, spray and pour, portion control, for salad, frying and BBQ',
    7.75, 4.4, 48240, 'Utensilios de Cocina'),
  mk('AmazonBasics-Stainless-Digital-Batteries-Included', 'B06X9NQ8GX', '71eiII6MS-L',
    'Amazon Basics Digital Kitchen Scale with LCD Display, Tare Function, Multiple Units, Weighs up to 11 Pounds, Batteries Included, Black and Stainless Steel',
    9.95, 4.7, 118067, 'Utensilios de Cocina'),
  mk('KitchenAid-KE199OHOBA-Classic-Multifunction-Opener', 'B07YP2VH4B', '61BUtIcHCwL',
    'KitchenAid Classic Multifunction Can Opener and Bottle Opener Easy to Use, Razor Sharp Stainless Steel Cutting Wheel, Soft Ergonomic Handles, Black',
    14.99, 4.6, 91482, 'Utensilios de Cocina'),
  mk('TrendPlain-16oz-Dispenser-Bottle-Kitchen', 'B0CJF94M8J', '716HuBmcRsL',
    'TrendPlain 16oz/470ml Glass Olive Oil Sprayer for Cooking – 2 in 1 Olive Oil Dispenser Bottle for Kitchen Gadgets and Air Fryer Accessories, Salad, BBQ - Black',
    7.99, 4.6, 45550, 'Utensilios de Cocina'),
  mk('Reynolds-Kitchens-Unbleached-Parchment-Paper', 'B07PFYT8MC', '71fSQYVwU7L',
    'Reynolds Kitchens Unbleached Parchment Paper Roll, 45sq ft | Chlorine-Free, Nonstick Baking Parchment Paper, Microwave and Oven Safe To 425F, Fits Standard Baking Sheets, 12 in x 45 ft',
    3.59, 4.8, 23258, 'Utensilios de Cocina'),
  mk('Mueller-Austria-Vegetable-Chopper-Mandoline', 'B08N9Q24M9', '81+tBoD7McL',
    'Mueller The Real Original Pro Vegetable Chopper & Mandoline Slicer, 10-in-1 | since 2013, 8 Blade Food Veggie Chopper, Onion Vegetable Cutter with Container, Kitchen Gadgets & Essentials',
    26.99, 4.5, 33726, 'Utensilios de Cocina'),
  mk('iBayam-Scissors-Dishwasher-Multipurpose-Stainless', 'B08FLKHG8J', '61Otw4iYZ4L',
    'iBayam Kitchen Scissors Shears All Purpose Heavy Duty, Protective Sheath | 2-Pack, Ultra-Sharp Stainless Blades, Soft Comfort-Grip, Dishwasher Safe, Cutting Food Cooking Meat Poultry Kitchen Utensils',
    7.59, 4.8, 57230, 'Utensilios de Cocina'),
  mk('OXO-Good-Grips-Salad-Spinner', 'B00004OCKR', '81r0Q6FkrsL',
    'OXO Good Grips Salad Spinner | Lettuce Spinner | Fruit Washer | Fruit Washing Bowl with Strainer | Vegetable Cleaner | 6.22 Quart Capacity | Spin-dry Lettuce, Herbs, Fruit, Vegetables',
    32.95, 4.7, 54993, 'Utensilios de Cocina'),
  mk('Owala-Insulated-Stainless-Steel-Push-Button-24-Ounce', 'B085DTZQNZ', '718RbhzhVbL',
    'Owala FreeSip Stainless Steel Water Bottle 24 oz Very, Very Dark',
    27.99, 4.6, 134222, 'Bebidas / Hogar'),
  mk('Amazon-Basics-Lightweight-Wrinkle-Free-Microfiber', 'B00Q7OAPM6', '71O5+I+kA6L',
    'Amazon Basics Lightweight Super Soft, Wrinkle-Free, Breathable Luxury Microfiber 4 Piece Bed Sheet Set with 14-Inch Deep Pockets, Full, Dark Gray, Solid',
    12.82, 4.5, 475564, 'Ropa de Cama'),
  mk('TERRO-T300-2-2-Pack-Liquid-Baits', 'B00E4GACB8', '81GTDsmO9IL',
    'TERRO Liquid Ant Killer Bait Stations, Indoor Ant Traps, T300-2, 12-Pack | Borax Formula, Kills the Queen & the Entire Colony, Liquid Ant Baits Indoor, Indoor Use',
    6.09, 4.6, 161113, 'Limpieza y Hogar'),
  mk('Amazon-Basics-Non-Slip-Clothes-Hangers', 'B00FXNABPI', '617+Wg+p7WL',
    'Amazon Basics Slim Velvet Non-Slip Space Saving Suit Clothes Hangers for Closet Organization, Black/Silver, 30-Pack',
    14.56, 4.8, 235430, 'Organización'),
  mk('upsimples-Picture-Display-Pictures-Without', 'B0BQR2BQYZ', '71Si2QlAb3L',
    'upsimples 11x14 Picture Frame, Wall Decor Photo Frames, Black 1 Pack | 11 x 14 Frame, 8x10 Frame with Mat for Gallery Wall, Family, Baby, Dog, Dorm, Christmas',
    6.99, 4.4, 42418, 'Decoración'),
  mk('Bedsure-Pillowcases-Similar-Sleeping-Envelope', 'B0725WFLMB', '81ELt2J71tL',
    'Bedsure Satin Pillowcase, Similar to Silk Pillow Cases Queen Size Set of 2, Cooling Pillow Case Covers with Envelope Closure, Silver Grey, 20x30 Inches, 2pcs',
    5.99, 4.5, 320953, 'Ropa de Cama'),
  mk('THERMOS-FUNTAINER-Ounce-Stainless-Steel', 'B08NCVT244', '61TYdHY2uTL',
    'THERMOS FUNTAINER Kids Food Jar with Spoon, 10oz, Pink',
    14.69, 4.7, 48481, 'Hogar'),
]

async function main() {
  const sa = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app',
  })
  const db = admin.database()
  const ref = db.ref('products')
  let n = 0
  for (const p of PRODUCTS) {
    const newRef = ref.push()
    await newRef.set({ ...p, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    n++
    console.log(`✔ ${n}/18  ${p.title.slice(0, 50)} -> ${p.affiliateUrl.slice(0, 55)}`)
  }
  console.log(`\nInsertados ${n} productos.`)
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
