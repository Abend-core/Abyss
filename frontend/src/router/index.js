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
    path: '/operations',
    alias: ['/expenses'],
    name: 'operations',
    component: () => import('@/pages/ExpensesPage.vue'),
    meta: { layout: 'default', title: 'Opérations', requiresAuth: true }
  },
  {
    path: '/categories',
    alias: ['/services'],
    name: 'categories',
    component: () => import('@/pages/CategoriesPage.vue'),
    meta: { layout: 'default', title: 'Catégories', requiresAuth: true }
  },
  {
    path: '/stats',
    name: 'stats',
    component: () => import('@/pages/StatsPage.vue'),
    meta: { layout: 'default', title: 'Statistiques', requiresAuth: true }
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
  const isAuthenticated = auth.isAuthenticated

  // Si la route requiert l'authentification et utilisateur pas connecté
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }

  // Si utilisateur n'a pas d'auth ET route est pas login/register → redirect to login
  if (!isAuthenticated && to.name !== 'login' && to.name !== 'register' && to.name !== 'not-found') {
    return { name: 'login' }
  }

  // Déjà connecté → pas besoin d'aller sur login/register
  if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    return { name: 'home' }
  }
})

router.afterEach((to) => {
  const title = to.meta?.title
  document.title = title ? `${title} — Abyss` : 'Abyss'
})

export default router
