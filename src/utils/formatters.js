// ============================================================
// AULOAVA · Formateadores de salida
// ============================================================

/** Formatea un número como moneda (USD por defecto) */
export function formatPrice(value, currency = 'USD', locale = 'es-ES') {
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n)
}

/** Formatea una fecha ISO a formato legible */
export function formatDate(value, locale = 'es-ES') {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** Formatea un número con separadores de miles */
export function formatNumber(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '0'
  return new Intl.NumberFormat('es-ES').format(n)
}

/** Formatea un porcentaje */
export function formatPercent(value, digits = 1) {
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return `${n.toFixed(digits)}%`
}

/** Redondea y formatea una calificación de 0 a 5 */
export function formatRating(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return n.toFixed(1)
}

/** Abrevia números grandes (1200 -> 1.2k) */
export function formatCompact(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '0'
  return Intl.NumberFormat('en', { notation: 'compact' }).format(n)
}
