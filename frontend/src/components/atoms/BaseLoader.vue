<script setup>
defineProps({
  /** 'sm' | 'md' | 'lg' | 'xl' */
  size: { type: String, default: 'md' },
  /** 'primary' | 'white' */
  color: { type: String, default: 'primary' },
  label: { type: String, default: 'Chargement...' },
})
</script>

<template>
  <span
    role="status"
    :aria-label="label"
    :class="['loader', `loader--${size}`, `loader--${color}`]"
  />
</template>

<style scoped>
.loader {
  display: inline-block;
  border-radius: 50%;
  border-style: solid;
  border-color: currentColor;
  border-right-color: transparent;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.loader--sm { width: 1rem;   height: 1rem;   border-width: 2px; }
.loader--md { width: 1.5rem; height: 1.5rem; border-width: 2px; }
.loader--lg { width: 2rem;   height: 2rem;   border-width: 3px; }
.loader--xl { width: 3rem;   height: 3rem;   border-width: 3px; }

.loader--primary { color: var(--color-primary); }
.loader--white   { color: #fff; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
