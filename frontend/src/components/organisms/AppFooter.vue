<script setup>
import { useRouter, useRoute } from 'vue-router'
import NavItem from '@/components/molecules/NavItem.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'

const router = useRouter()
const route = useRoute()

const ROUTES = [
  { to: '/stats',      icon: 'chart',    label: 'Stats'      },
  { to: '/operations', icon: 'database', label: 'Opérations' },
  { to: '/',           icon: 'home',     label: 'Accueil'    },
  { to: '/categories', icon: 'database', label: 'Catégories' },
  { to: '/settings',   icon: 'settings', label: 'Compte'     },
]

function goToOperations() {
  router.push({ name: 'operations' })
}
</script>

<template>
  <footer class="app-footer" aria-label="Navigation principale">
    <nav class="app-footer__nav">
      <NavItem
        v-for="route in ROUTES"
        :key="route.to"
        :to="route.to"
        :icon="route.icon"
        :label="route.label"
      />
    </nav>

    <!-- Bouton flottant pour ajouter une opération -->
    <BaseButton
      v-if="route.name !== 'operations'"
      class="app-footer__fab"
      @click="goToOperations"
      aria-label="Ajouter une opération"
    >
      ➕
    </BaseButton>
  </footer>
</template>

<style scoped>
/* Mobile — bottom bar collé au bas */
.app-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-navbar);
  background: var(--color-bg-overlay);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--color-border);
  padding-bottom: env(safe-area-inset-bottom);
}

.app-footer__nav {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  gap: var(--space-1);
  height: var(--navbar-height);
}

.app-footer__fab {
  position: absolute;
  bottom: calc(var(--navbar-height) + 1rem);
  right: 1rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.app-footer__fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.app-footer__fab:active {
  transform: scale(0.95);
}

/* Desktop — barre horizontale en bas statique */
@media (min-width: 768px) {
  .app-footer {
    position: static;
    border-top: 1px solid var(--color-border);
    border-bottom: none;
    backdrop-filter: none;
    background: var(--color-bg-surface);
    padding-bottom: 0;
  }

  .app-footer__nav {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--space-1);
    padding: var(--space-2) var(--content-padding);
    height: auto;
    max-width: var(--max-width);
    margin: 0 auto;
  }
}
</style>
