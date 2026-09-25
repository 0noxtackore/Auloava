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
import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import ProductCard from '@/components/product/ProductCard.vue'
import PublicHeader from '@/components/layout/PublicHeader.vue'

const router = useRouter()
const user = ref(null)
const memberSince = ref('')
const nameInput = ref('')
const savingName = ref(false)
const nameError = ref('')
const nameSaved = ref(false)
const editingName = ref(false)
const avatarInput = ref(null)
const uploadingPhoto = ref(false)
const photoError = ref('')
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
  if (!u || savingName.value) return
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
    editingName.value = false
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

function startEdit() {
  const u = auth.currentUser
  if (!u || savingName.value) return
  nameInput.value = u.displayName || ''
  nameError.value = ''
  editingName.value = true
}

function cancelEdit() {
  const u = auth.currentUser
  if (!u || savingName.value) return
  nameInput.value = u.displayName || ''
  nameError.value = ''
  editingName.value = false
}

const photoURL = () => user.value?.photoURL || ''

function triggerPhotoPicker() {
  avatarInput.value?.click()
}

async function onPhotoPicked(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  photoError.value = ''
  const ok = ['image/jpeg', 'image/png', 'image/webp']
  if (!ok.includes(file.type)) {
    photoError.value = 'Usa una imagen JPG, PNG o WebP.'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    photoError.value = 'La imagen es demasiado grande (máximo 2 MB).'
    return
  }
  const u = auth.currentUser
  if (!u) return
  uploadingPhoto.value = true
  try {
    const prev = u.photoURL || ''
    if (prev.includes('firebasestorage.googleapis.com')) {
      try {
        const oldRef = sRef(getStorage(), prev)
        await deleteObject(oldRef)
      } catch {
        /* fotos previas: borrado no crítico */
      }
    }
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
    const name = `avatar-${Date.now()}.${ext}`
    const fileRef = sRef(getStorage(), `profile-photos/${u.uid}/${name}`)
    await uploadBytes(fileRef, file)
    const url = await getDownloadURL(fileRef)
    await updateProfile(u, { photoURL: url })
    user.value = auth.currentUser
  } catch {
    photoError.value = 'No se pudo subir la foto. Revisa las reglas de Firebase Storage.'
  } finally {
    uploadingPhoto.value = false
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
        <div
          class="profile-card__avatar-wrap"
          role="button"
          tabindex="0"
          title="Cambiar foto de perfil"
          @click="triggerPhotoPicker"
          @keyup.enter="triggerPhotoPicker"
        >
          <img
            v-if="photoURL()"
            class="profile-card__avatar-img"
            :src="photoURL()"
            alt="Foto de perfil"
          />
          <span v-else class="profile-card__avatar">{{ initial() }}</span>
          <span class="profile-card__avatar-cam">📷</span>
        </div>
        <input
          ref="avatarInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          @change="onPhotoPicked"
        />

        <div class="profile-card__info">
          <h1
            v-if="!editingName"
            class="profile-card__name"
            role="button"
            tabindex="0"
            :title="'Clic para editar tu nombre'"
            @click="startEdit"
            @keyup.enter="startEdit"
          >
            {{ displayName() || user.email || 'Mi cuenta' }}
            <span class="profile-card__name-pencil" aria-hidden="true">✎</span>
          </h1>
          <input
            v-else
            v-model="nameInput"
            class="profile-card__name-input"
            type="text"
            maxlength="30"
            :aria-label="'Nombre de usuario'"
            @keyup.enter="saveName"
            @keyup.esc="cancelEdit"
            @blur="saveName"
          />
          <p class="profile-card__meta">
            <span class="profile-card__email">{{ user.email }}</span>
            <span v-if="memberSince" class="profile-card__since">
              Miembro desde {{ memberSince }}
            </span>
          </p>
          <span v-if="nameSaved" class="profile-card__name-ok">✓ Nombre guardado</span>
          <p v-if="nameError" class="profile-card__name-error">{{ nameError }}</p>
          <p v-if="editingName" class="profile-card__name-hint">
            Enter para guardar · Esc para cancelar
          </p>
          <p v-if="uploadingPhoto" class="profile-card__name-hint">Subiendo foto…</p>
          <p v-if="photoError" class="profile-card__name-error">{{ photoError }}</p>
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
.profile-card__avatar-wrap {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 50%;
}
.profile-card__avatar,
.profile-card__avatar-img {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: var(--white);
  font-size: 1.6rem;
  font-weight: 700;
  overflow: hidden;
  object-fit: cover;
}
.profile-card__avatar-cam {
  position: absolute;
  right: -2px;
  bottom: -2px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--white);
  box-shadow: var(--shadow-sm);
  border: 1.5px solid var(--green-500);
  font-size: 0.8rem;
}
.profile-card__avatar-wrap:hover .profile-card__avatar,
.profile-card__avatar-wrap:hover .profile-card__avatar-img {
  filter: brightness(0.92);
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

.profile-card__name {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.profile-card__name-pencil {
  font-size: 0.85rem;
  color: var(--green-600);
  opacity: 0;
  transition: opacity var(--transition);
}
.profile-card__name:hover .profile-card__name-pencil {
  opacity: 1;
}
.profile-card__name-input {
  display: block;
  width: 100%;
  max-width: 340px;
  padding: 6px 10px;
  font-family: var(--font-display);
  font-size: 1.3rem;
  letter-spacing: -0.02em;
  color: var(--ink);
  border: 2px solid var(--green-500);
  border-radius: 10px;
  background: var(--white);
  transition: border-color var(--transition);
}
.profile-card__name-input:focus {
  outline: none;
  border-color: var(--green-600);
}
.profile-card__name-ok {
  display: inline-block;
  margin-top: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--green-600);
}
.profile-card__name-error {
  margin: 8px 0 0;
  font-size: 0.82rem;
  color: var(--danger);
}
.profile-card__name-hint {
  margin: 8px 0 0;
  font-size: 0.78rem;
  color: var(--muted);
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
  .profile-card__avatar,
  .profile-card__avatar-img {
    width: 52px;
    height: 52px;
    font-size: 1.3rem;
  }
}
</style>