<script setup>
import { useAppStore }      from '@/stores/app.store.js'
import { useServicesStore } from '@/stores/services.store.js'
import BaseButton           from '@/components/atoms/BaseButton.vue'
import BaseText             from '@/components/atoms/BaseText.vue'
import BaseIcon             from '@/components/atoms/BaseIcon.vue'

const appStore      = useAppStore()
const servicesStore = useServicesStore()

const SETTINGS = [
  {
    id: 'theme',
    label: 'Thème',
    description: 'Basculer entre le thème sombre et clair',
    icon: 'info',
    action: () => appStore.toggleTheme(),
    currentValue: () => (appStore.isDark ? 'Sombre' : 'Clair'),
  },
  {
    id: 'refresh',
    label: 'Vérifier les services',
    description: 'Lancer une vérification manuelle de tous les services',
    icon: 'refresh',
    action: () => servicesStore.checkAll(),
    currentValue: () => null,
  },
]
</script>

<template>
  <div class="settings-page">
    <div class="settings-page__header">
      <BaseText as="h1" size="2xl" weight="bold">Paramètres</BaseText>
      <BaseText as="p" color="secondary" size="sm">Préférences de l'application</BaseText>
    </div>

    <section class="settings-page__section">
      <div
        v-for="setting in SETTINGS"
        :key="setting.id"
        class="settings-page__item"
      >
        <div class="settings-page__item-left">
          <div class="settings-page__item-icon">
            <BaseIcon :name="setting.icon" :size="18" />
          </div>
          <div class="settings-page__item-info">
            <BaseText weight="medium">{{ setting.label }}</BaseText>
            <BaseText size="sm" color="muted">{{ setting.description }}</BaseText>
          </div>
        </div>

        <BaseButton variant="secondary" size="sm" @click="setting.action()">
          {{ setting.currentValue?.() ?? 'Lancer' }}
        </BaseButton>
      </div>
    </section>

    <section class="settings-page__about">
      <BaseText size="xs" color="muted">Abyss — v1.0.0</BaseText>
      <BaseText size="xs" color="muted">Vue 3 · Fastify · PostgreSQL</BaseText>
    </section>
  </div>
</template>

<style scoped>
.settings-page {
  padding: var(--space-5) var(--content-padding);
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.settings-page__header { display: flex; flex-direction: column; gap: var(--space-1); }

.settings-page__section {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.settings-page__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-surface);
  min-height: 4rem;
  flex-wrap: wrap;
}
.settings-page__item:last-child { border-bottom: none; }

.settings-page__item-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
}

.settings-page__item-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  flex-shrink: 0;
}

.settings-page__item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.settings-page__about {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-4);
}
</style>
