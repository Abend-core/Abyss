<script setup>
import { computed } from 'vue'
import { useCategoriesPage } from '@/composables/useCategoriesPage.js'
import BaseText from '@/components/atoms/BaseText.vue'
import CategoryTree from '@/components/organisms/CategoryTree.vue'
import CategoriesForm from '@/components/pages/categories/CategoriesForm.vue'
import CategoriesEditModal from '@/components/pages/categories/CategoriesEditModal.vue'

const page = useCategoriesPage()

// Computed properties pour exposer les valeurs des refs
const newCategory = computed(() => page.newCategory.value)
const categoryTree = computed(() => page.categoryTree.value)
const editingCategory = computed(() => page.editingCategory.value)
const editForm = computed(() => page.editForm.value)
</script>

<template>
  <div class="categories-page">
    <!-- ── En-tête ────────────────────────────────── -->
    <div class="page-header">
      <div class="page-header__text">
        <BaseText as="h1" size="2xl" weight="bold">Catégories</BaseText>
        <BaseText color="secondary" size="sm">Organisez vos catégories de dépenses</BaseText>
      </div>
    </div>

    <!-- ── Formulaire ──────────────────────────────── -->
    <CategoriesForm
      :new-category="newCategory"
      @update:new-category="page.newCategory.value = $event"
      @add="page.handleAddCategory()"
    />

    <!-- ── Arbre ───────────────────────────────────── -->
    <CategoryTree
      :categories="categoryTree"
      @edit="page.openEdit"
      @delete="page.handleDeleteCategory"
      @move-up="page.handleMoveUp"
      @move-down="page.handleMoveDown"
      @promote="page.handlePromote"
      @demote="page.handleDemote"
    />

    <!-- ── Modal d'édition ────────────────────────── -->
    <CategoriesEditModal
      :editing-category="editingCategory"
      :edit-form="editForm"
      @update:editForm="page.editForm.value = $event"
      @close="page.cancelEdit()"
      @save="page.handleSaveEdit()"
      @delete="page.handleDeleteCategory(editingCategory.id)"
    />
  </div>
</template>

<style scoped>
.categories-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-5) var(--content-padding);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.page-header__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* Mobile - espace pour le bouton flottant */
@media (max-width: 767px) {
  .categories-page {
    padding-bottom: calc(var(--space-5) + 4.5rem);
  }
}
</style>
