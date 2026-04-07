<script setup>
import BaseText   from '@/components/atoms/BaseText.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseIcon   from '@/components/atoms/BaseIcon.vue'
import { useAppStore } from '@/stores/app.store.js'
import { useAuthStore } from '@/stores/auth.store.js'
import logoUrl from '@/assets/logo.png'

const appStore = useAppStore()
const authStore = useAuthStore()

defineProps({
  title: { type: String, default: 'Abyss' },
})

function handleLogout() {
  authStore.logout()
  // Redirect to login page or home
  window.location.href = '/'
}
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <div class="header__brand">
        <img :src="logoUrl" alt="Abyss" class="header__logo-img" />
        <BaseText as="span" size="xl" weight="bold" color="primary">{{ title }}</BaseText>
      </div>

      <div class="header__actions">
        <!-- Theme toggle -->
        <BaseButton
          variant="ghost"
          size="sm"
          @click="appStore.toggleTheme"
          :title="appStore.isDark ? 'Passer en thème clair' : 'Passer en thème sombre'"
          class="header__action-btn"
        >
          <BaseIcon :name="appStore.isDark ? 'light_mode' : 'dark_mode'" :size="18" />
        </BaseButton>

        <!-- Logout button (only if authenticated) -->
        <BaseButton
          v-if="authStore.isAuthenticated"
          variant="ghost"
          size="sm"
          @click="handleLogout"
          title="Se déconnecter"
          class="header__action-btn"
        >
          <BaseIcon name="logout" :size="18" />
        </BaseButton>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  background: var(--color-bg-overlay);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  height: var(--header-height);
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 var(--content-padding);
  max-width: var(--max-width);
  margin: 0 auto;
}

.header__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header__logo { font-size: var(--text-xl); }

.header__logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 8px;
  display: block;
  flex-shrink: 0;
}

.header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header__action-btn {
  transition: background var(--transition-fast), transform var(--transition-fast), color var(--transition-fast);
}
.header__action-btn:hover:not(:disabled) {
  background: var(--color-bg-elevated);
  transform: translateY(-1px);
}
</style>
