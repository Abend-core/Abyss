import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store.js'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function useApi() {
  const loading = ref(false)
  const error = ref(null)
  const auth = useAuthStore()

  async function request(path, options = {}) {
    loading.value = true
    error.value = null
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      }

      if (auth.token) {
        headers.Authorization = `Bearer ${auth.token}`
      }

      const res = await fetch(`${BASE_URL}${path}`, {
        headers,
        ...options,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      return data
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const get  = (path, opts = {}) => request(path, { method: 'GET', ...opts })
  const post = (path, body, opts = {}) =>
    request(path, { method: 'POST', body: JSON.stringify(body), ...opts })
  const put  = (path, body, opts = {}) =>
    request(path, { method: 'PUT', body: JSON.stringify(body), ...opts })
  const del  = (path, opts = {}) => request(path, { method: 'DELETE', ...opts })

  return { loading, error, get, post, put, del }
}
