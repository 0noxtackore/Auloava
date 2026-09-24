// ============================================================
// AULOAVA · Generador de productos "Best Sellers de Amazon"
// Convierte las extracciones de las 6 categorías de
// https://www.amazon.com/Best-Sellers/zgbs en un único JSON
// con el esquema esperado por src/services/mock/index.js.
//
// Datos reales extraídos el 2026-09-23: title, ASIN, rating,
// nº de reseñas, precio e imagen (Amazon CDN).
//
// Uso: node scripts/generate-bestsellers.mjs
// ============================================================
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Formato: [título, asin, rating, reviews, precio, imagenKey(.ext)]
const BEAUTY = [
  ['eos Shea Better Body Lotion Cocoa Butter, 16 oz', 'B08KT2Z93D', 4.7, 78672, 9.97, '61IQUadfGEL.jpg'],
  ['medicube Zero Pore Pads 2 Plus, 70Pads', 'B09V7Z4TJG', 4.6, 32697, 18.9, '71Mcspt-6AL.jpg'],
  ['Clean Skin Club Clean Towels XL 50Ct', 'B07PBXXNCY', 4.8, 43164, 17.95, '61Cn1ooILhL.jpg'],
  ["MRS MEYER'S CLEAN DAY Hand Soap Refill, Lemon Verbena, 33 oz", 'B00F1U0YB4', 4.7, 130108, 7.61, '71O6EsQ5lqL.jpg'],
  ['Amazon Essentials Cotton Swabs, 500 ct', 'B09541P9WH', 4.7, 74015, 2.67, '61oqFXQSJIL.jpg'],
  ['Amazon Essentials Cotton Rounds, 400 ct', 'B09542G9ZN', 4.7, 54289, 2.96, '51q7TPeMd9L.jpg'],
  ['Mighty Patch Original Patch from Hero Cosmetics', 'B074PVTPBW', 4.6, 186057, 12.99, '61p+1+md+8L.jpg'],
  ['Neutrogena Makeup Remover Micellar Wipes 25 ct', 'B00U2VQZDS', 4.8, 121889, 9.97, '71JnbwZyFoL.jpg'],
  ['La Roche-Posay Toleriane Double Repair Face Moisturizer 2.5 oz', 'B01N9SPQHQ', 4.6, 51798, 24.99, '51x78epntaL.jpg'],
  ['Maybelline Lash Sensational Sky High Mascara', 'B08H3JPH74', 4.5, 189526, 10.82, '71MQo8pHmBL.jpg'],
  ['The Ordinary Glycolic Acid 7% Exfoliating Toner 8 oz', 'B071914GGL', 4.7, 64871, 13.5, '51bC4vVdkOL.jpg'],
  ['PanOxyl 10% Benzoyl Peroxide Acne Creamy Wash 5.5 oz', 'B081KL2QYJ', 4.6, 83520, 10.19, '71I9gtceY8L.jpg'],
  ['BIODANCE Bio-Collagen Real Deep Mask 30ct', 'B0B2RM68G2', 4.5, 48287, 19.0, '51ubxqzNGIL.jpg'],
  ['eos Cashmere Body Wash Coconut Water 16 oz', 'B0DPHQRLJC', 4.8, 22948, 9.98, '715Se8v8DWL.jpg'],
  ['Nizoral Anti-Dandruff Shampoo 7 fl oz', 'B00AINMFAC', 4.6, 116396, 16.88, '71UKDMdW3KL.jpg'],
  ['Vanicream Daily Facial Moisturizer 3 oz', 'B08BW46XXK', 4.6, 25885, 13.29, '61KvPxEVJlL.jpg'],
  ['La Roche-Posay Purifying Foaming Facial Cleanser 6.76 oz', 'B01N34XW93', 4.7, 46119, 14.99, '717F3ObzIeL.jpg'],
  ['Q-tips Cotton Swabs, 750 ct', 'B00J4YYFYA', 4.8, 20027, 4.73, '71ON1meCGlL.jpg'],
  ['essence Lash Princess False Lash Effect Mascara', 'B00T0C9XRK', 4.3, 418202, 10.96, '61K6cQhw4EL.jpg'],
  ['Native Deodorant Aluminum-Free, Coconut Vanilla 2.7 oz', 'B07GB3NVN1', 4.4, 116898, 12.97, '71+YrR0ql9L.jpg'],
  ['ANUA PDRN Hyaluronic Acid 100 Cream, 2.1 Fl oz', 'B0DWFLY18Y', 4.6, 5708, 21.6, '61HPLwL7omL.jpg'],
  ['The Ordinary Niacinamide 10% + Zinc 1% 30ml', 'B01MDTVZTZ', 4.7, 67000, 5.1, '612NxRjAoCL.jpg'],
  ['grace & stella Under Eye Masks 30 Pairs', 'B014E2D6BY', 4.4, 48863, 21.56, '712xND-FRiL.jpg'],
  ['Revlon ColorStay Waterproof Eyeliner Pencil', 'B01J1A3TFW', 4.5, 54872, 11.38, '71ZinfmfzKL.jpg'],
  ['e.l.f. Cream Glide Multi-Use Lip Liner', 'B0CMYR1CNK', 4.6, 20532, 2.0, '519zemKb6NL.jpg'],
  ['CeraVe Hydrating Facial Cleanser 16 oz', 'B01MSSDEPK', 4.7, 133275, 14.24, '71V-hFCug0L.jpg'],
  ['The Ordinary Hyaluronic Acid 2% + B5 30ml', 'B01MYEZPC8', 4.7, 41375, 8.41, '61Se8Z9n4oL.jpg'],
  ['Degree Men UltraClear Black + White Antiperspirant Deodorant', 'B075JRT85B', 4.7, 43104, 7.98, '81CbbuR+fkL.jpg'],
  ['e.l.f. Instant Lift Brow Pencil', 'B07PBQZ3KF', 4.6, 76686, 4.0, '51q4yBqcL0L.jpg'],
  ['Differin Adapalene Gel 0.1% Acne Treatment, 15g', 'B07L1PHSY9', 4.5, 71773, 12.99, '71VRnfHGbEL.jpg'],
]

