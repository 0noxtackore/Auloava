// ============================================================
// AULOAVA · Seed manual 3: 60 best-sellers #1
// Baby (15) + Grocery (15) + Books (15) + Automotive (15)
// Datos extraídos de Amazon Best Sellers (webfetch).
// Evita duplicar ASINs ya existentes en la BD.
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

const P = [
  // ---------- BEBÉS (15) ----------
  mk('Pampers-Swaddlers-Diapers-Count-Fragrance', 'B010OVZO64', '618rYGEzC9L',
    'Pampers Swaddlers Diapers, Size 5 (20-37 lbs), 132 Count, Fragrance Free, Hypoallergenic, Absorbent, Pediatrician Recommended, Skin Safe',
    49.77, 4.8, 129597, 'Bebés'),
  mk('HUGGIES-Natural-Unscented-Sensitive-Water-Based', 'B07SCL613T', '81KJo22+X0L',
    'Huggies Natural Care Sensitive Baby Wipes, Unscented, Hypoallergenic, 99% Purified Water, 12 Flip-Top Packs (768 Wipes Total)',
    32.68, 4.8, 127592, 'Bebés'),
  mk('Pampers-Sensitive-Hypoallergenic-Unscented-Flip-Top', 'B01C3H4ZTY', '81ypZRytgVL',
    'Pampers Sensitive Baby Wipes, Clinically Proven, Fragrance Free, Unscented, Water Based, Hypoallergenic, 504 Total (9X Flip-Top Packs)',
    17.97, 4.8, 240558, 'Bebés'),
  mk('Honest-Company-Baby-Wipes-Plant-Based', 'B086LKQDJG', '81iZCP4lGZL',
    'The Honest Company Multi-Use Baby Wipes, Pattern Play, 720 Count',
    44.99, 4.8, 6572, 'Bebés'),
  mk('Huggies-Snugglers-Diapers-Newborn-Packaging', 'B07MYVXSDH', '81na6DCfjTL',
    'Huggies Little Snugglers Newborn Diapers, 84 Count',
    24.97, 4.8, 88039, 'Bebés'),
  mk('WaterWipes-Sensitive-Wipes-Count-Packs', 'B008KJEYLO', '81EYxqEoN0L',
    'WaterWipes Sensitive+ Newborn & Baby Wipes, 99.9% Water, Unscented & Hypoallergenic, 720 Count (12 Packs)',
    42.29, 4.7, 60169, 'Bebés'),
  mk('Unscented-Huggies-Simply-Fragrance-Free-Diaper', 'B08QRKY3NJ', '81tAiN-jAVL',
    'Huggies Simply Clean Baby Wipes, Unscented, 11 Packs, 704 Wipes',
    15.86, 4.8, 79451, 'Bebés'),
  mk('Huggies-Diapers-Little-Movers-Packaging', 'B0DKYWMHDX', '81nGGXu1MML',
    'Huggies Little Movers Diapers Size 5, 132 Count (2 Packs of 66)',
    51.99, 4.8, 46840, 'Bebés'),
  mk('Pampers-Cruisers-Disposable-Waistband-Packaging', 'B08PX2V7PG', '71JWY5RkEGL',
    'Pampers Diapers - Cruisers 360 - Size 5, 128 Count, Babyproof up to 100% Leakproof Pull-On Diaper',
    49.77, 4.7, 27679, 'Bebés'),
  mk('Desitin-Strength-Hypoallergenic-Parabens-Protects', 'B00ZQXT4EY', '71NRCxbQRvL',
    'Desitin Maximum Strength Diaper Rash Paste, 40% Zinc Oxide, 4.8 oz',
    7.97, 4.8, 51195, 'Bebés'),
  mk('Cleansing-Naturally-Tear-free-Hypoallergenic-Fragrance', 'B072QXWXS6', '61i34TRSnlL',
    'The Honest Company Shampoo & Body Wash, Tear-Free, Fragrance-Free, 10 fl oz',
    10.96, 4.7, 46897, 'Bebés'),
  mk('Pampers-Training-Disposable-Diapers-Supply', 'B078W9SH24', '81Gl6vAZDYL',
    'Pampers Training Pants - Easy Ups Boys & Girls Bluey - Size 3T-4T, 124 Count',
    49.27, 4.7, 46182, 'Bebés'),
  mk('Dr-Browns-Original-Nipple-Level', 'B015XBYDLM', '813R-eXXbBL',
    "Dr. Brown’s Natural Flow Level 2 Narrow Baby Bottle Silicone Nipple, Medium Flow, 3m+, 100% Silicone, 6 Count",
    10.98, 4.9, 43432, 'Bebés'),
  mk('Momcozy-Official-Washing-KleanPal-Detergent', 'B0DF1FDKR4', '614C96nCLoL',
    'Momcozy Official Detergent Tablets for Momcozy Bottle Washers, 120 Tablets',
    19.99, 4.9, 3437, 'Bebés'),
  mk('Pampers-Baby-Dry-Disposable-Diapers-Count', 'B00TJ6WLV2', '71-KwLFHh+L',
    'Pampers Diapers - Baby Dry - Size 1, 120 Count, Absorbent Disposable Infant Diaper',
    25.99, 4.7, 96735, 'Bebés'),

  // ---------- COMESTIBLES (15) ----------
  mk('CELSIUS-Fitness-Energy-Standard-Variety', 'B06X6J5266', '61VfvfV69lL',
    'CELSIUS Assorted Flavors Official Variety Pack, Functional Essential Energy Drinks, 12 Fl Oz (Pack of 12)',
    23.99, 4.5, 27809, 'Comestibles y Gourmet'),
  mk('Nespresso-Vertuoline-Seller-Assortment-Count', 'B01N05APQY', '61yfXjuA6TL',
    'Nespresso Capsules Vertuo, Variety Pack, Medium and Dark Roast Coffee, 30 Count Coffee Pods',
    42.00, 4.8, 67628, 'Comestibles y Gourmet'),
  mk('Premier-Protein-High-Shake-Chocolate', 'B008JGIZGS', '711b47e8zeL',
    'Premier Protein 30g High Protein Shake, Chocolate, 12 Pack | 160 Calories, 24 Vitamins & Minerals, No Added Sugar',
    23.97, 4.7, 11234, 'Comestibles y Gourmet'),
  mk('Monster-Energy-Ultra-Sugar-Drink', 'B0BL7316GD', '71mgBpijzML',
    'Monster Energy Zero Ultra, Sugar Free Energy Drink, 16 Ounce | Pack of 15',
    26.98, 4.7, 35390, 'Comestibles y Gourmet'),
  mk('Lavazza-Coffee-Medium-Espresso-2-2-Pound', 'B000SDKDM4', '61lHplXIDIL',
    'Lavazza Super Crema Whole Bean Coffee, Medium Espresso Roast, Arabica and Robusta Blend, 2.2 lb Bag',
    21.49, 4.5, 42267, 'Comestibles y Gourmet'),
  mk('Bloom-Nutrition-Sparkling-Energy-Drink', 'B0FL9GK819', '81J3UCLyfqL',
    'Bloom Nutrition Zero Sugar Energy Drink, Apple Crisp, 12oz 12pk',
    24.99, 4.8, 1821, 'Comestibles y Gourmet'),
  mk('Sparkling-Raspberry-Antioxidants-Vitamins-Bottles', 'B003P02EGU', '81SGYJjUu-L',
    'Sparkling Ice, Black Raspberry Sparkling Water, Zero Sugar Flavored Water, with Vitamins and Antioxidants, 17 fl oz Bottles (Pack of 12)',
    12.47, 4.7, 27904, 'Comestibles y Gourmet'),
  mk('Core-Power-fairlife-Protein-Chocolate', 'B01DDIRDZA', '71UfF+cjy8L',
    'Core Power Elite High Protein Shake, Chocolate, 42g Bottle, 14oz, 12 Pack',
    49.98, 4.6, 24937, 'Comestibles y Gourmet'),
  mk('Diet-Coke-12-Pack', 'B000T9WLUY', '61YHNQLguTL',
    'Diet Coke Soda Soft Drink Cans, 12 fl oz, 12 Pack',
    8.42, 4.5, 19812, 'Comestibles y Gourmet'),
  mk('Kerry-Beverage-Raspberry-Syrup-Milliliter', 'B0849N8W1M', '71sHJdqeMiL',
    'DaVinci Gourmet Classic Blue Raspberry Syrup, 25.4 Fluid Ounces',
    7.99, 4.4, 32971, 'Comestibles y Gourmet'),
  mk('Propel-Strawberry-Flavored-Electrolytes-Vitamins', 'B002U58PRI', '81EYogl78UL',
    'Propel, Kiwi Strawberry, Zero Calorie Sports Drinking Water with Electrolytes and Vitamins C&E, 16.9 Fl Oz (12 Count)',
    9.97, 4.7, 22623, 'Comestibles y Gourmet'),
  mk('Coca-Cola-Soda-Soft-Drink-Pack', 'B000T9WLTK', '71rHcpUCigL',
    'Coca-Cola Soda Soft Drink Fridge Pack Cans, 12 fl oz, 12 Pack',
    8.42, 4.6, 37038, 'Comestibles y Gourmet'),
  mk('Core-Power-Protein-Shake-Chocolate', 'B07LD2NV9X', '7113Swfyk9L',
    'Core Power Protein Shake, Chocolate, 26g Bottle, 14oz, 12 Pack',
    54.90, 4.7, 25144, 'Comestibles y Gourmet'),
  mk('CELSIUS-Sparkling-Peach-Fitness-Sugar', 'B086ZL794C', '81okOO82TIL',
    'CELSIUS PEACH VIBE Sparkling White Peach, Sugar Free Energy Drink, 12 Fl Oz (Pack of 12)',
    19.98, 4.7, 7433, 'Comestibles y Gourmet'),
  mk('GHOST-Energy-Drink-Welchs-Grape-Caffeine', 'B0DF1L929C', '81U-Do4QV-L',
    'GHOST Energy Drink, Zero Sugars, 12-Pack, Welch’s Grape, 16oz',
    29.99, 4.6, 14615, 'Comestibles y Gourmet'),

  // ---------- LIBROS (15) ----------
  mk('This-Me-Reckoning-Hayden-Panettiere', '1538773422', '81PWshPOeEL',
    'This Is Me: A Reckoning',
    20.58, 4.4, 789, 'Libros'),
  mk('Court-Splintered-Harmony-Thorns-Roses', '1639739130', '813aoHWrPqL',
    'A Court of Splintered Harmony (A Court of Thorns and Roses, 6)',
    22.40, 0, 0, 'Libros'),
  mk('Theo-Golden-Novel-Allen-Levi', '1668236516', '81P0NvoRrWL',
    'Theo of Golden: A Novel',
    12.70, 4.7, 166672, 'Libros'),
  mk('Calamity-Club-Novel-Kathryn-Stockett', '1954118813', '81pFuCA04TL',
    'The Calamity Club: A Novel',
    25.71, 4.7, 48018, 'Libros'),
  mk('Whistler-Novel-Ann-Patchett', '0063511630', '81D4ATVRKPL',
    'Whistler: A Novel',
    14.99, 4.6, 27401, 'Libros'),
  mk('Mad-Mabel-Novel-Sally-Hepworth', '1250284546', '71B6LgRyB8L',
    'Mad Mabel: A Novel',
    14.99, 4.6, 37975, 'Libros'),
  mk('Verity-Colleen-Hoover', '153878405X', '91SzIoUOaJL',
    'Verity',
    13.53, 4.6, 487411, 'Libros'),
  mk('Outsiders-S-Hinton', '014240733X', '71yXLUPE3KL',
    'The Outsiders',
    9.24, 4.7, 42380, 'Libros'),
  mk('Fahrenheit-451-Ray-Bradbury', '1451673310', '61sKsbPb5GL',
    'Fahrenheit 451',
    13.71, 4.6, 60963, 'Libros'),
  mk('Very-Hungry-Caterpillar-Eric-Carle', '0399226907', '81qsstEtrgL',
    'The Very Hungry Caterpillar',
    4.88, 4.9, 79780, 'Libros'),
  mk('Project-Hail-Mary-Andy-Weir', '0593135229', '916k6hSv0pL',
    'Project Hail Mary: A Novel',
    17.10, 4.7, 275327, 'Libros'),
  mk('Let-Them-Theory-Life-Changing-Millions', '1401971369', '91ZVf3kNrcL',
    'The Let Them Theory: A Life-Changing Tool That Millions of People Can’t Stop Talking About',
    8.95, 4.6, 47181, 'Libros'),
  mk('Kill-Mockingbird-Harper-Lee', '0060935464', '81aY1lxk+9L',
    'To Kill a Mockingbird',
    10.14, 4.7, 148848, 'Libros'),
  mk('Dungeon-Crawler-Carl-Matt-Dinniman', '059382024X', '71agPjqADHL',
    'Dungeon Crawler Carl',
    14.65, 4.7, 104294, 'Libros'),
  mk('Giver-Quartet-Lois-Lowry', '0544336267', '81Yq5WKWfSL',
    'The Giver: A Story About Conformity, Control, and Society (Giver Quartet, 1)',
    6.34, 4.6, 47035, 'Libros'),

  // ---------- AUTOMOTRIZ (15) ----------
  mk('Econour-Windshield-Shade-Window-Blocker', 'B01KIFISX2', '71W3+eLCARL',
    'Econour Car Windshield Sun Shade, Front Window Sun Blocker for SUVs, Sedan',
    11.99, 4.3, 124272, 'Automotriz'),
  mk('Drift-Car-Air-Freshener-Eliminator', 'B0C1HJV7BJ', '717n+0jibbL',
    'Drift Car Air Freshener - The Original Wood Air Freshener - Car Odor Eliminator - Teak Scent Starter Kit',
    12.95, 3.7, 22729, 'Automotriz'),
  mk('Activated-2003-2022-2006-2015-2007-2016-CF134', 'B0D8W2JDRL', '81QUQ5ABTxL',
    'CARORY Cabin Air Filter w/Activated Carbon for Honda Accord 2003–2022, Civic 2006–2015, CR-V 2007–2016, and More, CF134',
    7.49, 4.7, 8138, 'Automotriz'),
  mk('Microfiber-Cleaning-Cloth-Performance-Washes', 'B08BRJHJF9', 'A1U4ZA-OJmS',
    'USANOOKS Microfiber Cleaning Cloth Grey - 12 Pcs (12.5"x12.5") - High Performance - 1200 Washes, Ultra Absorbent',
    19.90, 4.6, 21960, 'Automotriz'),
  mk('Valvoline-SynPower-0W-20-Synthetic-Motor', 'B00GZKC6EW', '71IUFthPkCL',
    'Valvoline Advanced Full Synthetic SAE 0W-20 Motor Oil 5 QT',
    30.05, 4.8, 10436, 'Automotriz'),
  mk('Amazon-Basics-Microfiber-Absorbent-Non-Abrasive', 'B009FUF6DM', '91WjG1lqmLL',
    'Amazon Basics Microfiber Cleaning Cloths, Ultra Absorbent, Lint Free, Streak Free, Non-Abrasive, Pack of 24',
    10.41, 4.7, 87566, 'Automotriz'),
  mk('Mobil-120758-Advanced-Synthetic-Motor', 'B00J00X5YO', '71xh1h5KfrL',
    'Mobil 1 Advanced Fuel Economy Full Synthetic Motor Oil 0W-20, 5 Quart',
    30.37, 4.8, 6279, 'Automotriz'),
  mk('Chemical-Guys-Total-Interior-Protectant-Cleaner-Dashboard', 'B071ZTPRJL', '71e6JTfk-lL',
    'Chemical Guys, Total Interior Cleaner, Protectant & Car Detailer, 16 oz',
    10.51, 4.6, 44376, 'Automotriz'),
  mk('Valvoline-MaxLife-Mileage-5W-30-Synthetic', 'B00AM1Z67O', '71fl4OmnAKL',
    'Valvoline MaxLife High Mileage 5W-30 Synthetic Blend Motor Oil 5 Quart',
    22.97, 4.8, 13789, 'Automotriz'),
  mk('AstroAI-L7-Inflator-Compressor-Motorcycles', 'B0CS3B7MD8', '714fKYTM8TL',
    'AstroAI L7 Tire Inflator Portable Air Compressor, 150 PSI Cordless Bike Pump',
    22.99, 4.4, 16945, 'Automotriz'),
  mk('CERAKOTE-Ceramic-Headlight-Restoration-Kit', 'B084RQKLV8', '71mjhuksqYL',
    'CERAKOTE® Ceramic Headlight Restoration Kit, No Power Tools, 10 Wipe Kit',
    17.95, 4.6, 72660, 'Automotriz'),
  mk('Rain-X-810363-Repellency-Repellent-Windshield', 'B0DXW2FP8Y', '71KVp9hr20L',
    'Rain-X 810363 Repellency Water Repellent Wiper Blades, 22" Windshield Wipers (Pack of 2)',
    37.86, 4.4, 120065, 'Automotriz'),
  mk('NOCO-GB40-UltraSafe-Lithium-Starter', 'B015TKUPIC', '71hJgp07X1L',
    'NOCO Boost GB40 12V 1000A UltraSafe Portable Lithium Jump Starter',
    79.55, 4.6, 128832, 'Automotriz'),
  mk('Lamicall-Phone-Holder-Motorcycle-Mount', 'B085DMV7XD', '711bZ97mpyL',
    'Lamicall Bike Phone Holder Motorcycle Mount - One-Hand Operation, Lockable | 360° Rotation',
    15.99, 4.6, 68160, 'Automotriz'),
  mk('ANCEL-AD310-Enhanced-Universal-Diagnostic', 'B01G5EA74I', '61KElcCN4BL',
    'ANCEL AD310 Classic Enhanced Universal OBD II Scanner Car Engine Fault Code Reader',
    23.99, 4.6, 66139, 'Automotriz'),
]

async function main() {
  const sa = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app',
  })
  const db = admin.database()
  const snap = await db.ref('products').once('value')
  const existing = snap.val() || {}
  const seen = new Set()
  for (const k in existing) {
    const u = existing[k].url || ''
    const m = u.match(/\/dp\/([A-Z0-9]{10})/)
    if (m) seen.add(m[1])
  }
  let n = 0
  let skipped = 0
  for (const p of P) {
    const asin = (p.url.match(/\/dp\/([A-Z0-9]{10})/) || [])[1]
    if (seen.has(asin)) {
      skipped++
      continue
    }
    const newRef = db.ref('products').push()
    await newRef.set({ ...p, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    n++
    console.log(`✔ ${n}/60  ${p.title.slice(0, 42)} -> ${p.category}`)
  }
  console.log(`\nInsertados ${n} productos. (omitidos ${skipped} duplicados)`)
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
