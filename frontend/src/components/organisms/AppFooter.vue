<script setup>
import NavItem from '@/components/molecules/NavItem.vue'

const ROUTES = [
  { to: '/',         icon: 'home',     label: 'Accueil'  },
  { to: '/services', icon: 'server',   label: 'Services' },
  { to: '/settings', icon: 'settings', label: 'Réglages' },
]
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
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: var(--navbar-height);
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
    justify-content: flex-start;
    gap: var(--space-1);
    padding: var(--space-2) var(--content-padding);
    height: auto;
    max-width: var(--max-width);
    margin: 0 auto;
  }
}
</style>
