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

async function sniff(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', Range: 'bytes=0-15' },
    })
    const ct = (res.headers.get('content-type') || '').split(';')[0]
    const buf = new Uint8Array(await res.arrayBuffer())
    const hex = Array.from(buf.slice(0, Math.min(4, buf.length))).map((b) => b.toString(16).padStart(2, '0')).join(' ')
    return { status: res.status, ct, hex, len: buf.length }
  } catch (e) {
    return { status: 0, ct: 'ERR', hex: '', len: 0 }
  }
}

const results = []
let i = 0
const CONC = 8
async function worker() {
  while (i < Object.keys(all).length) {
    const k = Object.keys(all)[i++]
    const p = all[k]
    const r = await sniff(p.image)
    const ok = r.status !== 0 && (r.hex.startsWith('ff d8') || r.ct.includes('image'))
    results.push({ k, title: String(p.title).slice(0, 45), ok, ...r })
  }
}
await Promise.all(Array.from({ length: CONC }, worker))

const bad = results.filter((r) => !r.ok)
console.log(`OK=${results.length - bad.length}  SOSPECHOSAS=${bad.length}`)
const trash = results.filter((r) => r.hex !== 'ff d8' && (!r.ct.includes('image')))
console.log(`respuestas con status 200 pero sin magic JPEG: ${trash.length}`)
for (const r of trash.slice(0, 15)) console.log(` - ${r.status} ${r.ct} ${r.hex} | ${r.title} | ${String(r.k).slice(0,6)}...`)
process.exit(0)
