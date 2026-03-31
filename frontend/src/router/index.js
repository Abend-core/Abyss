import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore }                   from '@/stores/auth.store.js'

const routes = [
  // ── Auth (pas de header/footer) ──────────────────────────
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { layout: 'auth', title: 'Connexion' }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/RegisterPage.vue'),
    meta: { layout: 'auth', title: 'Inscription' }
  },

  // ── App (layout par défaut — protégées) ──────────────────
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
    meta: { layout: 'default', title: 'Accueil', requiresAuth: true }
  },
  {
    path: '/expenses',
    name: 'expenses',
    component: () => import('@/pages/ExpensesPage.vue'),
    meta: { layout: 'default', title: 'Dépenses', requiresAuth: true }
  },
  {
    path: '/services',
    name: 'services',
    component: () => import('@/pages/ServicesPage.vue'),
    meta: { layout: 'default', title: 'Services', requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { layout: 'default', title: 'Paramètres', requiresAuth: true }
  },

  // ── 404 ───────────────────────────────────────────────────
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { layout: 'default', title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  }
})

// ── Guard auth ───────────────────────────────────────────────
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Déjà connecté → pas besoin d'aller sur login/register
  if ((to.name === 'login' || to.name === 'register') && auth.isAuthenticated) {
    return { name: 'home' }
  }
})

router.afterEach((to) => {
  const title = to.meta?.title
  document.title = title ? `${title} — Abyss` : 'Abyss'
})

export default router
