<script setup>
import AppHeader from '@/components/organisms/AppHeader.vue'
import AppFooter from '@/components/organisms/AppFooter.vue'
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
  </div>
</template>

<style scoped>
.default-layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.default-layout__main {
  flex: 1;
  /* Espace sous le contenu pour la bottom nav mobile fixe */
  padding-bottom: calc(var(--navbar-height) + env(safe-area-inset-bottom));
}

@media (min-width: 768px) {
  .default-layout__main {
    padding-bottom: 0;
  }
}
</style>
