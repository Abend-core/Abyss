<script setup>
import { useRouter }  from 'vue-router'
import BaseButton     from '@/components/atoms/BaseButton.vue'
import BaseText       from '@/components/atoms/BaseText.vue'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <span class="not-found__emoji" aria-hidden="true">🌑</span>
    <BaseText as="h1" size="3xl" weight="bold">404</BaseText>
    <BaseText as="p" color="secondary">Cette page n'existe pas dans l'abîme.</BaseText>
    <BaseButton @click="router.push('/')">Retour à l'accueil</BaseButton>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 60dvh;
  padding: var(--space-8) var(--content-padding);
  text-align: center;
}

.not-found__emoji { font-size: 4rem; }
</style>
