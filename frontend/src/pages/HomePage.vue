<script setup>
import { computed } from 'vue'
import HomeHero from '@/components/pages/home/HomeHero.vue'
import HomeFiltersModal from '@/components/pages/home/HomeFiltersModal.vue'
import HomeExpenseList from '@/components/pages/home/HomeExpenseList.vue'
import ExpenseDetailModal from '@/components/pages/expenses/ExpenseDetailModal.vue'
import HomeDeleteConfirmation from '@/components/pages/home/HomeDeleteConfirmation.vue'
import { useHomePage } from '@/composables/useHomePage.js'

const page = useHomePage()

// Computed properties pour exposer les valeurs des refs
const showFiltersModal = computed(() => page.showFiltersModal.value)
const categories = computed(() => page.categories.value)
const hasActiveFilters = computed(() => page.hasActiveFilters.value)
const total = computed(() => page.total.value)
const filteredExpenses = computed(() => page.filteredExpenses.value)
const hasUncategorized = computed(() => page.hasUncategorized.value)
const currency = computed(() => page.currency.value)
const isLoading = computed(() => page.isLoading.value)
const isLoadingMore = computed(() => page.isLoadingMore.value)
const hasMore = computed(() => page.hasMore.value)
const selected = computed(() => page.selected.value)
const pendingDeleteExpense = computed(() => page.pendingDeleteExpense.value)
const isDeleting = computed(() => page.isDeleting.value)
const showDeleteConfirmation = computed(() => page.showDeleteConfirmation.value)
</script>

<template>
  <div class="home-page">
    <HomeFiltersModal
      :show="showFiltersModal"
      :filters="page.filters"
      :categories="categories"
      :hasActiveFilters="hasActiveFilters"
      @update:show="value => page.showFiltersModal.value = value"
      @update:filters="page.setFilters"
      @reset-filters="page.resetFilters"
    />

    <HomeHero
      :total="total"
      :filteredCount="filteredExpenses.length"
      :hasActiveFilters="hasActiveFilters"
      :hasMore="hasMore"
      :hasUncategorized="hasUncategorized"
      :isWithoutCategoryActive="page.filters.withoutCategory"
      @open-filters="page.showFiltersModal.value = true"
      @reset-filters="page.resetFilters"
      @add-operation="page.goToOperations"
      @toggle-uncategorized="page.filters.withoutCategory = !page.filters.withoutCategory"
    />

    <HomeExpenseList
      :expenses="filteredExpenses"
      :categories="categories"
      :currency="currency"
      :isLoading="isLoading"
      :isLoadingMore="isLoadingMore"
      :hasMore="hasMore"
      :total="total"
      :limit="page.LIMIT"
      @select-expense="page.openDetail"
      @load-more="page.loadMore"
    />

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
      @confirm="page.confirmDelete"
    />
  </div>
</template>

<style>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
  z-index: var(--z-modal); padding: 0;
}
@media (min-width: 640px) { .modal-overlay { align-items: center; padding: var(--space-4); } }
.modal {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  width: 100%; max-width: 480px; overflow: hidden; max-height: 90vh; overflow-y: auto;
}
@media (min-width: 640px) { .modal { border-radius: var(--radius-xl); } }

.modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  position: sticky; top: 0; background: var(--color-bg-surface);
}

.modal__body {
  padding: var(--space-5);
}

.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);
}
.form-col-span { grid-column: 1 / -1; }
.form-group { display: flex; flex-direction: column; gap: var(--space-2); }
.form-label { font-size: var(--text-sm); font-weight: var(--font-medium); }
.form-row { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.checkbox-label { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); cursor: pointer; }

.form-select {
  width: 100%; min-height: 2.5rem;
  padding: 0 var(--space-3); padding-right: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-family: inherit;
  cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right var(--space-2) center;
  background-repeat: no-repeat; background-size: 1.5em;
  transition: border-color var(--transition-fast);
}
.form-select:focus { outline: none; border-color: var(--color-primary); }

.modal__footer {
  display: flex; gap: var(--space-3); justify-content: flex-end;
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
  position: sticky; bottom: 0; background: var(--color-bg-surface);
}

