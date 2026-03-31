<script setup>
import { onMounted }        from 'vue'
import { useServicesStore } from '@/stores/services.store.js'
import ServiceGrid          from '@/components/organisms/ServiceGrid.vue'
import BaseButton           from '@/components/atoms/BaseButton.vue'
import BaseText             from '@/components/atoms/BaseText.vue'
import BaseIcon             from '@/components/atoms/BaseIcon.vue'

const store = useServicesStore()

onMounted(() => {
  if (store.services.every((s) => s.status === 'unknown')) {
    store.checkAll()
  }
})
</script>

<template>
  <div class="services-page">
    <div class="services-page__header">
      <div>
        <BaseText as="h1" size="2xl" weight="bold">Services</BaseText>
        <BaseText as="p" color="secondary" size="sm">
          Statut en temps réel des conteneurs Docker
        </BaseText>
      </div>

      <BaseButton
        variant="secondary"
        size="sm"
        :loading="store.isChecking"
        @click="store.checkAll()"
      >
        <BaseIcon name="refresh" :size="16" />
        Rafraîchir
      </BaseButton>
    </div>

    <ServiceGrid
      :services="store.services"
      :is-checking="store.isChecking"
    />
  </div>
</template>

<style scoped>
.services-page {
  padding: var(--space-5) var(--content-padding);
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.services-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .services-page__header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}
</style>
