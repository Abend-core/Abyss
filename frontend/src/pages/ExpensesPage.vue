<script setup>
import { useExpensesPage } from '@/composables/useExpensesPage.js'
import BaseText from '@/components/atoms/BaseText.vue'
import ExpenseForm from '@/components/pages/expenses/ExpenseForm.vue'
import ExpenseListView from '@/components/pages/expenses/ExpenseListView.vue'
import ExpenseDetailModal from '@/components/pages/expenses/ExpenseDetailModal.vue'

const page = useExpensesPage()
</script>

<template>
  <div class="expenses-page">
    <!-- ── En-tête ────────────────────────────────── -->
    <div class="page-header">
      <div class="page-header__text">
        <BaseText as="h1" size="2xl" weight="bold">Historique</BaseText>
      </div>
    </div>

    <!-- ── Formulaire (togglable) ─────────────────── -->
    <ExpenseForm
      :show-form="page.showForm"
      :form="page.form"
      :categories="page.categories"
      :is-submitting="page.isSubmitting"
      @update:form="page.form = $event"
      @submit="page.createExpense()"
    />

    <!-- ── Liste ──────────────────────────────────── -->
    <ExpenseListView
      :expenses="page.expenses"
      :currency="page.currency"
      :is-loading="page.isLoading"
      :is-loading-more="page.isLoadingMore"
      :has-more="page.hasMore"
      :format-date="page.formatDate"
      :get-operation-color="page.getOperationColor"
      :get-category-lineage="page.getCategoryLineage"
      :get-category-tag-style="page.getCategoryTagStyle"
      @select="page.openDetail"
      @add-expense="page.showForm = true"
    />

    <!-- ── Modal détail ───────────────────────────── -->
    <ExpenseDetailModal
      :selected="page.selected"
      :currency="page.currency"
      :is-deleting="page.isDeleting"
      :format-date="page.formatDate"
      :get-operation-color="page.getOperationColor"
      :get-category-color="page.getCategoryColor"
      :get-category-path="page.getCategoryPath"
      @close="page.closeDetail()"
      @delete="page.deleteExpense"
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
