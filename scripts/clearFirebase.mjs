import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./scripts/serviceAccount.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app/',
});

const db = admin.database();

console.log('Conectado a Firebase RTDB. Borrando /products...');
await db.ref('products').remove();
console.log('Borrado completo en /products.');

await admin.app().delete();
