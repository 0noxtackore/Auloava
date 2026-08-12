// ============================================================
// AULOAVA · Utilidades de almacenamiento local (localStorage)
// Manejo seguro con try/catch y serialización JSON.
// ============================================================

const PREFIX = 'auloava:'

export const storage = {
  /** Guarda un valor serializado en localStorage */
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // Almacenamiento no disponible: ignorar silenciosamente
    }
  },

  /** Lee y deserializa un valor; devuelve defaultValue si no existe */
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw === null ? defaultValue : JSON.parse(raw)
    } catch {
      return defaultValue
    }
  },

  /** Elimina una clave de localStorage */
  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key)
    } catch {
      // Ignorar
    }
  },

  /** Elimina todas las claves de la aplicación */
  clear() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k))
    } catch {
      // Ignorar
    }
  },
}
