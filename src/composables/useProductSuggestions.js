// ============================================================
// useProductSuggestions · Sugerencias de productos en vivo
// para los buscadores (estilo Google: debajo del input aparecen
// coincidencias de título/categoría mientras escribes).
// ============================================================
import { computed } from 'vue'
import { useProductStore } from '@/store/products'

export function useProductSuggestions(queryRef, limit = 6) {
  const store = useProductStore()

  const suggestions = computed(() => {
    const q = (queryRef.value || '').trim().toLowerCase()
    if (!q) return []
    const products = store.products
    const out = []
    for (const p of products) {
      const title = (p.title || '').toLowerCase()
      const cat = (p.category || '').toLowerCase()
      if (title.includes(q) || cat.includes(q)) out.push(p)
      if (out.length >= limit) break
    }
    return out
  })

  return { suggestions }
}
