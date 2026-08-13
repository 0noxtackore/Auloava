// ============================================================
// AULOAVA · Autenticación de administrador (Firebase Auth)
// Login Email/Password para proteger el panel privado (/app).
// ============================================================
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { auth } from './firebase'

export { auth }

/**
 * Promesa que resuelve cuando Firebase restaura (o descarta) la sesión
 * guardada. Se usa en el router para esperar antes de decidir el acceso.
 */
export const authReady = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe()
    resolve(user)
  })
})

/** Inicia sesión con email y contraseña.
 *  @param {boolean} remember  true = sesión persistente (local), false = solo esta pestaña */
export async function login(email, password, remember = true) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

/** Cierra la sesión del administrador */
export async function logout() {
  await signOut(auth)
}

/** Registra un nuevo usuario con email y contraseña */
export async function register(email, password) {
  await setPersistence(auth, browserLocalPersistence)
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  return credential.user
}
