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
const keys = Object.keys(all)

async function fullCheck(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: 'https://auloava.netlify.app/',
      },
      redirect: 'follow',
    })
    const ct = (res.headers.get('content-type') || '').split(';')[0]
    const buf = new Uint8Array(await res.arrayBuffer())
    const hex = Array.from(buf.slice(0, 4)).map((b) => b.toString(16).padStart(2, '0')).join(' ')
    const finalUrl = res.url || url
    return { status: res.status, ct, hex, bytes: buf.length, finalUrl }
  } catch (e) {
    return { status: 0, ct: 'ERR', hex: '', bytes: 0, finalUrl: e.message }
  }
}

const bad = []
let i = 0
const CONC = 6
async function worker() {
  while (i < keys.length) {
    const k = keys[i++]
    const p = all[k]
    const opt = p.image.replace(/(_AC_SX)\d+(_\.[A-Za-z0-9]+)$/i, '$1480$2'); const r = await fullCheck(opt)
    const isImg = /^image\//.test(r.ct) && r.hex.startsWith('ff d8')
    if (r.status !== 200 || !isImg) {
      bad.push({ k, title: String(p.title).slice(0, 55), img: p.image, ...r })
      console.log(`MAL ${r.status} ${r.ct} ${r.hex} ${r.bytes}B | ${String(p.title).slice(0, 40)}`)
    }
  }
}
await Promise.all(Array.from({ length: CONC }, worker))
console.log(`\nchecked=${keys.length}  CON PROBLEMAS=${bad.length}`)
for (const b of bad.slice(0, 20)) console.log(' -', b.title, '|', b.status, b.ct, '|', b.img)
process.exit(0)
