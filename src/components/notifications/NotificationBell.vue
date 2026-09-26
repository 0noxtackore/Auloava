<script setup>
// ============================================================
// NotificationBell · Campana + bandeja de notificaciones
// Solo para usuarios logueados. Muestra el badge de no leídos,
// lista clicable y navega al catálogo (categoría o búsqueda).
// ============================================================
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useInboxStore } from '@/store/inbox'
import { catalogPath } from '@/utils/routes'

const props = defineProps({
  uid: { type: String, default: '' },
})

const router = useRouter()
const inbox = useInboxStore()

const show = ref(false)
const bellRef = ref(null)

// Enlaza/desenlaza la bandeja cuando cambia el usuario
watch(
  () => props.uid,
  (uid) => {
    if (uid) inbox.bind(uid)
    else inbox.unbind()
  },
  { immediate: true }
)

onBeforeUnmount(() => inbox.unbind())

function toggle() {
  show.value = !show.value
  if (show.value && inbox.hasUnread) inbox.markAllRead()
}

function handleClickOutside(e) {
  if (bellRef.value && !bellRef.value.contains(e.target)) {
    show.value = false
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

function open(n) {
  show.value = false
  inbox.markRead(n.id)
  const query = {}
  if (n.productId) {
    query.product = n.productId
  } else if (n.action === 'catalog-category' && n.category) {
    query.category = n.category
  } else {
    query.q = n.productTitle || n.title || ''
  }
  router.push({ path: catalogPath(props.uid), query })
}

function removeItem(e, n) {
  e.stopPropagation()
  inbox.remove(n.id)
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `Hace ${diffD}d`
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function formatPrice(p) {
  const n = Number(p)
  if (!Number.isFinite(n) || n <= 0) return ''
  return `$${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
</script>

<template>
  <div ref="bellRef" class="bell" :class="{ 'bell--open': show }">
    <button
      class="bell__button"
      type="button"
      :aria-label="`Notificaciones${inbox.unreadCount ? ` (${inbox.unreadCount} sin leer)` : ''}`"
      @click.stop="toggle"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      <span v-if="inbox.unreadCount" class="bell__badge">{{ inbox.unreadCount > 9 ? '9+' : inbox.unreadCount }}</span>
    </button>

    <Transition name="bell-drop">
      <div v-if="show" class="bell__tray" role="dialog" aria-label="Bandeja de notificaciones">
        <div class="bell__tray-header">
          <span class="bell__tray-title">Notificaciones</span>
          <div class="bell__tray-actions">
            <button
              v-if="inbox.items.length"
              class="bell__tray-link"
              type="button"
              @click="inbox.markAllRead()"
            >
              Marcar todas
            </button>
            <span v-if="inbox.unreadCount" class="bell__tray-unread">{{ inbox.unreadCount }} nuevas</span>
          </div>
        </div>

        <ul v-if="inbox.items.length" class="bell__list">
          <li
            v-for="n in inbox.items"
            :key="n.id"
            class="bell__item"
            :class="{ 'bell__item--unread': !n.read }"
            role="button"
            tabindex="0"
            @click="open(n)"
            @keydown.enter="open(n)"
          >
            <span class="bell__item-dot" aria-hidden="true" />
            <span class="bell__item-icon" :class="`bell__item-icon--${n.type || 'info'}`" aria-hidden="true">
              <svg
                v-if="n.type === 'cheap-pick'"
                width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <svg
                v-else-if="n.type === 'new-product'"
                width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              >
                <path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z" />
              </svg>
              <svg
                v-else
                width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4m0-4h.01" />
              </svg>
            </span>

            <span class="bell__item-body">
              <span class="bell__item-title">{{ n.title }}</span>
              <span class="bell__item-msg">{{ n.message }}</span>
              <span class="bell__item-meta">
                <span class="bell__item-time">{{ formatTime(n.createdAt) }}</span>
                <span v-if="formatPrice(n.price)" class="bell__item-price">{{ formatPrice(n.price) }}</span>
              </span>
            </span>

            <button class="bell__item-remove" type="button" aria-label="Eliminar" @click="removeItem($event, n)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m18 6-12 12m0-12 12 12" /></svg>
            </button>
          </li>
        </ul>

        <div v-else class="bell__tray-empty">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <p>Sin notificaciones por ahora</p>
          <span>Te avisaremos cuando llegue un producto nuevo o haya una oferta económica en tus nichos.</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.bell {
  position: relative;
  flex: 0 0 auto;
}

.bell__button {
  position: relative;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1.5px solid var(--green-200);
  background: var(--green-50);
  color: var(--green-700);
  cursor: pointer;
  transition: background var(--transition), transform var(--transition);
}
.bell__button:hover {
  background: var(--green-100);
  transform: translateY(-1px);
}
.bell--open .bell__button {
  background: var(--green-100);
}

.bell__badge {
  position: absolute;
  top: -3px;
  right: -3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--danger);
  border: 2px solid var(--white);
  color: var(--white);
  font-size: 0.64rem;
  font-weight: 800;
  line-height: 1;
}

/* ---- Bandeja ---- */
.bell__tray {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 360px;
  max-height: 440px;
  display: flex;
  flex-direction: column;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.16);
  overflow: hidden;
  z-index: 900;
}

.bell__tray-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
  background: var(--green-50);
}
.bell__tray-title {
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--green-900);
}
.bell__tray-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bell__tray-unread {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--danger);
  background: var(--white);
  border: 1px solid var(--line);
  padding: 3px 8px;
  border-radius: var(--radius-full);
}
.bell__tray-link {
  border: none;
  background: transparent;
  color: var(--green-600);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background var(--transition);
}
.bell__tray-link:hover {
  background: var(--green-100);
}

/* ---- Lista ---- */
.bell__list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  max-height: 360px;
}

.bell__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background var(--transition);
}
.bell__item:last-child {
  border-bottom: none;
}
.bell__item:hover {
  background: var(--green-50);
}

.bell__item-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 15px;
  border-radius: 50%;
  background: transparent;
}
.bell__item--unread .bell__item-dot {
  background: var(--green-500);
}

.bell__item-icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-top: 3px;
}
.bell__item-icon--cheap-pick {
  background: #dcfce7;
  color: #16a34a;
}
.bell__item-icon--new-product {
  background: #e0e7ff;
  color: #4f46e5;
}
.bell__item-icon--info {
  background: var(--green-100);
  color: var(--green-600);
}

.bell__item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bell__item-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--green-900);
}
.bell__item-msg {
  font-size: 0.8rem;
  color: var(--ink);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.bell__item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bell__item-time {
  font-size: 0.7rem;
  color: var(--muted);
}
.bell__item-price {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--green-700);
  background: var(--green-50);
  border-radius: var(--radius-full);
  padding: 2px 8px;
}

.bell__item-remove {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}
.bell__item-remove:hover {
  background: var(--danger);
  color: var(--white);
}

/* ---- Vacío ---- */
.bell__tray-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 36px 24px;
  text-align: center;
  color: var(--muted);
}
.bell__tray-empty p {
  margin: 0;
  font-weight: 600;
  color: var(--green-900);
  font-size: 0.9rem;
}
.bell__tray-empty span {
  font-size: 0.78rem;
  line-height: 1.4;
  max-width: 260px;
}

/* ---- Transición ---- */
.bell-drop-enter-active,
.bell-drop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.bell-drop-enter-from,
.bell-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ---- Móvil: bandeja a ancho completo ---- */
@media (max-width: 560px) {
  .bell__tray {
    position: fixed;
    top: 70px;
    left: 12px;
    right: 12px;
    width: auto;
    max-height: min(70vh, 440px);
  }
}
</style>