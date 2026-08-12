// ============================================================
// AULOAVA · Validadores de formularios
// Cada validador devuelve true si el valor es válido o un
// string con el mensaje de error.
// ============================================================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/

export const validators = {
  /** Campo obligatorio */
  required: (value) => {
    if (value === null || value === undefined || String(value).trim() === '') {
      return 'Este campo es obligatorio'
    }
    return true
  },

  /** Email con formato válido */
  email: (value) => {
    if (!value) return true
    return EMAIL_RE.test(String(value).trim())
      ? true
      : 'Ingresa un correo electrónico válido'
  },

  /** Longitud mínima */
  minLength: (value, length) =>
    String(value ?? '').trim().length >= length ||
    `Debe tener al menos ${length} caracteres`,

  /** Longitud máxima */
  maxLength: (value, length) =>
    String(value ?? '').trim().length <= length ||
    `No debe exceder ${length} caracteres`,

  /** Número dentro de un rango */
  between: (value, min, max) => {
    const n = Number(value)
    if (value === '' || value === null || Number.isNaN(n)) return true
    return n >= min && n <= max ? true : `Debe estar entre ${min} y ${max}`
  },

  /** Precio: número mayor o igual a 0 */
  positive: (value) => {
    const n = Number(value)
    if (value === '' || value === null || Number.isNaN(n)) return true
    return n >= 0 ? true : 'Debe ser un número mayor o igual a 0'
  },

  /** URL de imagen opcional con formato válido */
  url: (value) => {
    if (!value) return true
    return URL_RE.test(String(value).trim())
      ? true
      : 'Ingresa una URL válida (p. ej. https://...)'
  },

  /** Contraseña con requisitos mínimos */
  password: (value) => {
    const errors = []
    if (String(value ?? '').length < 8) errors.push('mínimo 8 caracteres')
    if (!/[A-Z]/.test(value)) errors.push('una mayúscula')
    if (!/[0-9]/.test(value)) errors.push('un número')
    return errors.length === 0 ? true : `Debe incluir: ${errors.join(', ')}`
  },

  /** Confirmación de contraseña */
  match: (value, other) =>
    value === other ? true : 'Las contraseñas no coinciden',
}

/** Ejecuta una lista de reglas y devuelve el primer error */
export function validate(rules) {
  for (const rule of rules) {
    const result = rule.fn(rule.value, rule.arg)
    if (result !== true) return result
  }
  return null
}
