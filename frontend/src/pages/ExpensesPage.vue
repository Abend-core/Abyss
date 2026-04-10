<script setup>
import { computed } from 'vue'
import { useExpensesPage } from '@/composables/useExpensesPage.js'
import BaseText from '@/components/atoms/BaseText.vue'
import ExpenseForm from '@/components/pages/expenses/ExpenseForm.vue'
import ExpenseListView from '@/components/pages/expenses/ExpenseListView.vue'
import ExpenseDetailModal from '@/components/pages/expenses/ExpenseDetailModal.vue'
import HomeDeleteConfirmation from '@/components/pages/home/HomeDeleteConfirmation.vue'

const page = useExpensesPage()

// Computed properties pour exposer les valeurs des refs
const showForm = computed(() => page.showForm.value)
const form = computed(() => page.form.value)
const categories = computed(() => page.categories.value)
const isSubmitting = computed(() => page.isSubmitting.value)
const expenses = computed(() => page.expenses.value)
const currency = computed(() => page.currency.value)
const isLoading = computed(() => page.isLoading.value)
const isLoadingMore = computed(() => page.isLoadingMore.value)
const hasMore = computed(() => page.hasMore.value)
const selected = computed(() => page.selected.value)
const isDeleting = computed(() => page.isDeleting.value)
const showDeleteConfirmation = computed(() => page.showDeleteConfirmation.value)
const pendingDeleteExpense = computed(() => page.pendingDeleteExpense.value)
const isEditing = computed(() => page.editingExpense.value !== null)
</script>

<template>
  <div class="expenses-page">
    <!-- ── Formulaire (togglable) ─────────────────── -->
    <ExpenseForm
      :show-form="showForm"
      :form="form"
      :categories="categories"
      :is-submitting="isSubmitting"
      :is-editing="isEditing"
      @update:form="page.form.value = $event"
      @submit="page.submitExpense()"
    />

    <div class="page-section-title">
      <BaseText as="h2" size="xl" weight="bold">3 dernières opérations</BaseText>
    </div>

    <!-- ── Liste ──────────────────────────────────── -->
    <ExpenseListView
      :expenses="expenses"
      :currency="currency"
      :is-loading="isLoading"
      :is-loading-more="isLoadingMore"
      :has-more="hasMore"
      :format-date="page.formatDate"
      :get-operation-color="page.getOperationColor"
      :get-category-lineage="page.getCategoryLineage"
      :get-category-tag-style="page.getCategoryTagStyle"
      @select="page.openDetail"
      @add-expense="page.showForm = true"
    />

    <!-- ── Modal détail ───────────────────────────── -->
    <ExpenseDetailModal
      :selected="selected"
      :currency="currency"
      :categories="categories"
      :is-deleting="isDeleting"
      :format-date="page.formatDate"
      :get-operation-color="page.getOperationColor"
      :get-category-color="page.getCategoryColor"
      :get-category-path="page.getCategoryPath"
      @close="page.closeDetail()"
      @save="page.updateExpense"
      @delete="page.requestDeleteExpense"
    />

    <HomeDeleteConfirmation
      :show="showDeleteConfirmation"
      :expenseTitle="pendingDeleteExpense?.title || ''"
      :isDeleting="isDeleting"
      @close="page.closeDeleteConfirmation"
      @confirm="page.confirmDeleteExpense"
    />
  </div>
</template>

<style scoped>
/* ── Layout ──────────────────────────────────────── */
.expenses-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-5) var(--content-padding);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* ── Page header ─────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}
.page-header__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
</style>
