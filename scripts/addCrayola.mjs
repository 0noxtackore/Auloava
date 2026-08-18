// ============================================================
// AULOAVA · Script puntual: añade el producto Crayola a Firebase
// Uso:
//   1) Guarda tu service account JSON como scripts/serviceAccount.json
//      (o exporta la env FIREBASE_SERVICE_ACCOUNT="<json>")
//   2) node scripts/addCrayola.mjs
// No es parte del build; bórralo cuando termines.
// ============================================================
import admin from 'firebase-admin'
import { readFileSync } from 'node:fs'

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))

const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  'https://auloava-default-rtdb.europe-west1.firebasedatabase.app'

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL })
const db = admin.database()

const now = new Date().toISOString()
const product = {
  title:
    'Crayola - Lápices de colores (36 unidades), suministros escolares para profesores para niños y adultos, artículos imprescindibles para el aula preescolar, regalo para colorear, a partir de 3 años',
  description:
    '36 lápices de colores CRAYOLA: Explora un espectro de colores con 36 lápices de colores distintos que transforman las obras de arte en obras maestras vibrantes. Suministros de arte para niños: enciende el potencial artístico de tu hijo con este vibrante juego de lápices de colores Crayola Perfecto para fomentar la creatividad y la autoexpresión. Suministros para el regreso a la escuela: mejora las actividades educativas y creativas con estos lápices esenciales para niños para la escuela. Ideal para colorear libros: diseñados para deslizarse suavemente por la página, estos lápices dan vida a los libros para colorear. Suministros para aulas: Abastécete de lápices de colores a granel para actividades en el aula, mejorando proyectos grupales y haciendo que el aprendizaje sea más colorido y divertido. Preafilado y duradero: los núcleos suaves no se rompen fácilmente, y las puntas preafiladas están listas para usar nada más sacarlas de la caja. Regalo para niños y adultos: un regalo divertido y colorido para nietos, niños, adolescentes y adultos, perfecto para cumpleaños, pasatiempos creativos o cualquier momento que quieras alegrar el día de alguien.\nValoración: 4.8 de 5 · 50119 reseñas\nForma del instrumento de escritura: Lápiz de colores · Color de la tinta: Multicolor · Tipo de punta: Fina · Características especiales: No tóxico · Tamaño de línea: 3.30 Pencil · Orientación de la manecilla: Derecha · Tipo de agarre: Liso · Dureza del lápiz: HB · Técnica de escritura: Lápiz plomo',
  platform: 'amazon',
  category: 'Papelería',
  image: 'https://m.media-amazon.com/images/I/71jm7Hf54-L._AC_SX679_.jpg',
  price: 6.49,
  originalPrice: 7.99,
  commission: 10,
  rating: 4.8,
  affiliateUrl:
    'https://www.amazon.com/-/es/Crayola-suministros-profesores-imprescindibles-preescolar/dp/B00006RVTS/?tag=auloava-20',
  url: 'https://www.amazon.com/-/es/Crayola-suministros-profesores-imprescindibles-preescolar/dp/B00006RVTS/',
  clicks: 0,
  createdAt: now,
  updatedAt: now,
}

const ref = db.ref('products').push()
await ref.set(product)
console.log('✔ Producto Crayola añadido a Firebase con id:', ref.key)
process.exit(0)
