// ============================================================
// AULOAVA · Utilidades de imagen
// Optimización de URLs de imagen sin reconvertir el formato
// (respetando los términos de Amazon Associates).
// ============================================================

/**
 * Reescala una imagen de Amazon a un ancho menor usando su propio
 * parámetro de tamaño (`_AC_SX<ancho>_`). No cambia el formato ni
 * re-hospeda la imagen: sólo pide un tamaño más pequeño al CDN de
 * Amazon, lo que reduce drásticamente los bytes transferidos.
 *
 * Para otras plataformas (AliExpress, Alibaba) devuelve la URL tal cual.
 *
 * @param {string} url  URL original de la imagen
 * @param {number} width  Ancho deseado en px (por defecto 320)
 */
export function optimizeProductImage(url, width = 320) {
  if (!url || typeof url !== 'string') return url
  const m = url.match(/^(https?:\/\/[\w.-]*amazon\.com\/images\/I\/.+?)_AC_SX\d+_(\.[A-Za-z0-9]+)$/i)
  if (m) return `${m[1]}_AC_SX${width}_${m[2]}`
  return url
}
