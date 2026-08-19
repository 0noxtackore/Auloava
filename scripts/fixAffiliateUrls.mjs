// Normaliza los affiliateUrl de Amazon ya guardados en Firebase a la
// forma canónica https://www.amazon.com/dp/<ASIN>?tag=... para evitar
// la página interstitial "Continue shopping" de Amazon.
import { readFileSync } from 'node:fs'
import admin from 'firebase-admin'

const sa = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL: 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app' })
const db = admin.database()

const clean = (url) => {
  if (!url) return url
  const m = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)
  if (!m) return url
  const asin = m[1].toUpperCase()
  const tagMatch = url.match(/[?&]tag=([^&]+)/i)
  const tag = tagMatch ? tagMatch[1] : 'auloava-20'
  return `https://www.amazon.com/dp/${asin}?tag=${tag}`
}

const snap = await db.ref('products').get()
if (!snap.exists()) { console.log('Sin productos'); process.exit(0) }
const obj = snap.val()
let updates = 0
for (const [id, p] of Object.entries(obj)) {
  if (p.platform !== 'amazon' || !p.affiliateUrl) continue
  const fixed = clean(p.affiliateUrl)
  if (fixed !== p.affiliateUrl) {
    await db.ref(`products/${id}`).update({ affiliateUrl: fixed })
    updates++
  }
}
console.log(`URLs de afiliado normalizadas: ${updates}`)
process.exit(0)
