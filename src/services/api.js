// ============================================================
// AULOAVA · Servicio API (Axios)
// Instancia central de axios para el catálogo.
// ============================================================
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

/** Extrae el mensaje de error de una respuesta de axios */
export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Error inesperado'
}

export default api
