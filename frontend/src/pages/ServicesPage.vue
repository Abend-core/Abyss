<script setup>
import { onMounted, ref } from 'vue'
import { useApi } from '@/composables/useApi.js'
import { useAppStore } from '@/stores/app.store.js'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseText from '@/components/atoms/BaseText.vue'

const api = useApi()
const appStore = useAppStore()
const categories = ref([])
const newCategory = ref('')

async function loadCategories() {
  try {
    categories.value = await api.get('/api/categories')
  } catch (error) {
    appStore.notify({ type: 'error', message: 'Impossible de charger les catégories.' })
  }
}

async function addCategory() {
  const name = newCategory.value.trim()
  if (!name) {
    return appStore.notify({ type: 'warning', message: 'Le nom de la catégorie est requis.' })
  }

  try {
    const created = await api.post('/api/categories', { name })
    categories.value.push(created)
    newCategory.value = ''
    appStore.notify({ type: 'success', message: 'Catégorie ajoutée.' })
  } catch (error) {
    appStore.notify({ type: 'error', message: 'Impossible de créer la catégorie.' })
  }
}

async function removeCategory(id) {
  try {
    await api.del(`/api/categories/${id}`)
    categories.value = categories.value.filter((category) => category.id !== id)
    appStore.notify({ type: 'success', message: 'Catégorie supprimée.' })
  } catch (error) {
    appStore.notify({ type: 'error', message: 'Impossible de supprimer la catégorie.' })
  }
}

onMounted(loadCategories)
</script>

<template>
  <div class="categories-page">
    <div class="categories-page__header">
      <div>
        <BaseText as="h1" size="2xl" weight="bold">Catégories</BaseText>
        <BaseText as="p" color="secondary" size="sm">
          Gérez vos catégories d'opérations avant de créer vos opérations.
        </BaseText>
      </div>
    </div>

    <section class="categories-page__form">
      <BaseInput
        v-model="newCategory"
        label="Nouvelle catégorie"
        placeholder="Courses, Transport, Loisirs..."
      />
      <BaseButton @click="addCategory" size="sm">Ajouter</BaseButton>
    </section>

    <section class="categories-page__list">
      <div v-if="categories.length === 0" class="categories-page__empty">
        Aucune catégorie définie pour le moment.
      </div>

      <div v-for="category in categories" :key="category.id" class="categories-page__card">
        <div>
          <BaseText weight="medium">{{ category.name }}</BaseText>
        </div>
        <BaseButton variant="secondary" size="sm" @click="removeCategory(category.id)">
          Supprimer
        </BaseButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.categories-page {
  padding: var(--space-5) var(--content-padding);
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.categories-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.categories-page__form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: flex-end;
}

.categories-page__list {
  display: grid;
  gap: var(--space-3);
}

.categories-page__card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-bg-surface);
}

.categories-page__empty {
  color: var(--color-text-muted);
  padding: var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-xl);
}
</style>
