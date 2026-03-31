<script setup>
import { computed } from 'vue'
import { useLink }  from 'vue-router'
import BaseIcon     from '@/components/atoms/BaseIcon.vue'
import BaseText     from '@/components/atoms/BaseText.vue'

const props = defineProps({
  to:    { type: String, required: true },
  icon:  { type: String, required: true },
  label: { type: String, required: true },
})

const { isActive } = useLink({ to: computed(() => props.to) })
</script>

<template>
  <RouterLink :to="to" class="nav-item" :class="{ 'nav-item--active': isActive }">
    <BaseIcon :name="icon" :size="20" />
    <BaseText size="xs" weight="medium">{{ label }}</BaseText>
  </RouterLink>
</template>

<style scoped>
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  transition: color var(--transition-fast), background var(--transition-fast);
  min-width: 4rem;
  -webkit-tap-highlight-color: transparent;
}

.nav-item:hover { color: var(--color-text-secondary); }

.nav-item--active {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}
</style>
