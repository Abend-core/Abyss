<script setup>
import { onMounted }        from 'vue'
import { useServicesStore } from '@/stores/services.store.js'
import ServiceGrid          from '@/components/organisms/ServiceGrid.vue'
import BaseButton           from '@/components/atoms/BaseButton.vue'
import BaseIcon             from '@/components/atoms/BaseIcon.vue'
import BaseText             from '@/components/atoms/BaseText.vue'
import BaseBadge            from '@/components/atoms/BaseBadge.vue'

const store = useServicesStore()

onMounted(() => store.startAutoRefresh(30_000))
</script>

<template>
  <div class="home-page">
    <div class="home-page__hero">
      <div class="home-page__hero-text">
        <BaseText as="h1" size="3xl" weight="bold">Dashboard</BaseText>
        <BaseText as="p" color="secondary" size="sm">
          Infrastructure Abyss — Vue d'ensemble
        </BaseText>
      </div>

      <div class="home-page__summary">
        <BaseBadge :variant="store.allUp ? 'success' : 'warning'" :dot="store.allUp">
          {{ store.upCount }} / {{ store.totalCount }} en ligne
        </BaseBadge>

        <BaseButton
          variant="ghost"
          size="sm"
          :loading="store.isChecking"
          @click="store.checkAll()"
        >
          <BaseIcon name="refresh" :size="16" />
          Actualiser
        </BaseButton>
      </div>
    </div>

    <ServiceGrid
      :services="store.services"
      :is-checking="store.isChecking"
    />
  </div>
</template>

<style scoped>
.home-page {
  padding: var(--space-5) var(--content-padding);
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.home-page__hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.home-page__hero-text { display: flex; flex-direction: column; gap: var(--space-1); }

.home-page__summary {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

@media (min-width: 640px) {
  .home-page__hero {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}
</style>
