<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout    from '@/layouts/AuthLayout.vue'
import { useAppStore } from '@/stores/app.store.js'

const route    = useRoute()
const appStore = useAppStore()

const LAYOUTS = { default: DefaultLayout, auth: AuthLayout }
const layout  = computed(() => LAYOUTS[route.meta?.layout ?? 'default'])

const setOnline  = () => appStore.setOnline(true)
const setOffline = () => appStore.setOnline(false)

onMounted(() => {
  window.addEventListener('online',  setOnline)
  window.addEventListener('offline', setOffline)
  document.documentElement.setAttribute('data-theme', appStore.theme)
})
onUnmounted(() => {
  window.removeEventListener('online',  setOnline)
  window.removeEventListener('offline', setOffline)
})
</script>

<template>
  <component :is="layout" />
</template>

<style>
/* Transitions de page globales */
.page-enter-active,
.page-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to   { opacity: 0; transform: translateY(-8px); }
</style>


