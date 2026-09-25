// ============================================================
// useSavedProducts · Estado global de productos guardados.
// Compartido entre tarjetas, menubar y perfil. Carga la lista
// del usuario y permite guardar/quitar mientras navega.
// ============================================================
import { computed, ref } from 'vue'
import { auth, authReady } from '@/services/auth'
import { savedService } from '@/services/saved'

const savedMap = ref({}) // { [productId]: productSnapshot }
let loadedUid = null

async function load() {
  await authReady
  const user = auth.currentUser
  if (!user) {
    savedMap.value = {}
    loadedUid = null
    return
  }
  if (loadedUid === user.uid) return
  try {
    const list = await savedService.get(user.uid)
    const map = {}
    list.forEach((p) => {
      map[p.id] = p
    })
    savedMap.value = map
    loadedUid = user.uid
  } catch {
    savedMap.value = {}
  }
}

async function toggle(product) {
  await authReady
  const user = auth.currentUser
  if (!user || !product?.id) return null
  if (savedMap.value[product.id]) {
    await savedService.unsave(user.uid, product.id)
    const next = { ...savedMap.value }
    delete next[product.id]
    savedMap.value = next
    return false
  }
  await savedService.save(user.uid, product)
  savedMap.value = { ...savedMap.value, [product.id]: product }
  return true
}

const isSaved = (id) => Boolean(savedMap.value[id])
const savedList = computed(() => Object.values(savedMap.value))

export function useSavedProducts() {
  return { savedMap, savedList, load, toggle, isSaved }
}