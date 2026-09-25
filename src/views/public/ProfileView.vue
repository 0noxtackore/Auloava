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
import ProductCard from '@/components/product/ProductCard.vue'
import PublicHeader from '@/components/layout/PublicHeader.vue'

const router = useRouter()
const user = ref(null)
const memberSince = ref('')
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

const initial = () => {
  const u = user.value
  if (!u) return ''
  if (u.displayName) return u.displayName.trim().charAt(0).toUpperCase()
  return ((u.email || '?').trim().charAt(0) || '?').toUpperCase()
}
</script>

<template>
  <div class="profile-page">
    <PublicHeader />

    <main class="container profile-main">
      <div v-if="user" class="profile-card">
        <span class="profile-card__avatar">{{ initial() }}</span>
        <div class="profile-card__info">
          <h1 class="profile-card__name">{{ user.email || 'Mi cuenta' }}</h1>
          <p class="profile-card__meta">
            <span class="profile-card__email">{{ user.email }}</span>
            <span v-if="memberSince" class="profile-card__since">
              Miembro desde {{ memberSince }}
            </span>
          </p>
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