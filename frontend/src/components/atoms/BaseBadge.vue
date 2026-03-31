<script setup>
defineProps({
  /** 'success' | 'warning' | 'danger' | 'info' | 'default' */
  variant: { type: String, default: 'default' },
  /** 'sm' | 'md' */
  size:    { type: String, default: 'md' },
  dot:     { type: Boolean, default: false },
})
</script>

<template>
  <span :class="['badge', `badge--${variant}`, `badge--${size}`]">
    <span v-if="dot" class="badge__dot" :class="`badge__dot--${variant}`" />
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border-radius: var(--radius-full);
  font-weight: var(--font-medium);
  white-space: nowrap;
}

.badge--sm { padding: 0.15rem var(--space-2); font-size: var(--text-xs); }
.badge--md { padding: var(--space-1) var(--space-3); font-size: var(--text-sm); }

.badge--default {
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
}
.badge--success {
  background: var(--color-success-subtle);
  color: var(--color-success);
}
.badge--warning {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}
.badge--danger {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}
.badge--info {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.badge__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  flex-shrink: 0;
  animation: dot-pulse 2s ease-in-out infinite;
}
.badge__dot--success  { background: var(--color-success); }
.badge__dot--warning  { background: var(--color-warning); animation: none; }
.badge__dot--danger   { background: var(--color-danger); animation: none; }
.badge__dot--info    { background: var(--color-primary); }

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
</style>
