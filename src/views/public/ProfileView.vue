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
const photoSaved = ref(false)
const profilePhoto = ref('')
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
  loadSaved(true)
  try {
    const profile = await profileService.get(u.uid)
    if (profile?.photo) profilePhoto.value = profile.photo
  } catch {
    /* foto no disponible */
  }
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

const photoURL = () => user.value?.photoURL || profilePhoto.value || ''

function triggerPhotoPicker() {
  avatarInput.value?.click()
}

// Convierte la imagen a un data URL pequeño (link embebido) sin Firebase Storage
function fileToDataUrl(file, maxSize = 256, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    img.src = url
  })
}

async function onPhotoPicked(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  photoError.value = ''
  photoSaved.value = false
  const ok = ['image/jpeg', 'image/png', 'image/webp']
  if (!ok.includes(file.type)) {
    photoError.value = 'Usa una imagen JPG, PNG o WebP.'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    photoError.value = 'La imagen es demasiado grande (máximo 5 MB).'
    return
  }
  const u = auth.currentUser
  if (!u) return
  uploadingPhoto.value = true
  try {
    const dataUrl = await fileToDataUrl(file)
    await profileService.savePhoto(u.uid, dataUrl)
    profilePhoto.value = dataUrl
    photoSaved.value = true
    setTimeout(() => {
      photoSaved.value = false
    }, 2000)
  } catch (err) {
    photoError.value = err?.message || 'No se pudo guardar tu foto.'
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
    <div class="profile-topbar">
      <RouterLink class="profile-topbar__back" :to="{ name: 'catalog' }">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        Volver al catálogo
      </RouterLink>
    </div>

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
          <span class="profile-card__avatar-cam">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 8a2 2 0 0 1 2-2h1.5l1.6-1.9a1 1 0 0 1 .8-.36h5.2c.32 0 .61.14.8.36L16.5 6H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
              <circle cx="12" cy="13" r="3.4" />
            </svg>
          </span>
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
          <p v-if="uploadingPhoto" class="profile-card__name-hint">Procesando foto…</p>
          <span v-if="photoSaved" class="profile-card__name-ok">✓ Foto guardada</span>
          <p v-if="photoError" class="profile-card__name-error">{{ photoError }}</p>
        </div>
      </div>

      <div class="profile-section">
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

.profile-topbar {
  display: flex;
  align-items: center;
  padding: 18px max(20px, calc((100vw - 1200px) / 2));
}
.profile-topbar__back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1.5px solid var(--green-200);
  border-radius: var(--radius-full);
  background: var(--white);
  color: var(--green-700);
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: border-color var(--transition), background var(--transition),
    transform var(--transition);
}
.profile-topbar__back:hover {
  border-color: var(--green-500);
  background: var(--green-50);
  transform: translateX(-2px);
}
.profile-topbar__back svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
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
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--green-600);
  color: var(--white);
  box-shadow: var(--shadow-sm);
  border: 2px solid var(--white);
}
.profile-card__avatar-cam svg {
  width: 14px;
  height: 14px;
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

/* ---- Guardados: mismos cards que el catálogo (pin-grid) ---- */

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