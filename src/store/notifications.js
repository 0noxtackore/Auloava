import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    items: [],
    readIds: new Set(),
  }),

  getters: {
    unreadCount: (state) => state.items.filter((n) => !state.readIds.has(n.id)).length,

    unreadItems: (state) => state.items.filter((n) => !state.readIds.has(n.id)),

    allItems: (state) => state.items,
  },

  actions: {
    add(notification) {
      const id = notification.id || Date.now().toString()
      this.items.unshift({ ...notification, id, createdAt: notification.createdAt || new Date() })
    },

    markAsRead(id) {
      this.readIds.add(id)
    },

    markAllAsRead() {
      this.items.forEach((n) => this.readIds.add(n.id))
    },

    clear() {
      this.items = []
      this.readIds.clear()
    },

    remove(id) {
      this.items = this.items.filter((n) => n.id !== id)
      this.readIds.delete(id)
    },
  },
})
