// ============================================================
// AULOAVA · Ejecuta la generación de notificaciones ahora mismo
// Reutiliza la misma lógica del scheduler de Netlify
// (netlify/functions/notify-scheduler.mjs) contra Firebase RTDB.
// Uso:
//   node scripts/notify-now.mjs
// ============================================================
import { readFileSync } from 'node:fs'
import admin from 'firebase-admin'
import { getDatabase } from 'firebase-admin/database'
import { runNotifications } from '../netlify/functions/notify-scheduler.mjs'

const DATABASE_URL = 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app'

const sa = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL: DATABASE_URL })

const summary = await runNotifications(getDatabase())
console.log('== notify-now ==', JSON.stringify(summary))

// Fuerza salida limpia tras las promesas del admin
process.exit(0)