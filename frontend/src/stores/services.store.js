import { defineStore } from 'pinia'

const SERVICES_CONFIG = [
  {
    id: 'frontend',
    name: 'Frontend',
    description: 'Vue.js PWA',
    url: 'http://localhost:5173',
    healthUrl: null, // propre instance
    type: 'frontend',
  },
  {
    id: 'api',
    name: 'API',
    description: 'Fastify REST API',
    url: 'http://localhost:3000',
    healthUrl: 'http://localhost:3000/health',
    type: 'api',
  },
  {
    id: 'postgres',
    name: 'Database',
    description: 'PostgreSQL · dbo',
    url: 'localhost:5432',
    healthUrl: 'http://localhost:3000/api/db-status',
    type: 'database',
  },
]

export const useServicesStore = defineStore('services', {
  state: () => ({
    services: SERVICES_CONFIG.map((s) => ({
      ...s,
      status: 'unknown', // 'up' | 'down' | 'unknown' | 'checking'
      latency: null,
      lastChecked: null,
    })),
    isChecking: false,
    autoRefreshInterval: null,
  }),

  getters: {
    allUp: (state) => state.services.every((s) => s.status === 'up'),
    upCount: (state) => state.services.filter((s) => s.status === 'up').length,
    downCount: (state) => state.services.filter((s) => s.status === 'down').length,
    totalCount: (state) => state.services.length,
  },

  actions: {
    async checkAll() {
      if (this.isChecking) return
      this.isChecking = true
      await Promise.all(this.services.map((s) => this._checkOne(s)))
      this.isChecking = false
    },

    async _checkOne(service) {
      service.status = 'checking'

      // Le frontend (propre instance) est toujours up si on y est
      if (service.id === 'frontend') {
        service.status = 'up'
        service.latency = 0
        service.lastChecked = new Date().toISOString()
        return
      }

      if (!service.healthUrl) return

      const start = performance.now()
      try {
        const res = await fetch(service.healthUrl, {
          signal: AbortSignal.timeout(5000),
        })
        service.latency = Math.round(performance.now() - start)
        service.status = res.ok ? 'up' : 'down'
      } catch {
        service.status = 'down'
        service.latency = null
      } finally {
        service.lastChecked = new Date().toISOString()
      }
    },

    startAutoRefresh(intervalMs = 30_000) {
      this.stopAutoRefresh()
      this.checkAll()
      this.autoRefreshInterval = setInterval(() => this.checkAll(), intervalMs)
    },

    stopAutoRefresh() {
      if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval)
        this.autoRefreshInterval = null
      }
    },
  },
})
