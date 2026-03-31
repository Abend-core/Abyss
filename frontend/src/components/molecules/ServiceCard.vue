<script setup>
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import BaseIcon  from '@/components/atoms/BaseIcon.vue'
import BaseText  from '@/components/atoms/BaseText.vue'

const props = defineProps({
  service: {
    type: Object,
    required: true,
    // { id, name, description, url, type, status, latency, lastChecked }
  },
})

const STATUS_MAP = {
  up:       { variant: 'success', label: 'En ligne',      icon: 'check'   },
  down:     { variant: 'danger',  label: 'Hors ligne',    icon: 'alert'   },
  checking: { variant: 'warning', label: 'Vérification…', icon: 'refresh' },
  unknown:  { variant: 'default', label: 'Inconnu',       icon: 'info'    },
}

const TYPE_ICON = {
  frontend: 'home',
  api:      'server',
  database: 'database',
}

function formatLatency(ms) {
  if (ms === null || ms === undefined) return '—'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <article class="service-card" :class="`service-card--${service.status}`">
    <div class="service-card__header">
      <div class="service-card__icon-wrap">
        <BaseIcon :name="TYPE_ICON[service.type] ?? 'server'" :size="22" />
      </div>
      <BaseBadge
        :variant="STATUS_MAP[service.status]?.variant ?? 'default'"
        :dot="service.status === 'up'"
        size="sm"
      >
        {{ STATUS_MAP[service.status]?.label ?? service.status }}
      </BaseBadge>
    </div>

    <div class="service-card__body">
      <BaseText as="h3" size="lg" weight="semibold">{{ service.name }}</BaseText>
      <BaseText as="p" size="sm" color="muted">{{ service.description }}</BaseText>
    </div>

    <div class="service-card__footer">
      <a :href="service.url" target="_blank" rel="noopener" class="service-card__url">
        <BaseText size="xs" color="secondary" mono>{{ service.url }}</BaseText>
        <BaseIcon name="external" :size="12" />
      </a>
      <div class="service-card__meta">
        <BaseText size="xs" color="muted">{{ formatLatency(service.latency) }}</BaseText>
        <BaseText size="xs" color="muted">· {{ formatTime(service.lastChecked) }}</BaseText>
      </div>
    </div>
  </article>
</template>

<style scoped>
.service-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  transition: transform var(--transition-fast), border-color var(--transition-fast),
              box-shadow var(--transition-fast);
}

.service-card--up {
  border-color: rgba(74, 222, 128, 0.2);
  box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.05);
}
.service-card--down   { border-color: rgba(248, 113, 113, 0.2); }
.service-card--checking { border-color: rgba(250, 204, 21, 0.2); }

@media (hover: hover) {
  .service-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

.service-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.service-card__icon-wrap {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.service-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.service-card__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.service-card__url {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  opacity: 0.7;
  transition: opacity var(--transition-fast);
  max-width: 100%;
  overflow: hidden;
}
.service-card__url:hover { opacity: 1; }

.service-card__meta {
  display: flex;
  gap: var(--space-1);
}
</style>
