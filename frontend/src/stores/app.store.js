import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    /** 'dark' | 'light' */
    theme: localStorage.getItem('abyss_theme') ?? 'dark',
    isOnline: navigator.onLine,
    notifications: [],
    _nextNotifId: 0,
  }),

  getters: {
    isDark: (state) => state.theme === 'dark',

    unreadNotifications: (state) =>
      state.notifications.filter((n) => !n.read),

    unreadCount: (state) =>
      state.notifications.filter((n) => !n.read).length,
  },

  actions: {
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('abyss_theme', this.theme)
      document.documentElement.setAttribute('data-theme', this.theme)
    },

    setOnline(value) {
      this.isOnline = value
    },

    /**
     * @param {{ type?: 'info'|'success'|'warning'|'error', message: string, duration?: number }} opts
     */
    notify({ type = 'info', message, duration = 4000 }) {
      const id = ++this._nextNotifId
      this.notifications.push({ id, type, message, read: false, at: Date.now() })

      if (duration > 0) {
        setTimeout(() => this.removeNotification(id), duration)
      }
    },

    markRead(id) {
      const n = this.notifications.find((n) => n.id === id)
      if (n) n.read = true
    },

    removeNotification(id) {
      this.notifications = this.notifications.filter((n) => n.id !== id)
    },

    clearNotifications() {
      this.notifications = []
    },
  },
})
