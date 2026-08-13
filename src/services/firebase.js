// ============================================================
// AULOAVA · Configuración de Firebase
// Inicializa Firebase como backend (Realtime Database + Analytics).
// La configuración web de Firebase es PÚBLICA y puede exponerse
// en el cliente; la seguridad la dan las reglas de Realtime DB.
// ============================================================
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'

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

export const app = initializeApp(firebaseConfig)

// Realtime Database: base de datos del catálogo de productos
export const db = getDatabase(app)

// Authentication: sesión del administrador (Email/Password)
export const auth = getAuth(app)

// Analytics solo en el navegador (no en build/SSR)
export const analytics =
  typeof window !== 'undefined' ? getAnalytics(app) : null
