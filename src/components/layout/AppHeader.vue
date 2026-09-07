<script setup>
// ============================================================
// AppHeader · Barra superior del área principal
// Incluye: menú hamburguesa (móvil), búsqueda, notificaciones
// y enlace de vuelta a la página pública.
// ============================================================
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/store/notifications'

defineEmits(['toggle-sidebar'])

const router = useRouter()
const notifications = useNotificationStore()
const showNotifications = ref(false)
const bellRef = ref(null)

const unreadCount = computed(() => notifications.unreadCount)
const hasUnread = computed(() => unreadCount.value > 0)

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    notifications.markAllAsRead()
  }
}

function handleClickOutside(e) {
  if (bellRef.value && !bellRef.value.contains(e.target)) {
    showNotifications.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

async function onLogout() {
  const { logout } = await import('@/services/auth')
  await logout()
  router.push({ name: 'admin-login' })
}
</script>

<template>
  <header class="header">
    <div class="header__left">
      <button
        class="header__burger"
        aria-label="Abrir menú"
        @click="$emit('toggle-sidebar')"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
      </button>

      <div class="header__search">
        <svg class="header__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input type="search" placeholder="Buscar productos..." aria-label="Buscar" />
      </div>
    </div>

    <div class="header__right">
      <div class="header__bell-wrapper" ref="bellRef">
        <button
          class="header__bell"
          aria-label="Notificaciones"
          @click.stop="toggleNotifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
          <span v-if="hasUnread" class="header__dot" />
        </button>

        <Transition name="dropdown">
          <div v-if="showNotifications" class="header__dropdown">
            <div class="header__dropdown-header">
              <span>Notificaciones</span>
              <span v-if="unreadCount" class="header__dropdown-badge">{{ unreadCount }}</span>
            </div>
            <ul v-if="notifications.allItems.length" class="header__dropdown-list">
              <li
                v-for="n in notifications.allItems"
                :key="n.id"
                class="header__dropdown-item"
              >
                <div class="header__dropdown-icon" :class="`header__dropdown-icon--${n.type || 'info'}`">
                  <svg v-if="n.type === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5" /></svg>
                  <svg v-else-if="n.type === 'warning'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>
                  <svg v-else-if="n.type === 'error'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6m0-6 6 6" /></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
                </div>
                <div class="header__dropdown-content">
                  <p class="header__dropdown-text">{{ n.title || n.message }}</p>
                  <span class="header__dropdown-time">{{ formatTime(n.createdAt) }}</span>
                </div>
                <button class="header__dropdown-close" @click.stop="notifications.remove(n.id)" aria-label="Eliminar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 6-12 12m0-12 12 12" /></svg>
                </button>
              </li>
            </ul>
            <div v-else class="header__dropdown-empty">
              Sin notificaciones
            </div>
          </div>
        </Transition>
      </div>

      <button class="header__logout" type="button" @click="onLogout">
        Salir
      </button>

      <RouterLink :to="{ name: 'landing' }" class="header__home">
        Ver página
      </RouterLink>
    </div>
  </header>
</template>

<script>
function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `Hace ${diffD}d`
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 800;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: var(--header-height);
  padding: 0 32px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}

.header__left,
.header__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header__burger {
  display: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius);
  color: var(--green-700);
  transition: background var(--transition);
}
.header__burger:hover {
  background: var(--green-100);
}

.header__search {
  position: relative;
  display: flex;
  align-items: center;
}

.header__search-icon {
  position: absolute;
  left: 14px;
  color: var(--muted);
}

.header__search input {
  width: 260px;
  padding: 10px 16px 10px 42px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--off-white);
  font-size: 0.9rem;
  transition: border-color var(--transition), box-shadow var(--transition), width var(--transition);
}
.header__search input:focus {
  outline: none;
  border-color: var(--green-500);
  box-shadow: 0 0 0 4px var(--green-100);
  width: 320px;
  background: var(--white);
}

.header__bell-wrapper {
  position: relative;
}

.header__bell {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--green-700);
  background: var(--green-50);
  transition: background var(--transition);
}
.header__bell:hover {
  background: var(--green-100);
}

.header__dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger);
  animation: pulse-dot 2s infinite;
}

.header__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  max-height: 400px;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 900;
}

.header__dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--green-900);
}

.header__dropdown-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--danger);
  color: var(--white);
  font-size: 0.7rem;
  font-weight: 700;
}

.header__dropdown-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 340px;
  overflow-y: auto;
}

.header__dropdown-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  transition: background var(--transition);
}
.header__dropdown-item:last-child {
  border-bottom: none;
}
.header__dropdown-item:hover {
  background: var(--green-50);
}

.header__dropdown-icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  margin-top: 2px;
}
.header__dropdown-icon--success {
  background: #dcfce7;
  color: #16a34a;
}
.header__dropdown-icon--warning {
  background: #fef3c7;
  color: #d97706;
}
.header__dropdown-icon--error {
  background: #fee2e2;
  color: #dc2626;
}
.header__dropdown-icon--info {
  background: var(--green-100);
  color: var(--green-600);
}

.header__dropdown-content {
  flex: 1;
  min-width: 0;
}

.header__dropdown-text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--green-900);
  line-height: 1.3;
}

.header__dropdown-time {
  font-size: 0.72rem;
  color: var(--muted);
}

.header__dropdown-close {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: var(--muted);
  transition: background var(--transition), color var(--transition);
}
.header__dropdown-close:hover {
  background: var(--danger);
  color: var(--white);
}

.header__dropdown-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--muted);
  font-size: 0.85rem;
}

.header__home {
  padding: 10px 20px;
  border-radius: var(--radius-full);
  background: var(--green-600);
  color: var(--white);
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  transition: background var(--transition), transform var(--transition);
}
.header__home:hover {
  background: var(--green-700);
  transform: translateY(-1px);
}

.header__logout {
  padding: 10px 16px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--white);
  color: var(--green-900);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition), border-color var(--transition);
}
.header__logout:hover {
  background: var(--green-50);
  border-color: var(--green-500);
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 900px) {
  .header {
    padding: 0 20px;
  }
  .header__burger {
    display: grid;
  }
  .header__search {
    display: none;
  }
}
</style>
