<script setup>
import NavItem from '@/components/molecules/NavItem.vue'

const ROUTES = [
  { to: '/',         icon: 'home',     label: 'Accueil'  },
  { to: '/services', icon: 'server',   label: 'Services' },
  { to: '/settings', icon: 'settings', label: 'Réglages' },
]
</script>

<template>
  <!-- Bottom navbar on mobile, side/top on desktop via CSS -->
  <nav class="navbar" aria-label="Navigation principale">
    <NavItem
      v-for="route in ROUTES"
      :key="route.to"
      :to="route.to"
      :icon="route.icon"
      :label="route.label"
    />
  </nav>
</template>

<style scoped>
/* Mobile — bottom bar */
.navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-navbar);
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--color-bg-overlay);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--color-border);
  height: var(--navbar-height);
  /* Safe area pour les téléphones avec barre de gestes */
  padding-bottom: env(safe-area-inset-bottom);
}

/* Desktop — top/side or simply hidden bottom bar */
@media (min-width: 768px) {
  .navbar {
    position: static;
    height: auto;
    border-top: none;
    border-bottom: 1px solid var(--color-border);
    justify-content: flex-start;
    gap: var(--space-1);
    padding: var(--space-2) var(--content-padding);
    background: transparent;
    backdrop-filter: none;
  }
}
</style>