const ELECTRONICS = [
  ['blink Plus Plan, 1 Camera Annual Subscription', 'B08JHCVHTY', 4.4, 280480, 11.99, '31YHGbJsldL.png'],
  ['Apple EarPods with USB-C, wired, no sound leakage', 'B0DCH8VDXF', 4.5, 18198, 17.87, '513OSdW4elL.jpg'],
  ['Apple AirTag 2nd Gen (1-pack) Tracker', 'B0GJTFXNRX', 4.6, 11046, 22.32, '61Qd9Z9caRL.jpg'],
  ['Apple AirPods Pro 3 with USB-C MagSafe', 'B0FQFB8FMG', 4.4, 15441, 183.44, '61solmQSSlL.jpg'],
  ['Roku Streaming Stick HD', 'B0DXXYS4BJ', 4.6, 24439, 36.0, '71CBWyQfKhL.jpg'],
  ['Amazon Fire TV Stick HD', 'B0DJGDC3BD', 4.0, 5444, 39.99, '610j-wmxRcL.jpg'],
  ['Apple AirPods 5, new features, colorful design', 'B0HJB76H2V', 5.0, 6, 179.0, '61UysjAXuXL.jpg'],
  ['Apple iPad 11-inch (A16), Wi-Fi 128GB', 'B0DZ75TN5F', 4.7, 28845, 387.44, '61aPY8odPSL.jpg'],
  ['YISHU Surge Protector Power Strip with USB-C, 1875W', 'B09PDLBFKY', 4.6, 53633, 9.99, '51OrfSnTVwL.jpg'],
  ['QINLIANF Wall Charger Fast Charging, 40W Dual USB-C', 'B08R6S1M1K', 4.7, 118542, 9.98, '51lGPGOkjUL.jpg'],
  ['Roku TV Remote Replacement Voice Remote', 'B0CQF6T2K1', 4.6, 12088, 9.99, '71Wv66Eb6cL.jpg'],
  ['Replacement Remote 2Pack for Roku TV, 4K', 'B09Z6Q2MLC', 4.5, 74728, 8.97, '71Z6Vs6+hDL.jpg'],
  ['Olcorife Power Strip with USB Charger, 6 Outlets', 'B0DPKKMPBD', 4.7, 1929, 9.99, '611GtBfvlGL.jpg'],
  ['SUPERDANNY Extension Cord 10Ft with Multiple Outlets', 'B0DZ254SSR', 4.7, 8092, 13.99, '612NrGLfOqL.jpg'],
  ['HANYCONY Surge Protector Power Strip 5 Outlets 4 USB', 'B092J8LPWR', 4.8, 68737, 11.99, '61q9hmplGFL.jpg'],
  ['Soundcore by Anker Q20i Wireless Headphones', 'B0C3HCD34R', 4.5, 74852, 44.99, '71XBzSvq-NL.jpg'],
  ['Amazon Fire TV Stick 4K Plus', 'B0F7Z4QZTT', 4.6, 114470, 69.99, '51WtNy0OxLL.jpg'],
  ['OURA Ring 5 Sizing Kit (Free after purchase)', 'B0GRKC9NJP', 4.6, 919, 10.0, '61HAkWN1-LL.jpg'],
  ['TOZO A1 Wireless Earbuds Bluetooth 5.3', 'B09FT58QQP', 4.3, 117409, 13.96, '81+4jNKVFgL.jpg'],
  ['Soundcore P30i Wireless Earbuds with ANC', 'B0CRTYZG5C', 4.3, 42502, 39.99, '51HbL1WS+KL.jpg'],
  ['Amazon Fire TV Stick 4K Select', 'B0C6W3D4RM', 4.1, 16675, 49.99, '61r3G3vAhBL.jpg'],
  ['Mounting Dream TV Wall Mount for 37-70 inch TVs', 'B00SFSU53G', 4.8, 75828, 37.99, '61Pd7zj64aL.jpg'],
  ['JBL Vibe Beam 2 Wireless Earbuds', 'B0DN45YMP6', 4.1, 7204, 39.95, '618f5yBk26L.jpg'],
  ['TAGRY Bluetooth Headphones Over Ear Wireless', 'B09DT48V16', 4.4, 88947, 39.99, '61uEvVoizoL.jpg'],
  ['Alex Tech Cord Protector Wire Loom Sleeve, 1/4 inch', 'B07FW3GTXB', 4.7, 84974, 8.99, '71t6eXtVD6L.jpg'],
  ['Amazon Echo Dot (5th Gen) Smart Speaker', 'B09B8V1LZ3', 4.7, 199933, 79.99, '71hNp8d9WvL.jpg'],
  ['Cable Zip Ties 400 Pack Multi-Purpose', 'B08TVLYB3Q', 4.6, 24313, 6.99, '71FzZl2T6KL.jpg'],
  ['FUJIFILM Instax Mini Film Twin Pack (20 shots)', 'B00EB4ADQW', 4.8, 112939, 17.5, '61dgEk4GNlL.jpg'],
  ['Pipishell TV Wall Mount Full Motion for 26-55 inch', 'B07SHFPD8S', 4.6, 215223, 15.98, '61tI8ajZYZL.jpg'],
  ['Ljusmicker AirPods Pro 3 Case with Keychain', 'B0FPCJF1H2', 4.5, 19071, 5.99, '61QgaLoWrhL.jpg'],
]

