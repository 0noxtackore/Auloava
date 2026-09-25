// ============================================================
// Rutas con el segmento aleatorio del usuario (/catalog/{uid}).
// Firebase genera un UID con letras y números, perfecto para
// ocultar la sección tras el identificador único del logueado.
// ============================================================

export function catalogPath(uid) {
  return uid ? `/catalog/${encodeURIComponent(uid)}` : '/catalog'
}

export function profilePath(uid) {
  return uid ? `/profile/${encodeURIComponent(uid)}` : '/profile'
}