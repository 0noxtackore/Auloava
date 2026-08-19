// ============================================================
// AULOAVA · Utilidades de enlaces de afiliado
// ============================================================

/**
 * Normaliza una URL de afiliado de Amazon a su forma canónica
 * `https://www.amazon.com/dp/<ASIN>?tag=<tag>`, extrayendo el ASIN
 * y descartando los parámetros `ref=`, slugs de locale y session-ids
 * que arrastran las URLs originales y provocan la página interstitial
 * "Continue shopping" de Amazon en vez del producto.
 *
 * Para otras plataformas devuelve la URL sin cambios.
 *
 * @param {string} url  URL de afiliado original
 * @param {string} tag  Partner tag (por defecto auloava-20)
 */
export function cleanAffiliateUrl(url, tag = 'auloava-20') {
  if (!url || typeof url !== 'string') return url
  const m = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)
  if (m) {
    const asin = m[1].toUpperCase()
    const tagMatch = url.match(/[?&]tag=([^&]+)/i)
    const finalTag = tagMatch ? tagMatch[1] : tag
    return `https://www.amazon.com/dp/${asin}?tag=${finalTag}`
  }
  return url
}