const KITCHEN = [
  ['Owala FreeSip Insulated Stainless Steel Water Bottle 24 oz', 'B085DVHQ57', 4.6, 139020, 28.19, '71Cfld2aMpL.jpg'],
  ['Etekcity Food Kitchen Scale Multifunction Digital', 'B0113UZJE2', 4.6, 177290, 8.9, '91YrLTBnMcL.jpg'],
  ['HydroJug Traveler 40oz Half Gallon Water Bottle', 'B0CQVWT2NH', 4.6, 18275, 31.99, '41I8AN0RAgL.jpg'],
  ['Owala SmoothSip Coffee Mug Tumbler 20 oz', 'B0DF472VMZ', 4.6, 14918, 23.49, '311JdFvhtVL.jpg'],
  ['bella 2-Slice Toaster Matte, 7 Shade Settings', 'B0CYJBB2JQ', 4.2, 20740, 19.12, '71zZ0tSkfHL.jpg'],
  ['Amazon Basics Kitchen Scale Digital Stainless Steel', 'B06X9NQ8GX', 4.7, 118974, 8.6, '71eiII6MS-L.jpg'],
  ['KitchenAid Classic Multifunction Can Opener', 'B07YP2VH4B', 4.6, 89620, 13.72, '51yO+bt+mqL.jpg'],
  ['Lifewit Insulated Lunch Bag Reusable Cooler Tote', 'B0B56CHMSC', 4.5, 63334, 7.98, '71tf1kD9PBL.jpg'],
  ['STANLEY Quencher H2.0 FlowState Tumbler 30 oz', 'B0CP9YB3Q4', 4.7, 205183, 33.95, '51-U5dEbEBL.jpg'],
  ['Pureegg Table Cloth 10 Pack Disposable Plastic', 'B0CBM682SQ', 4.5, 7347, 8.49, '71eAr9iJ0KL.jpg'],
  ['Meat Thermometer Digital Instant Read Food Thermometer', 'B0GVM8N2CK', 4.7, 1624, 9.98, '71HAYvyw1fL.jpg'],
  ['TrendPlain Olive Oil Sprayer for Cooking, 2 Pack', 'B0CJF94M8J', 4.6, 47536, 8.99, '716HuBmcRsL.jpg'],
  ['Air Fryer Liners Disposable Parchment Paper 100 Pack 8 inch', 'B0B6PLG6G2', 4.6, 33616, 9.99, '710lcyAkSSL.jpg'],
  ['Alpha Grillers Instant Read Meat Thermometer', 'B00S93EQUK', 4.8, 92298, 12.31, '81bpKKv68-L.jpg'],
  ['Reynolds Cut-Rite Wax Parchment Paper Sheets 60 sq ft', 'B07PFYT8MC', 4.8, 23555, 3.59, '71fSQYVwU7L.jpg'],
  ['Pink Cheesecloth Table Runner 6ft Fringe, Pack of 2', 'B0B2P4P2R4', 4.7, 7790, 8.99, '61rnDkuAHzL.jpg'],
  ['Mueller Vegetable Chopper Onion Dicer', 'B08N9Q24M9', 4.5, 34144, 24.97, '81+tBoD7McL.jpg'],
  ['Cisily Sponge Holder for Kitchen Sink 2 Pack', 'B0C3QZ7SNF', 4.6, 14975, 12.59, '81shIEM-H2L.jpg'],
  ['HOTOR Insulated Lunch Box for Women Men', 'B0DBDKT4QC', 4.5, 9085, 7.98, '7114mj4izqL.jpg'],
  ['Ninja Fit Compact Personal Blender 1000W, 18 oz', 'B01FHOWYA2', 4.7, 42118, 54.98, '710oNE8RCjL.jpg'],
  ['Air Fryer Liners Disposable Square 125 Pcs', 'B0C6Y8NYK1', 4.6, 28105, 9.99, '81Fr+9o0iWL.jpg'],
  ['KitchenAid Classic Kitchen Shears', 'B07PZF3QS3', 4.8, 72431, 9.99, '51Byq+vTy1L.jpg'],
  ['Homaxy Dish Cloths Cotton 6-Pack 12x12', 'B07WMQP4SF', 4.5, 41083, 8.98, '81YlKeBDwML.jpg'],
  ['STANLEY Quencher ProTour Flip Straw Tumbler 24 oz', 'B0DCDZP98B', 4.7, 20811, 30.0, '51L-q8h+bwL.jpg'],
  ['Rubbermaid Brilliance Food Storage Containers 5-Set', 'B079M8FPTW', 4.7, 59679, 26.72, '81Ap89R-ajL.jpg'],
  ['YARRAMATE Olive Oil Sprayer Glass Bottle 2 Pack', 'B0CP4XY9QC', 4.4, 49764, 7.99, '71ZjnwrH7iL.jpg'],
  ['Turelar Immersion Blender Hand Mixer 800W 4-in-1', 'B0CPLVLFK2', 4.5, 7962, 35.95, '61XRVcpkxxL.jpg'],
  ['YETI Rambler 20 oz Tumbler', 'B073WJMKHN', 4.8, 147815, 35.0, '61lo0OIlLvL.jpg'],
  ['iBayam Kitchen Scissors 2-Pack Ultra Sharp', 'B08FLKHG8J', 4.8, 57562, 7.59, '71WgPDP5IDL.jpg'],
  ['Vacuum Sealer Bags Rolls 2 Rolls x 8x20 Heavy Duty', 'B08NSPDY5F', 4.4, 4687, 16.99, '717WZHBCd6L.jpg'],
]

