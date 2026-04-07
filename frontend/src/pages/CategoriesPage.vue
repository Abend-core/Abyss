<script setup>
import { useCategoriesPage } from '@/composables/useCategoriesPage.js'
import BaseText from '@/components/atoms/BaseText.vue'
import CategoryTree from '@/components/organisms/CategoryTree.vue'
import CategoriesForm from '@/components/pages/categories/CategoriesForm.vue'
import CategoriesEditModal from '@/components/pages/categories/CategoriesEditModal.vue'

const page = useCategoriesPage()
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
      :new-category="page.newCategory"
      @update:new-category="page.newCategory = $event"
      @add="page.handleAddCategory()"
    />

    <!-- ── Arbre ───────────────────────────────────── -->
    <CategoryTree
      :tree="page.categoryTree"
      @edit="page.openEdit"
      @delete="page.handleDeleteCategory"
      @move-up="page.handleMoveUp"
      @move-down="page.handleMoveDown"
      @promote="page.handlePromote"
      @demote="page.handleDemote"
    />

    <!-- ── Modal d'édition ────────────────────────── -->
    <CategoriesEditModal
      :editing-category="page.editingCategory"
      :edit-form="page.editForm"
      @update:editForm="page.editForm = $event"
      @close="page.cancelEdit()"
      @save="page.handleSaveEdit()"
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
</style>
