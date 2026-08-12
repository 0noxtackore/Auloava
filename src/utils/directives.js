// ============================================================
// AULOAVA · Directivas personalizadas
// ============================================================

/**
 * v-reveal: anima el elemento cuando entra en el viewport.
 * Uso: v-reveal o v-reveal="200" (retraso en ms).
 */
export const reveal = {
  mounted(el, binding) {
    el.dataset.reveal = ''
    const delay = binding.value || 0
    if (delay) el.style.transitionDelay = `${delay}ms`

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.12 },
    )

    observer.observe(el)
  },
}
