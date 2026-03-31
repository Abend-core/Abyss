<script setup>
import BaseText   from '@/components/atoms/BaseText.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseIcon   from '@/components/atoms/BaseIcon.vue'
import { useAppStore } from '@/stores/app.store.js'

const appStore = useAppStore()

defineProps({
  title: { type: String, default: 'Abyss' },
})
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <div class="header__brand">
        <span class="header__logo" aria-hidden="true">🌑</span>
        <BaseText as="span" size="xl" weight="bold" color="primary">{{ title }}</BaseText>
      </div>

      <div class="header__actions">
        <!-- Online indicator -->
        <span
          class="header__online"
          :class="{ 'header__online--up': appStore.isOnline }"
          :title="appStore.isOnline ? 'En ligne' : 'Hors ligne'"
        />

        <!-- Theme toggle -->
        <BaseButton variant="ghost" size="sm" @click="appStore.toggleTheme">
          <BaseIcon :name="appStore.isDark ? 'info' : 'settings'" :size="18" />
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

.header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header__online {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color-danger);
  transition: background var(--transition-normal);
}
.header__online--up { background: var(--color-success); }
</style>
