<script setup>
import AppHeader from '@/components/organisms/AppHeader.vue'
import AppFooter from '@/components/organisms/AppFooter.vue'
import NotificationList from '@/components/organisms/NotificationList.vue'
</script>

<template>
  <div class="default-layout">
    <AppHeader />

    <main class="default-layout__main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <AppFooter />

    <NotificationList />
  </div>
</template>

<style scoped>
.default-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.default-layout__main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  /* Espace sous le contenu pour la bottom nav mobile fixe */
  padding-bottom: calc(var(--navbar-height) + env(safe-area-inset-bottom));
}

@media (min-width: 768px) {
  .default-layout__main {
    padding-bottom: 0;
  }
}
</style>
