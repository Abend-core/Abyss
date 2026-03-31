<script setup>
import ServiceCard from '@/components/molecules/ServiceCard.vue'
import BaseLoader  from '@/components/atoms/BaseLoader.vue'
import BaseText    from '@/components/atoms/BaseText.vue'

defineProps({
  services:   { type: Array, required: true },
  isChecking: { type: Boolean, default: false },
})
</script>

<template>
  <section class="service-grid">
    <div v-if="isChecking && !services.some(s => s.lastChecked)" class="service-grid__loading">
      <BaseLoader size="lg" />
      <BaseText color="muted" size="sm">Vérification des services…</BaseText>
    </div>

    <div v-else class="service-grid__cards">
      <ServiceCard
        v-for="service in services"
        :key="service.id"
        :service="service"
      />
    </div>
  </section>
</template>

<style scoped>
.service-grid__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
}

.service-grid__cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .service-grid__cards { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .service-grid__cards { grid-template-columns: repeat(3, 1fr); }
}
</style>
