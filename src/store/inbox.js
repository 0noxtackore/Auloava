// ============================================================
// AULOAVA · Bandeja de notificaciones del usuario (Pinia)
// Enlazada a un uid. En producción consulta al agente (polling
// cada ~25s + al volver a la pestaña); en dev usa el mock local.
// ============================================================
import { defineStore } from 'pinia'
import { notificationsService } from '@/services/notifications'

const POLL_MS = 25000

export const useInboxStore = defineStore('inbox', {
  state: () => ({
    uid: null,
    items: [],
    loaded: false,
    loading: false,
    timer: null,
  }),

  getters: {
    unreadCount: (s) => s.items.filter((i) => !i.read).length,
    hasUnread: (s) => s.items.some((i) => !i.read),
  },

  actions: {
    bind(uid) {
      if (!uid) return
      if (this.uid !== uid) {
        this.stopPolling()
        this.uid = uid
        this.items = []
        this.loaded = false
        this.refresh()
      }
      this.startPolling()
    },

    unbind() {
      this.stopPolling()
      this.uid = null
      this.items = []
      this.loaded = false
    },

    startPolling() {
      this.stopPolling()
      this.timer = setInterval(() => this.refresh(), POLL_MS)
      document.addEventListener('visibilitychange', this.onVisibility)
    },

    stopPolling() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
      document.removeEventListener('visibilitychange', this.onVisibility)
    },

    onVisibility() {
      if (document.visibilityState === 'visible' && this.uid) this.refresh()
    },

    async refresh() {
      if (!this.uid || this.loading) return
      this.loading = true
      try {
        this.items = await notificationsService.list(this.uid)
        this.loaded = true
      } catch (e) {
        console.warn('[inbox] no se pudieron cargar notificaciones:', e.message)
      } finally {
        this.loading = false
      }
    },

    async markRead(id) {
      const item = this.items.find((i) => i.id === id)
      if (item) item.read = true
      if (this.uid) {
        try {
          await notificationsService.markRead(this.uid, id)
        } catch {
          /* se reintenta al siguiente poll */
        }
      }
    },

    async markAllRead() {
      this.items.forEach((i) => {
        i.read = true
      })
      if (this.uid) {
        try {
          await notificationsService.markAllRead(this.uid)
        } catch {
          /* se reintenta al siguiente poll */
        }
      }
    },

    remove(id) {
      this.items = this.items.filter((i) => i.id !== id)
      if (this.uid) {
        notificationsService.remove(this.uid, id).catch(() => {})
      }
    },
  },
})