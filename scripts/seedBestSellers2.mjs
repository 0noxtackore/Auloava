// ============================================================
// AULOAVA · Seed manual 2: 39 best-sellers (varias categorías)
// Inserta en Firebase los #1/top de Electronics, Toys, Beauty, Pet, Office.
// (Datos extraídos de las páginas de Amazon Best Sellers; Amazon
//  bloquea el fetch directo desde aquí, así que se usa la data ya obtenida.)
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
  // ---- Electrónica ----
  mk('Apple-EarPods-Headphones-Built-Control', 'B0DCH8VDXF', '513OSdW4elL',
    'Apple EarPods Headphones with USB-C Plug, Wired Ear Buds with Built-in Remote to Control Music, Phone Calls, and Volume',
    17.48, 4.5, 16772, 'Electrónica'),
  mk('Apple-AirTag-2nd-Generation-Precision', 'B0GJTFXNRX', '61Qd9Z9caRL',
    'Apple AirTag (2nd Generation): Tracker for Keychain, Wallet, and More; Locator with Sound; Simple One-Tap Setup with iPhone or iPad; Key Finder with up to 1.5X Precision Finding Range',
    22.56, 4.6, 8817, 'Electrónica'),
  mk('Apple-Bluetooth-Headphones-Personalized-Effortless', 'B0DGHMNQ5Z', '61iBtxCUabL',
    'Apple AirPods 4 Wireless Earbuds, Bluetooth Headphones, Personalized Spatial Audio, Sweat and Water Resistant, USB-C Charging Case, H2 Chip, Up to 30 Hours of Battery Life',
    87.12, 4.5, 33612, 'Electrónica'),
  mk('Sony-MDRZX110-BLK-Stereo-Headphones', 'B00NJ2M33I', '41CiQ7hR31L',
    'Sony ZX Series Wired On-Ear Headphones, Black MDR-ZX110',
    13.99, 4.5, 100473, 'Electrónica'),
  mk('Roku-Streaming-stick-HD-2025', 'B0DXXYS4BJ', '71CBWyQfKhL',
    'Roku Streaming Stick HD with Voice Remote | Compact 4K Streaming Device for TV with Roku Voice Remote & Long-Range Wi-Fi - Free & Live Local News, Sports',
    29.22, 4.6, 23021, 'Electrónica'),
  mk('Apple-iPad-11-inch-Display-All-Day', 'B0DZ75TN5F', '61aPY8odPSL',
    'Apple iPad 11-inch: A16 chip, 11-inch Model, Liquid Retina Display, 128GB, Wi-Fi 6, 12MP Front/12MP Back Camera, Touch ID, All-Day Battery Life',
    367.79, 4.7, 27565, 'Electrónica'),
  mk('Amazon-vibrant-helpful-routines-Charcoal', 'B09B8V1LZ3', '71hNp8d9WvL',
    'Amazon Echo Dot (newest model) - Vibrant sounding speaker, Designed for Alexa+, Great for bedrooms, dining rooms and offices, Charcoal',
    49.99, 4.7, 198007, 'Electrónica'),
  mk('Apple-Watch-Smartwatch-Aluminum-Always', 'B0FQF9ZX7P', '61T8W7-25IL',
    'Apple Watch Series 11 [GPS 42mm] Smartwatch with Rose Gold Aluminum Case with Light Blush Sport Band - S/M. Sleep Score, Fitness Tracker, Health Monitoring, Always-On Display, Water Resistant',
    266.11, 4.7, 3176, 'Electrónica'),

  // ---- Juguetes y Juegos ----
  mk('Crayola-Colored-Pencil-Supplies-Assorted', 'B00006RVTS', '61fEImDN-kL',
    'Crayola Colored Pencils (36ct), Teacher School Supplies for Kids & Adults, Preschool Classroom Must Haves, Coloring Gift, Ages 3+',
    6.49, 4.8, 50127, 'Juguetes y Juegos'),
  mk('Crayola-58-7812-N-A', 'B003HGGPLW', '813fj8QKksL',
    'Crayola Broad Line Markers (12 Count), Washable Markers for Kids, Assorted Colors, Arts & Crafts Supplies, For Coloring Books & Art Projects, Ages 3+',
    7.99, 4.8, 20374, 'Juguetes y Juegos'),
  mk('Crayola-Erasable-Non-Toxic-Pre-Sharpened-Gradation', 'B000PCWKBA', '71c-VnVqlbL',
    'Crayola Erasable Colored Pencils (24ct), Kids Coloring Pencils for Coloring Books, Assorted Colors, Arts & Crafts Supplies, Gifts, Ages 6, 7, 8',
    5.88, 4.7, 17793, 'Juguetes y Juegos'),
  mk('Play-Doh-Modeling-Compound-Non-Toxic-Exclusive', 'B00JM5GW10', '71LqxbA1WCL',
    'Play Doh Modeling Compound 10-Pack Case of Assorted Colors, Non-Toxic 2 oz. Cans, Back to School Gifts, Prizes, & Party Favors, Preschool Toys for Kids, Ages 2+',
    7.99, 4.7, 68954, 'Juguetes y Juegos'),
  mk('Bicycle-Standard-Poker-Size-Blackjack', 'B00E4AMFKK', '71KbVj1Q6jL',
    'Bicycle Playing Cards 2 Pack Standard Poker Size Red and Blue | Air-cushion finish, 52 cards plus 2 Jokers per deck, Great for poker and rummy',
    5.82, 4.8, 948, 'Juguetes y Juegos'),
  mk('SEREED-Balance-Toddler-Wheels-Birthday', 'B08SGH7NKX', '61tilO4erpL',
    'SEREED Baby Balance Bike for 1 Year Old Boy Girl, First Birthday Gift Toy | 12-24 Months Toddler Bike, First Learning Ride on Toys, 4 Silent Wheels Indoor Outdoor Baby Walker',
    32.99, 4.8, 16444, 'Juguetes y Juegos'),
  mk('LeapFrog-Learning-Friends-Words-Green', 'B07B6ZN7P8', '71wQb2LWUkL',
    'LeapFrog Learning Friends 100 Words Book',
    19.97, 4.8, 95987, 'Juguetes y Juegos'),
  mk('Mattel-Games-Collectible-Families-Exclusive', 'B07P6MZPK3', '81tVL-E4lkL',
    'Mattel Games UNO Card Game for Kid, Adult & Family Nights & Parties, Travel & Vacations, Color Blind Accessible & Customizable Deck',
    11.30, 4.8, 60731, 'Juguetes y Juegos'),

  // ---- Belleza ----
  mk('Medicube-Zero-Pore-Pads-Dual-Textured', 'B09V7Z4TJG', '71Mcspt-6AL',
    'medicube Toner Pads Zero Pore Pad 2.0 for Exfoliation and Pore Care | Dual-Textured Facial Pad with 4.5% AHA Lactic Acid, 0.45% BHA Salicylic Acid - Korean Skin Care, 70 Pads',
    18.90, 4.6, 30064, 'Belleza'),
  mk('Amazon-Basics-Cotton-Swabs-500ct', 'B09541P9WH', '612HeyYXOnL',
    'Amazon Basics Double-Tipped Cotton Swabs for Personal Hygiene and Baby Care, Cotton, Versatile, Baby Safe, 500 Count',
    2.64, 4.7, 79647, 'Belleza'),
  mk('Mighty-Patch-Hydrocolloid-Absorbing-count', 'B074PVTPBW', '61p+1+md+8L',
    'Mighty Patch Hero Cosmetics Original Nighttime Acne Pimple Patches, 36 Ct | #1 Hydrocolloid Acne Patches, Shrinking Zits & Whiteheads in 1 Use, Spot Treatment, Pimple Stickers for Face',
    12.99, 4.6, 184639, 'Belleza'),
  mk('Ordinary-Exfoliating-Brightening-Smoothing-Even-Looking', 'B071914GGL', '51bC4vVdkOL',
    'The Ordinary Glycolic Acid 7% Exfoliating Toner, Brightening and Smoothing Daily Toner for More Even-Looking Skin Tone',
    13.50, 4.7, 60516, 'Belleza'),
  mk('Neutrogena-Makeup-Remover-Micellar-Wipes', 'B00U2VQZDS', '71JnbwZyFoL',
    'Neutrogena Makeup Remover Micellar Wipes, 2 Pack of 25 Ct',
    9.97, 4.8, 121127, 'Belleza'),
  mk('Nizoral-Anti-Dandruff-Shampoo-Ketoconazole-Dandruff', 'B00AINMFAC', '71UKDMdW3KL',
    'Nizoral Anti-Dandruff Shampoo with 1% Ketoconazole, Fresh Scent, 7 Fl Oz',
    16.88, 4.6, 120104, 'Belleza'),
  mk('CeraVe-Moisturizing-Cream-Daily-Moisturizer', 'B00TTD9BRC', '61EidjXUBrL',
    'CeraVe Moisturizing Cream, Face & Body Moisturizer for Dry Skin, 19oz | Hyaluronic Acid For Instant Hydration, Skin Barrier Repair, Ceramide Moisturizer, Fragrance Free',
    18.96, 4.7, 147745, 'Belleza'),
  mk('l-f-Highly-Pigmented-Sculpting-Semi-Matte-Cruelty-Free', 'B0CMYR1CNK', '519zemKb6NL',
    'e.l.f. Cream Glide Lip Liner, Highly-Pigmented Pencil For Shaping & Sculpting Lips, Semi-Matte Finish, Vegan & Cruelty-Free',
    2.00, 4.6, 19442, 'Belleza'),

  // ---- Mascotas ----
  mk('Amazon-Basics-Leak-Proof-Quick-Dry-Absorbency', 'B00MW8G62E', '71LHksRF15L',
    'Amazon Basics Leak-Proof Dog and Puppy Potty Training Pee Pads with Quick-Dry 5-Layer Super Absorbent Design, Regular Size 22 x 22 inch, Blue & White, 100 Count',
    18.99, 4.4, 221137, 'Mascotas'),
  mk('Dr-Elseys-Premium-Clumping-Litter', 'B0009X29WK', '71gV7T7iW-L',
    'Dr. Elsey’s Ultra UnScented Clumping Clay Cat Litter 40 lb. Bag',
    22.99, 4.4, 69801, 'Mascotas'),
  mk('Earth-Rated-Lavender-Scented-Completely', 'B00BSYR7K8', '71l4DqotI3L',
    'Earth Rated Dog Poop Bags on Refill Rolls, 270 Bags, Lavender | Guaranteed Leak Proof and Extra Thick Waste Bag Refill Rolls',
    14.99, 4.8, 249041, 'Mascotas'),
  mk('Temptations-Treats-Chicken-Flavor-Holiday', 'B01LNB6SA0', '81cELYRF8iL',
    'Temptations Classic Crunchy and Soft Cat Treats, Tasty Chicken, 30 oz | Under 2 calories per treat, crunchy outside & soft inside, resealable tub',
    13.97, 4.8, 72785, 'Mascotas'),
  mk('AmazonBasics-Waste-Bags-Dispenser-Leash', 'B00NABTC8M', '71RhBxKwOWL',
    'Amazon Basics Dog Poop Leak Proof Bags with Dispenser and Leash Clip, Unscented, 13" x 9" Large Size, 300 Count',
    9.30, 4.8, 242221, 'Mascotas'),
  mk('Blue-Buffalo-Protection-Formula-Natural', 'B09K8YYVWV', '81x68cxW9UL',
    'Blue Buffalo Life Protection Formula Chicken Adult Dry Dog Food, 5 lb | Real Chicken #1 Ingredient, Supports Immunity with Antioxidant-Rich LifeSource Bits',
    14.97, 4.7, 29509, 'Mascotas'),
  mk('Milk-Bone-Original-Treats-Medium-10-Pound', 'B000I82DTU', '81IfJLJtCDL',
    'Milk-Bone Original Medium Dog Biscuits, 10 lb Box | 280+ treats, classic meaty taste, crunchy dog treats for dogs 20-50lbs, 15% protein',
    14.97, 4.8, 81743, 'Mascotas'),
  mk('Greenies-Original-Teenie-Dental-Holiday', 'B006W6YHYQ', '81X4MJaCf0L',
    'Greenies Teenie Original Natural Dental Dog Treats, Chicken, 130 Count | Vet-recommended, cleaner teeth after 28 days, cleans to gumline, for dogs 5-15 lbs',
    36.97, 4.8, 75396, 'Mascotas'),

  // ---- Oficina y Papelería ----
  mk('AmazonBasics-Multipurpose-Copy-Printer-Paper', 'B01FV0F8H8', '71gOCTFCCwL',
    'Amazon Basics Multipurpose Copy Printer Paper, 8.5 x 11 Inches, 20 lb, 92 Bright, White, 1 Ream (500 Sheets), Jam-Free',
    6.97, 4.8, 226491, 'Oficina y Papelería'),
  mk('BIC-Highlighters-Supplies-Textbooks-Classroom', 'B000Q5ZGIA', '81NC1rVkxJL',
    'BIC Brite Liner Highlighters, Chisel Tip, 5-Count Pack, Assorted Colors',
    1.79, 4.8, 43297, 'Oficina y Papelería'),
  mk('Texas-Instruments-Scientific-Calculator-Accents', 'B00000JBNX', '71UoB-VmSyL',
    'TI-30XIIS Scientific Calculator Texas Instruments, Black | Solar and battery powered, Two-line display, Fraction features',
    19.49, 4.7, 50833, 'Oficina y Papelería'),
  mk('Five-Star-1-Subject-College-Ruled-72565', 'B004K6LHF2', '71L2bqAx9xL',
    'Five Star Spiral Notebook + Study App, 1 Subject, College Ruled Paper, 8.5" x 11", 100 Sheets, Blue',
    2.99, 4.8, 6343, 'Oficina y Papelería'),
  mk('Ticonderoga-Wood-Cased-Graphite-Pre-Sharpened-13830', 'B006CSPZK4', '71vEYCAFOJL',
    'Ticonderoga Wood-Cased Pencils, Pre-Sharpened | #2 HB Soft, Yellow, 30 Count, Standard Size, High Quality Eraser',
    5.59, 4.8, 50786, 'Oficina y Papelería'),
  mk('Sharpie-Permanent-Markers-Resistant-Coloring', 'B00006IFHD', '61bQun7bh0L',
    'Sharpie Permanent Markers, Fine Tip, Black, 12 Count - Quick Drying, Fade Resistant, For Wood, Plastic, Paper, Metal, And More',
    7.99, 4.8, 46232, 'Oficina y Papelería'),
  mk('Paper-Mate-Medium-Assorted-Colors', 'B000J09CO6', '81KBCLnWyIL',
    'Paper Mate Flair Felt Tip Pens, Medium Point (0.7mm), 12 Count - For Arts & Crafts, Note-Taking, Journaling, School Supplies',
    9.79, 4.8, 78670, 'Oficina y Papelería'),
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
  for (const p of P) {
    const newRef = ref.push()
    await newRef.set({ ...p, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    n++
    console.log(`✔ ${n}/39  ${p.title.slice(0, 45)} -> ${p.category}`)
  }
  console.log(`\nInsertados ${n} productos.`)
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