const FASHION = [
  ['ANRABESS Women Long Sleeve Shirts 2026 Oversized', 'B0CYZM5RSM', 4.6, 11612, 8.99, '71QZExoIbxL.jpg'],
  ['Hanes Boxer Briefs Pack for Men (8-pack)', 'B086KSDTQ4', 4.4, 141084, 23.18, '81cd4aNVNhL.jpg'],
  ['Hanes EcoSmart Fleece Hoodie', 'B00JUM3BSM', 4.5, 171741, 16.99, '91V+Dy5+d1L.jpg'],
  ['Gildan Heavy Cotton Crew T-Shirts, 6-Pack', 'B07JCS8NRC', 4.6, 335237, 21.84, '51wDsZxtTLL.jpg'],
  ['Trendy Queen Womens Long Sleeve T Shirt Casual', 'B0BW8ZFMDJ', 4.4, 7928, 5.01, '61dKra3latL.jpg'],
  ['OEAK Jelly Bras: 2017. 3-pack', 'B0D8FJVTBG', 4.0, 15181, 27.99, '81+NcCyDO-L.jpg'],
  ['Hanes EcoSmart Fleece Crewneck Sweatshirt', 'B01L8JJLLK', 4.6, 142061, 17.99, '71ukKld6F1L.jpg'],
  ['Hanes Full-Zip EcoSmart Hoodie', 'B00JUM4DKC', 4.5, 89773, 22.99, '71fm7+WAt4L.jpg'],
  ['SINOPHANT Women High Waisted Leggings Yoga Pants', 'B0CKZ4ZWYG', 4.4, 14456, 6.39, '61L7eBwEtCL.jpg'],
  ['J.VER Men Dress Shirts Slim Fit Button Down', 'B09JFR8HTV', 4.5, 39111, 18.99, '51rkKPruYvL.jpg'],
  ['Amazon Essentials Women Cotton Bikini Brief 12-Pack', 'B06XKSR4R1', 4.4, 44262, 8.78, '71PHQkYff+L.jpg'],
  ['LetsJoli Women Seamless Jelly Bras', 'B0F6TWKDFK', 4.1, 23758, 19.99, '61bWdCuPmYL.jpg'],
  ['Hanes Underwear Undershirt Pack for Men', 'B00D1ARZMC', 4.4, 95697, 15.37, '51JzwHcjh1L.jpg'],
  ['Carhartt Men K87 Workwear Pocket T-Shirt', 'B01BXGKDD8', 4.6, 22211, 13.68, '71NCRNqsTnL.jpg'],
  ['Dickies Men Dri-tech Moisture Control Socks 6-Pack', 'B004QF0TFQ', 4.7, 217950, 11.99, '91wgdLWJc2L.jpg'],
  ['PRETTYGARDEN Women Bell Long Sleeve Sweater', 'B0F597M88C', 4.3, 5299, 9.85, '61Jg4BR4nVL.jpg'],
  ['TUMELLA Windproof Travel Umbrella', 'B0BLHC5RWG', 4.5, 21969, 19.99, '81KSIiGUefL.jpg'],
  ['G4Free Women Summer Wide Leg Pants', 'B0CR5NHMB2', 4.3, 6798, 36.99, '51FbAdOJGaL.jpg'],
  ['Nike Unisex Cushioned Everyday Training Socks 6-Pair', 'B00K5CN73A', 4.6, 25166, 18.99, '61eYZT1LYAL.jpg'],
  ['SINOPHANT Women Full Length Capri Yoga Leggings', 'B0BVF476TZ', 4.5, 19393, 7.49, '51X5PPehAKL.jpg'],
  ['Gildan Ultra Cotton Adult T-Shirt G2000', 'B07611ZQF1', 4.5, 114041, 11.11, '61x-LF9fyYL.jpg'],
  ['YEOREO Women Seamless High Waist Workout Leggings', 'B0FG298Z4H', 4.1, 4036, 29.99, '51ALuls6oZL.jpg'],
  ['EVERSWE Women Opaque Tights Sheer 50 Denier', 'B07ZTD3JZH', 4.5, 21162, 6.5, '51Nj2NTfZoL.jpg'],
  ['CRZ YOGA Butterluxe High Waisted Lounge Leggings 25inch', 'B09P1GB319', 4.6, 18638, 32.0, '61Isb40O6wL.jpg'],
  ['Stelle Women Ballet Flats Shoes', 'B07KBV688F', 4.7, 39167, 10.99, '61CGDIk7SEL.jpg'],
  ['Comfort Colors Adult Jersey Tee G1717', 'B07M989JLF', 4.4, 30302, 9.74, '61KOLIOMSNL.jpg'],
  ['Trendy Queen Women Cropped Cardigan Knit Sweater', 'B0DCW38YR7', 4.3, 1907, 14.99, '71EMLE2FjpL.jpg'],
  ['Amazon Essentials Women Ballet Flats', 'B07FQPT5MZ', 4.3, 85077, 19.5, '61J+pOiaaEL.jpg'],
  ['Amazon Essentials Men Sweatpants Open Bottom', 'B075JW7CCH', 4.5, 63353, 13.7, '71KX+SabYML.jpg'],
  ['Amazon Essentials Women Tank Tops 2-Pack', 'B0775Q1K93', 4.6, 78586, 8.91, '51lx2I-TUdS.jpg'],
]

