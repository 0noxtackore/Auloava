// ============================================================
// AULOAVA · Crea el usuario administrador en Firebase Auth
// Uso: node scripts/createAdmin.mjs
// Requisito: habilitar "Email/Password" en
// Firebase Console > Authentication > Sign-in method.
// ============================================================
import { initializeApp } from 'firebase/app'
import { initializeAuth, createUserWithEmailAndPassword, inMemoryPersistence } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyA7KLOOq17gxZoTt77VScDO9YHw3SCVqxc',
  authDomain: 'auloava.firebaseapp.com',
  databaseURL: 'https://auloava-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'auloava',
  storageBucket: 'auloava.firebasestorage.app',
  messagingSenderId: '299081428575',
  appId: '1:299081428575:web:a39ab654f96f794f9ef5ea',
  measurementId: 'G-BTCLNF9YS7',
}

export const ADMIN_EMAIL = 'admin@auloava.com'
export const ADMIN_PASSWORD = 'AuloavaAdmin2026!'

const app = initializeApp(firebaseConfig)
const auth = initializeAuth(app, { persistence: inMemoryPersistence })

try {
  const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
  console.log(`Admin creado: ${userCredential.user.email}`)
} catch (error) {
  // auth/email-already-in-use -> ya existe, no es error grave
  if (error?.code === 'auth/email-already-in-use') {
    console.log('El administrador ya existe. Nada que hacer.')
    process.exit(0)
  }
  console.error('No se pudo crear el admin:', error?.code || error?.message || error)
  process.exit(1)
}
