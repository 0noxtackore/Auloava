import { readFileSync } from 'node:fs'
import admin from 'firebase-admin'

const sa = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))
admin.initializeApp({
  credential: admin.credential.cert(sa),
  databaseURL: 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app',
})
const db = admin.database()
const snap = await db.ref('products').once('value')
const all = snap.val() || {}

let http = 0, data = 0, other = 0, noImg = 0
const httpSamples = []
for (const [k, p] of Object.entries(all)) {
  const img = p.image
  if (!img) noImg++
  else if (String(img).startsWith('data:')) { data++; httpSamples.push(`${k} | DATA(${img.length}ch) | ${String(p.title).slice(0,40)} | photos=${p.photos ? p.photos.length : '-'} | hasId=${p.id ? 'y' : 'n'}`) }
  else if (/^https?:\/\//.test(String(img))) { http++; if (httpSamples.length < 3 || String(img).includes('m.media')) httpSamples.push(`${k} | ${String(img).slice(0, 70)}`) }
  else { other++; httpSamples.push(`${k} | OTHER=${String(img).slice(0,50)}`) }
}
console.log(`http=${http}  dataURL=${data}  other=${other}  sinImage=${noImg}`)
console.log('\nmuestras:')
for (const s of httpSamples.slice(0, 10)) console.log(' -', s)
console.log('\ncon field photos:', Object.keys(all).filter((k) => Array.isArray(all[k].photos) && all[k].photos.length).length)
process.exit(0)