.icon-btn {
  background: none; border: none; cursor: pointer;
  color: var(--color-text-secondary); display: flex;
  padding: var(--space-1); border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}
.icon-btn:hover { color: var(--color-text-primary); }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity var(--transition-fast); }
.modal-fade-enter-from,  .modal-fade-leave-to      { opacity: 0; }
.modal-fade-enter-active .modal,
.modal-fade-leave-active .modal { transition: transform var(--transition-normal); }
.modal-fade-enter-from .modal,
.modal-fade-leave-to .modal { transform: translateY(24px); }

.home-page {
  padding: var(--space-5) var(--content-padding);
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Mobile - espace pour le bouton flottant */
@media (max-width: 767px) {
  .home-page {
    padding-bottom: calc(var(--space-5) + 4.5rem);
  }
}

.home-page__hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.home-page__hero-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.home-page__summary {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.home-page__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.home-page__loader,
.home-page__empty {
  display: flex;
  justify-content: center;
  padding: var(--space-10) 0;
}

.home-page__expenses {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.expense-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  text-align: left;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  cursor: default;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}
.expense-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.expense-card__main {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-start;
}

.expense-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
}

.expense-card__amount {
  font-weight: var(--font-bold);
  color: var(--color-danger);
  white-space: nowrap;
}

.expense-card__tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}

.expense-card__tag {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
  border-radius: var(--radius-full);
  padding: 0.2rem 0.6rem;
  border: 1px solid transparent;
}

.expense-card__tag--category {
  border-width: 1px;
}

.tag--credit {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.tag--expense {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

.expense-card__note {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-page__sentinel {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 3rem;
}

@media (min-width: 640px) {
  .home-page__hero {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .filters-bar {
    flex-direction: column;
    gap: var(--space-3);
  }

  .filters-group {
    flex-direction: column;
    gap: var(--space-2);
  }

  .filter-select,
  .filter-input,
  .filter-date {
    width: 100%;
  }
}

.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-background-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  border: 1px solid var(--color-border);
}

.filters-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 200px;
}

.filters-group--dates {
  min-width: auto;
}

.filter-select,
.filter-input,
.filter-date {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: var(--color-bg-base);
  color: var(--color-text);
  font-family: inherit;
}

.filter-select:focus,
.filter-input:focus,
.filter-date:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-subtle);
}

.filter-select {
  min-width: 120px;
  flex: 1;
}

.filter-input {
  flex: 1;
  min-width: 200px;
}

.date-range-picker {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-bg-base);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.filter-date {
  flex: 1;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: var(--color-bg-base);
  color: var(--color-text);
  font-family: inherit;
}

.filter-date:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-subtle);
}

.date-range-separator {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  padding: 0 var(--space-1);
}

.btn-filter-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-filter-icon:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}

.btn-filter-shortcut {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-filter-shortcut:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}

.btn-filter-shortcut.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}

.home-page__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.filters-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filter-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.filter-toggles {
  display: flex;
  gap: var(--space-2);
}

.filter-toggle {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-toggle:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-subtle);
}

.filter-toggle.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.filter-select,
.filter-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: var(--color-bg-base);
  color: var(--color-text);
  font-family: inherit;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-subtle);
}

.filter-date-presets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.preset-btn {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-base);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-subtle);
}

.preset-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.filter-date-range {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  margin-top: var(--space-2);
}

.filter-date {
  flex: 1;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: var(--color-bg-base);
  color: var(--color-text);
  font-family: inherit;
}

.filter-date:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-subtle);
}

.date-separator {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  padding: 0 var(--space-1);
}

.filter-actions {
  display: flex;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.btn-reset {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  background: var(--color-danger-subtle);
  color: var(--color-danger);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: var(--color-danger);
  color: white;
}

.home-page__filter-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.btn-reset-filters {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background: var(--color-danger-subtle);
  color: var(--color-danger);
  border: 1.5px solid var(--color-danger);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset-filters:hover {
  background: var(--color-danger);
  color: white;
}

.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.scale-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.scale-fade-enter-to {
  opacity: 1;
  transform: scale(1);
}

.scale-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
