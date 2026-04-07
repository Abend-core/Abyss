<script setup>
import { computed } from 'vue'
import BaseText from '@/components/atoms/BaseText.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'
import { useAppStore } from '@/stores/app.store.js'

const appStore = useAppStore()

const notifications = computed(() => appStore.notifications.slice(-5)) // Max 5

function remove(id) {
  appStore.removeNotification(id)
}
</script>

<template>
  <div class="notifications">
    <TransitionGroup name="notif" tag="div" class="notifications__list">
      <div
        v-for="notif in notifications"
        :key="notif.id"
        class="notif"
        :class="`notif--${notif.type}`"
      >
        <BaseIcon :name="notif.type === 'error' ? 'x' : notif.type === 'success' ? 'check' : 'info'" size="16" />
        <BaseText size="sm">{{ notif.message }}</BaseText>
        <button type="button" class="notif__close" @click="remove(notif.id)">
          <BaseIcon name="x" size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notifications {
  position: fixed;
  top: var(--header-height);
  right: var(--space-4);
  z-index: var(--z-modal);
  pointer-events: none;
}

.notifications__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.notif {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
  min-width: 320px;
  max-width: 480px;
}

.notif--info {
  border-color: var(--color-info);
}

.notif--success {
  border-color: var(--color-success);
}

.notif--warning {
  border-color: var(--color-warning);
}

.notif--error {
  border-color: var(--color-danger);
}

.notif__close {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}

.notif__close:hover {
  color: var(--color-text-primary);
}

.notif-enter-active,
.notif-leave-active {
  transition: all var(--transition-normal);
}

.notif-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notif-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notif-move {
  transition: transform var(--transition-normal);
}
</style>