const HPC = [
  ['Amazon Basics 48-Pack AA Alkaline Batteries', 'B00MNV8E0C', 4.7, 954575, 15.29, '81iJ+tnLADL.jpg'],
  ['Scott ComfortPlus Toilet Paper, 12 Rolls', 'B07BGLT25K', 4.5, 134840, 5.68, '81pfJ-rLWNL.jpg'],
  ['Bounty Quick-Size Paper Towels, 12 Family Rolls', 'B079VP6DH5', 4.8, 236708, 46.08, '81qihSiU-0L.jpg'],
  ['Amazon Basics AAA Batteries 36-Pack', 'B00LH3DMUO', 4.7, 679452, 13.7, '81Apg8B6+0L.jpg'],
  ['Bounty Select-A-Size Paper Towels, 8 Double Rolls', 'B0DQYR6X8R', 4.8, 23937, 6.97, '8122NZZjJnL.jpg'],
  ['Angel Soft Toilet Paper Mega Rolls, 24 Ct', 'B0FN4NH4K8', 4.7, 108506, 12.77, '71XgUC2G6mL.jpg'],
  ['Amazon Basics Disposable Paper Plates, 9 inch, 100 Count', 'B0C2CY22B8', 4.7, 60433, 5.97, '715RiaPa6tL.jpg'],
  ['Scott Choose-A-Sheet Paper Towels, 8 Rolls', 'B0DF8RSVJK', 4.6, 47510, 6.96, '81GimKZfzDL.jpg'],
  ['DUDE Wipes Flushable Moist Wipes, 48 Count', 'B010NE2XPC', 4.7, 244265, 20.58, '81FF8u8PgxL.jpg'],
  ['Pure Encapsulations Magnesium Glycinate 120 Caps', 'B07P5K7DQP', 4.7, 51873, 27.0, '71fo5djLgDL.jpg'],
  ['Amazon Basics 2-Ply Toilet Paper, 30 Rolls', 'B095CN96JS', 4.4, 103639, 25.21, '71OrNzZA+JL.jpg'],
  ['LMNT Electrolytes Watermelon Salt Variety Pack', 'B08ZJQ1XD4', 4.7, 6736, 45.0, '71O37o3ZoOL.jpg'],
  ['Charmin Ultra Soft Toilet Paper, 24 Double Rolls', 'B0798DVT68', 4.8, 128112, 35.49, '81Xyre0z0VL.jpg'],
  ['Dixie Ultra Paper Plates 8.5 inch, 60 Count', 'B0748J34WZ', 4.8, 67043, 5.89, '718Tr1uB1OL.jpg'],
  ['Amazon Basics Flex-Sheets Paper Towels, 24 Pack', 'B09BWFX1L6', 4.1, 74745, 22.86, '71v-pTar1AL.jpg'],
  ['Quilted Northern Ultra Plush Toilet Paper, 12 Mega Rolls', 'B0BB3JGBH5', 4.7, 99798, 6.98, '81c1q4HToRL.jpg'],
  ["Miss Mouth's Messy Eater Stain Treater, 21 oz", 'B01EIG6A4Q', 4.3, 46213, 7.97, '61QHDaGestL.jpg'],
  ['Nutricost Creatine Monohydrate Micronized Powder', 'B00GL2HMES', 4.7, 60501, 21.5, '61-qBASHR1L.jpg'],
  ['Boka Ela Mint Natural Toothpaste 4-Pack', 'B083JHCCV2', 4.5, 62062, 11.62, '61i9AzDeLqL.jpg'],
  ['Amazon Basics 13-Gallon Trash Bags 150 Count', 'B09CD6Z7GB', 4.4, 85003, 23.71, '71Vpmck1aLL.jpg'],
  ['Liquid IV Hydration Multiplier Lemon Lime 16 Sticks', 'B01IT9NLHW', 4.6, 106326, 24.0, '81gX3T0Yj0L.jpg'],
  ['Optimum Nutrition Gold Standard Whey Protein 5lb Double Rich Chocolate', 'B000GISTZ4', 4.7, 49035, 45.32, '71dfm5dwtwL.jpg'],
  ['Dawn Ultra Dish Soap Refill 2x48 oz', 'B0FX5X647R', 4.8, 125077, 6.87, '71uOsJVS5RL.jpg'],
  ['Charmin Ultra Soft Toilet Paper, 6 Mega Rolls', 'B0FLFR269F', 4.8, 31104, 7.99, '61Ry+lOabTL.jpg'],
  ['Brawny Tear-A-Square Paper Towels, 8 Rolls', 'B0DFHMZ922', 4.8, 7573, 11.0, '71YEXsPAO7L.jpg'],
  ['BAND-AID Flexible Fabric Adhesive Bandages 30 ct', 'B00B6A6XOK', 4.8, 76813, 8.97, '81ByQOlE1JL.jpg'],
  ['Kleenex Ultra Soft Facial Tissues, 8 Boxes', 'B0CTD36YKK', 4.8, 31631, 15.29, '81rOPPxAokL.jpg'],
  ["Physician's CHOICE Probiotics 60 Billion CFU", 'B079H53D2B', 4.6, 144744, 21.35, '81F83eGmXEL.jpg'],
  ['Tide PODS Laundry Detergent 112 ct', 'B0BJMV9BXJ', 4.8, 280955, 21.8, '81Z9d0rWBdL.jpg'],
  ['Pure Protein Bars High Protein Variety Pack 6 Count, 120g', 'B00MNXGSAI', 4.4, 15953, 16.99, '81DbPa7uIEL.jpg'],
]

