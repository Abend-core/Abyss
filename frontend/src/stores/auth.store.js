import { defineStore } from 'pinia'

const TOKEN_KEY = 'abyss_token'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) ?? null,
    user:  null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    /**
     * Appelé après une réponse réussie de l'API auth
     * @param {{ token: string, user: object }} payload
     */
    setSession({ token, user }) {
      this.token = token
      this.user  = user ?? null
      localStorage.setItem(TOKEN_KEY, token)
    },

    logout() {
      this.token = null
      this.user  = null
      localStorage.removeItem(TOKEN_KEY)
    },
  },
})
