<script setup>
// ============================================================
// ProfileView · Perfil del usuario (/profile)
// Datos de la cuenta en modo lectura y los productos que el
// usuario guardó para comprarlos directo en las tiendas.
// ============================================================
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, authReady } from '@/services/auth'
import { useSavedProducts } from '@/composables/useSavedProducts'
import { profileService } from '@/services/profile'
import { updateProfile } from 'firebase/auth'
import ProductCard from '@/components/product/ProductCard.vue'
import PublicHeader from '@/components/layout/PublicHeader.vue'

const router = useRouter()
const user = ref(null)
const memberSince = ref('')
const nameInput = ref('')
const savingName = ref(false)
const nameError = ref('')
const nameSaved = ref(false)
const { savedList, load: loadSaved } = useSavedProducts()

function goCatalog() {
  router.push({ name: 'catalog' })
}

onMounted(async () => {
  await authReady
  const u = auth.currentUser
  if (!u) {
    router.replace({ name: 'public-login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  user.value = u
  nameInput.value = u.displayName || ''
  const created = u.metadata?.creationTime
  if (created) {
    memberSince.value = new Date(created).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } else {
    try {
      const profile = await profileService.get(u.uid)
      if (profile?.createdAt) {
        memberSince.value = new Date(profile.createdAt).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      }
    } catch {
      /* sin fecha de alta */
    }
  }
  loadSaved()
})

async function saveName() {
  const u = auth.currentUser
  if (!u) return
  nameError.value = ''
  nameSaved.value = false
  const v = nameInput.value.trim()
  if (!v) {
    nameError.value = 'Escribe un nombre de usuario.'
    return
  }
  if (v.length > 30) {
    nameError.value = 'Máximo 30 caracteres.'
    return
  }
  savingName.value = true
  try {
    await updateProfile(u, { displayName: v })
    user.value = auth.currentUser
    nameSaved.value = true
    setTimeout(() => {
      nameSaved.value = false
    }, 2000)
  } catch {
    nameError.value = 'No se pudo guardar tu nombre. Inténtalo de nuevo.'
  } finally {
    savingName.value = false
  }
}

const initial = () => {
  const u = user.value
  if (!u) return ''
  if (u.displayName) return u.displayName.trim().charAt(0).toUpperCase()
  return ((u.email || '?').trim().charAt(0) || '?').toUpperCase()
}

const displayName = () => user.value?.displayName?.trim() || ''
</script>

<template>
  <div class="profile-page">
    <PublicHeader />

    <main class="container profile-main">
      <div v-if="user" class="profile-card">
        <span class="profile-card__avatar">{{ initial() }}</span>
        <div class="profile-card__info">
          <h1 class="profile-card__name">
            {{ displayName() || user.email || 'Mi cuenta' }}
          </h1>
          <p class="profile-card__meta">
            <span class="profile-card__email">{{ user.email }}</span>
            <span v-if="memberSince" class="profile-card__since">
              Miembro desde {{ memberSince }}
            </span>
          </p>

          <form class="profile-card__nameform" @submit.prevent="saveName">
            <input
              v-model="nameInput"
              type="text"
              maxlength="30"
              placeholder="Tu nombre de usuario…"
              aria-label="Nombre de usuario"
              class="profile-card__name-input"
            />
            <button
              type="submit"
              class="profile-card__name-btn"
              :disabled="savingName"
            >
              {{ savingName ? 'Guardando…' : 'Guardar nombre' }}
            </button>
            <span v-if="nameSaved" class="profile-card__name-ok">✓ Guardado</span>
          </form>
          <p v-if="nameError" class="profile-card__name-error">{{ nameError }}</p>
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section__head">
          <h2 class="profile-section__title">Mis hallazgos guardados</h2>
          <p class="profile-section__lead">
            Productos que marcaste para comprarlos directo en Amazon, AliExpress
            o Alibaba. Clic en la imagen para ir a la tienda.
          </p>
        </div>

        <div v-if="savedList.length" class="pin-grid">
          <ProductCard v-for="product in savedList" :key="product.id" :product="product" />
        </div>
        <div v-else class="profile-empty">
          <p class="profile-empty__text">
            Aún no has guardado hallazgos. Explora el catálogo y pulsa
            <strong>Guardar</strong> en los que te enamoren.
          </p>
          <button type="button" class="profile-empty__btn" @click="goCatalog">
            Explorar el catálogo
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--white);
}

.profile-main {
  padding: 48px 0 90px;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--off-white);
  margin-bottom: 44px;
}
.profile-card__avatar {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: var(--white);
  font-size: 1.6rem;
  font-weight: 700;
  flex-shrink: 0;
}
.profile-card__info {
  min-width: 0;
}
.profile-card__name {
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: var(--ink);
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin: 0;
}
.profile-card__email {
  font-size: 0.92rem;
  color: var(--muted);
}
.profile-card__since {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--green-700);
  background: var(--green-100);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.profile-card__nameform {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
.profile-card__name-input {
  width: min(240px, 100%);
  padding: 9px 14px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-full);
  font-size: 0.9rem;
  background: var(--white);
  transition: border-color var(--transition);
}
.profile-card__name-input:focus {
  outline: none;
  border-color: var(--green-500);
}
.profile-card__name-btn {
  padding: 9px 16px;
  border: none;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: var(--white);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition);
}
.profile-card__name-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.profile-card__name-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.profile-card__name-ok {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--green-600);
}
.profile-card__name-error {
  margin: 8px 0 0;
  font-size: 0.82rem;
  color: var(--danger);
}

.profile-section__head {
  text-align: center;
  margin-bottom: 36px;
}
.profile-section__title {
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2.6vw, 1.9rem);
  letter-spacing: -0.02em;
  color: var(--ink);
  margin: 0 0 8px;
}
.profile-section__lead {
  color: var(--muted);
  font-size: 0.95rem;
  max-width: 480px;
  margin: 0 auto;
}

.profile-empty {
  text-align: center;
  padding: 70px 20px;
}
.profile-empty__text {
  color: var(--muted);
  font-size: 1rem;
  max-width: 420px;
  margin: 0 auto 24px;
  line-height: 1.6;
}
.profile-empty__btn {
  padding: 12px 26px;
  border: none;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: var(--white);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition);
}
.profile-empty__btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

@media (max-width: 560px) {
  .profile-main {
    padding: 32px 0 56px;
  }
  .profile-card {
    padding: 16px;
    gap: 14px;
  }
  .profile-card__avatar {
    width: 52px;
    height: 52px;
    font-size: 1.3rem;
  }
}
</style>