const COINS = [
  ['2026 Trump $1 Coin Roll, 25-Coin, P Mint', 'B0HJYHF1CG', 1.0, 2, 89.95, '81T+PjuHS-L.jpg'],
  ['2025 Final Issue Lincoln Cent Penny Rolls (50-Coin) P&D', 'B0H8WLRM4T', 4.6, 41, 39.95, '81Gfvxrf8+L.jpg'],
  ['2026 Trump Semiquincentennial Presidential Dollar P', 'B0HJB1QW8D', 1.0, 3, 8.49, '81y6tCZ+DaL.jpg'],
  ['Trump 250th Anniversary Challenge Coin', 'B0H5BYZRFP', 4.7, 13, 9.99, '81BkOqEK-RL.jpg'],
  ['2026 P Semiquincentennial Trump Presidential $1', 'B0HHVMC8XT', 1.0, 2, 7.95, '51VDargGnaL.jpg'],
  ['2026 American Silver Eagle 1 oz Fine Silver Coin', 'B0CRQJNFFH', 4.6, 198, 94.95, '815bkRA307L.jpg'],
  ['1954-1970 British Sixpence Coin', 'B0BGYL2RQK', 4.7, 222, 6.79, '611iOt3bb2L.jpg'],
  ['Dolly Memorial Novelty Coin 1946-2026', 'B0HHRRR6RK', 5.0, 2, 5.99, '81MAXJv6JlL.jpg'],
  ['Donald Trump America 250 Challenge Coin', 'B0H5QRQF87', 4.7, 27, 9.99, '81XEJyCoKHL.jpg'],
  ['U.S. Army 250th Anniversary Challenge Coin', 'B0F9KM51V2', 4.6, 234, 13.99, '81pmDDbOrhL.jpg'],
  ['Lincoln Wheat Cent 1909 S VDB Coin', 'B0CFYYBHK3', 4.6, 651, 9.99, '81cmag7SeUL.jpg'],
  ['50 Wheat Pennies Unsearched Shotgun Roll', 'B011LOOKV8', 3.7, 1770, 15.95, '71V4oUDB5bL.jpg'],
  ['WUSUTE Gamer Decision Coin', 'B0G3PJT54G', 4.9, 35, 8.38, '81UiTsaj9UL.jpg'],
  ['1936 Year Set Collector Coins 5 Coins', 'B07JH9HD1S', 4.6, 405, 57.99, '61rcABmtIKL.jpg'],
  ['F-CAW-F Coin', 'B0GS9D8YSG', 4.8, 40, 11.99, '81zG++7tvzL.jpg'],
  ['Decision Coin YES NO Choice Coin', 'B0H4ZZT9F3', 5.0, 4, 9.99, '51D5jPyR4CL.jpg'],
  ['US Veteran Challenge Coin, Armed Forces Memorial', 'B0GSQLP4ZW', 4.6, 93, 9.99, '91AxErTPu1L.jpg'],
  ['Old Friends Forever Club Coin', 'B0GZW7FCQ6', 4.4, 15, 14.85, '81lA142VvyL.jpg'],
  ['Trump 2025 Gold American Eagle Challenge Coin', 'B0DQR571YK', 4.9, 18, 9.98, '71x-miM8dWL.jpg'],
  ['Over 50 World Coins Grab Bag', 'B00BUB7TM0', 4.2, 2397, 19.78, '81lFL2LQBJL.jpg'],
  ['Dolly Memorial Coin 1946-2026 Tennessee Tribute', 'B0HJ41LLSY', null, null, 4.98, '91ZcsBj5UnL.jpg'],
  ['USA 250th Anniversary Commemorative Challenge Coin', 'B0GSZRXCZV', 4.8, 49, 9.99, '71vEPGpXsiL.jpg'],
  ['1909-1958 Wheat Penny Shot Gun Roll of 50', 'B0D24SHZRH', 4.1, 320, 19.99, '61KPvGaVITL.jpg'],
  ['2009 P&D Lincoln Cent 8-Coin Set W/ Wide & Close AM', 'B0CWBT9KPF', 4.6, 163, 12.5, '916Tmwm6aYL.jpg'],
  ['Aizics Mint Trump $1 Silver Coin, 2025', 'B0DBKB337K', 4.7, 1447, 12.98, '81GzQ87TYuL.jpg'],
  ['2026 P Birth Year Coin Set', 'B0GV1QXPDL', 4.5, 53, 32.99, '81W+a6AxcGL.jpg'],
  ['Crucifixion of Jesus Challenge Coin 10pcs', 'B0HHQZF9QP', null, null, 21.98, '711c+SXrDsL.jpg'],
  ['Unsearched Wheat Penny w/ Mercury Dime Lot', 'B07RZ4DJLL', 3.8, 1638, 29.95, '61i+LXdFW6L.jpg'],
  ['Semiquincentennial Quarters 2026: Complete Set', 'B0GVCCL285', 4.6, 52, 8.13, '71UmNhJkLaL.jpg'],
  ['Rooted in Christ Challenge Coin', 'B0CC97VDVM', 4.9, 304, 11.99, '81Q9P2q5oqL.jpg'],
]

