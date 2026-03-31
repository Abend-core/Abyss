/**
 * Setup global pour les tests frontend
 * - Configure Vue Router mock
 * - Configure Pinia (createTestingPinia)
 */

import { config } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'

// Router minimal pour que useRouter() ne plante pas dans les composants
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/login', component: { template: '<div />' } },
    { path: '/register', component: { template: '<div />' } },
    { path: '/expenses', component: { template: '<div />' } },
  ],
})

config.global.plugins = [router, createPinia()]