// ASINs con precio estimado "list price" (descuento mostrado en la UI)
const ORIGINAL_PRICES = {
  B00JUM3BSM: 21.99, // Hanes EcoSmart Hoodie
  B01L8JJLLK: 23.99, // Hanes EcoSmart Crewneck
  B00JUM4DKC: 30.99, // Hanes Zip-up Hoodie
}

const COMMISSION_BY_CATEGORY = {
  Belleza: 6,
  Tecnología: 4,
  Electrónica: 4,
  Hogar: 5,
  Moda: 7,
  Salud: 5,
  Alimentos: 4,
  Accesorios: 8,
}

const IMG_BASE = 'https://images-na.ssl-images-amazon.com/images/I/'
const TAG = 'auloava-20'

const categoryFor = {
  beauty: () => 'Belleza',
  electronics: (title) =>
    /airpods|airtag|headphones|headphone|earbud|soundcore|jbl|tagry|tozo|instax|echo dot|ring/i.test(title)
      ? 'Tecnología'
      : 'Electrónica',
  kitchen: () => 'Hogar',
  fashion: () => 'Moda',
  hpc: (title) => {
    if (/batteries/i.test(title)) return 'Electrónica'
    if (/paper towel|toilet paper|plates|trash|facial tissue|tide|dawn|kleenex|bounty|brawny|scott|angel soft|charmin|quilted|stain/i.test(title)) return 'Hogar'
    if (/protein bars/i.test(title)) return 'Alimentos'
    return 'Salud'
  },
  coins: () => 'Accesorios',
}

const RAW = { beauty: BEAUTY, electronics: ELECTRONICS, kitchen: KITCHEN, fashion: FASHION, hpc: HPC, coins: COINS }

const products = []
let total = 0

for (const [source, list] of Object.entries(RAW)) {
  list.forEach(([title, asin, rating, reviews, price, imageKey], i) => {
    const category = categoryFor[source](title)
    const commission = COMMISSION_BY_CATEGORY[category]
    const originalPrice = ORIGINAL_PRICES[asin] ?? null
    const [key, ext] = imageKey.split('.')
    products.push({
      title,
      platform: 'amazon',
      category,
      price,
      originalPrice,
      rating,
      ratingCount: reviews,
      commission,
      stock: 300,
      image: `${IMG_BASE}${key}._AC_SX679_.${ext || 'jpg'}`,
      affiliateUrl: `https://www.amazon.com/dp/${asin}?tag=${TAG}`,
      rank: i + 1,
      source: `amazon-bestsellers-${source}`,
    })
    total++
  })
}

const out = fileURLToPath(new URL('../data/bestseller-products.json', import.meta.url))
writeFileSync(out, JSON.stringify(products, null, 2) + '\n')
console.log(`OK → data/bestseller-products.json (${total} productos)`)