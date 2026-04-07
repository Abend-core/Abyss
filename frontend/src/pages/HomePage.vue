<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'
import { useAppStore } from '@/stores/app.store.js'
import BaseText from '@/components/atoms/BaseText.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'
import BaseLoader from '@/components/atoms/BaseLoader.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseStepper from '@/components/atoms/BaseStepper.vue'

const router = useRouter()
const { api } = useApi()
const appStore = useAppStore()

const expenses = ref([])
const total = ref(0)
const offset = ref(0)
const LIMIT = 15
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const currency = ref('€')
const categories = ref([])
let sentinel = null

// Modal d'édition
const editingExpense = ref(null)
const editForm = ref({
  title: '', amount: '',
  date: new Date().toISOString().split('T')[0],
  type: 'expense', categoryId: '', isRecurring: false, recurrence: '',
})
const isSubmitting = ref(false)
const isDeleting = ref(false)
const showDeleteConfirmation = ref(false)

// Filtres
const showFiltersModal = ref(false)
const filterType = ref('') // '' = tous, 'expense' = dépenses, 'credit' = crédits
const filterCategory = ref('') // '' = toutes
const filterTitle = ref('') // recherche texte
const filterDateRangeType = ref('all') // 'all', 'week', 'month', 'custom'
const filterDateFrom = ref('') // YYYY-MM-DD
const filterDateTo = ref('') // YYYY-MM-DD
const filterWithoutCategory = ref(false) // true = afficher uniquement les sans catégorie

function getDateRangePreset(type) {
  const today = new Date()
  const from = new Date()
  
  switch(type) {
    case 'week':
      from.setDate(today.getDate() - 7)
      return { from: from.toISOString().split('T')[0], to: today.toISOString().split('T')[0] }
    case 'month':
      from.setMonth(today.getMonth() - 1)
      return { from: from.toISOString().split('T')[0], to: today.toISOString().split('T')[0] }
    case 'custom':
      return { from: filterDateFrom.value, to: filterDateTo.value }
    default:
      return { from: '', to: '' }
  }
}

watch(filterDateRangeType, (newType) => {
  if (newType !== 'custom') {
    const preset = getDateRangePreset(newType)
    filterDateFrom.value = preset.from
    filterDateTo.value = preset.to
  }
})

const filteredExpenses = computed(() => {
  return expenses.value.filter(exp => {
    // Filtre type
    if (filterType.value && exp.type !== filterType.value) return false
    
    // Filtre sans catégorie
    if (filterWithoutCategory.value) {
      if (exp.category) return false
    }
    
    // Filtre catégorie
    if (filterCategory.value) {
      if (!categoryMatchesFilter(exp.category, filterCategory.value)) return false
    }
    
    // Filtre titre (recherche insensible à la casse)
    if (filterTitle.value) {
      const searchTerm = filterTitle.value.toLowerCase()
      const titleMatch = exp.title.toLowerCase().includes(searchTerm)
      const descMatch = exp.description?.toLowerCase().includes(searchTerm) ?? false
      if (!titleMatch && !descMatch) return false
    }
    
    // Filtre date
    if (filterDateFrom.value) {
      const expDate = new Date(exp.date)
      const fromDate = new Date(filterDateFrom.value)
      if (expDate < fromDate) return false
    }
    if (filterDateTo.value) {
      const expDate = new Date(exp.date)
      const toDate = new Date(filterDateTo.value)
      toDate.setHours(23, 59, 59, 999) // Fin de la journée
      if (expDate > toDate) return false
    }
    
    return true
  })
})

const hasActiveFilters = computed(() => {
  return filterType.value !== '' || 
         filterCategory.value !== '' || 
         filterTitle.value !== '' || 
         filterWithoutCategory.value ||
         filterDateRangeType.value !== 'all'
})

function resetFilters() {
  filterType.value = ''
  filterCategory.value = ''
  filterTitle.value = ''
  filterWithoutCategory.value = false
  filterDateRangeType.value = 'all'
  filterDateFrom.value = ''
  filterDateTo.value = ''
}

async function loadInitial() {
  isLoading.value = true
  try {
    const [expensesRes, userRes, catsRes] = await Promise.allSettled([
      api(`/api/user/expenses?limit=${LIMIT}&offset=0`),
      api('/api/user'),
      api('/api/categories'),
    ])

    if (expensesRes.status === 'fulfilled') {
      expenses.value = expensesRes.value.data ?? []
      total.value    = expensesRes.value.total ?? 0
      hasMore.value  = expensesRes.value.hasMore ?? false
      offset.value   = expenses.value.length

      while (hasMore.value) {
        const page = await api(`/api/user/expenses?limit=${LIMIT}&offset=${offset.value}`)
        expenses.value.push(...(page.data ?? []))
        offset.value += page.data?.length ?? 0
        hasMore.value = page.hasMore ?? false
      }
    }

    if (userRes.status === 'fulfilled') {
      const cur = userRes.value.settings?.currency || 'EUR'
      currency.value = { EUR:'€', USD:'$', GBP:'£', JPY:'¥', CHF:'CHF', AUD:'A$' }[cur] || cur
    }

    if (catsRes.status === 'fulfilled') {
      categories.value = catsRes.value ?? []
    }
  } finally {
    isLoading.value = false
    await nextTick()
    setupIntersection()
  }
}

function setupIntersection() {
  if (sentinel) return
  sentinel = document.querySelector('#home-scroll-sentinel')
  if (!sentinel) return

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && hasMore.value && !isLoadingMore.value) {
      loadMore()
    }
  }, { threshold: 0.2 })

  observer.observe(sentinel)
}

async function loadMore() {
  if (!hasMore.value || isLoadingMore.value) return
  isLoadingMore.value = true
  try {
    const res = await api(`/api/user/expenses?limit=${LIMIT}&offset=${offset.value}`)
    expenses.value.push(...(res.data ?? []))
    total.value  = res.total ?? total.value
    hasMore.value= res.hasMore ?? false
    offset.value += res.data?.length ?? 0
  } finally {
    isLoadingMore.value = false
  }
}

const VALID_RECURRENCES = ['daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'yearly']
const RECURRENCE_FR_TO_CODE = {
  'Quotidienne': 'daily',
  'Hebdomadaire': 'weekly',
  'Une semaine sur deux': 'biweekly',
  'Mensuelle': 'monthly',
  'Un mois sur deux': 'bimonthly',
  'Annuelle': 'yearly',
}

function getCategoryPath(cat) {
  if (!cat) return ''
  if (!cat.parentId) return cat.name
  const parent = categories.value.find(c => c.id === cat.parentId)
  return parent ? `${parent.name} > ${cat.name}` : cat.name
}

function getCategoryLineage(cat) {
  if (!cat) return []
  const parent = categories.value.find(c => c.id === cat.parentId)
  return parent ? [parent, cat] : [cat]
}

function categoryMatchesFilter(expCategory, filterId) {
  if (!filterId) return true
  if (!expCategory) return false
  if (expCategory.id === filterId) return true
  let current = categories.value.find(c => c.id === expCategory.parentId)
  while (current) {
    if (current.id === filterId) return true
    current = categories.value.find(c => c.id === current.parentId)
  }
  return false
}

function normalizeRecurrence(val) {
  if (!val) return ''
  if (VALID_RECURRENCES.includes(val)) return val
  return RECURRENCE_FR_TO_CODE[val] ?? ''
}

function openEditModal(expense) {
  editingExpense.value = expense
  editForm.value = {
    title: expense.title,
    amount: expense.amount.toString(),
    date: expense.date,
    type: expense.type || 'expense',
    categoryId: expense.category?.id ?? '',
    isRecurring: expense.isRecurring,
    recurrence: normalizeRecurrence(expense.recurrence),
  }
}

function closeEditModal() {
  editingExpense.value = null
  editForm.value = {
    title: '', amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense', categoryId: '', isRecurring: false, recurrence: '',
  }
}

async function updateExpense() {
  if (!editingExpense.value) return
  if (!editForm.value.title.trim()) {
    appStore.notify({ type: 'error', message: 'Le nom est requis' })
    return
  }
  const amount = parseFloat(editForm.value.amount)
  if (Number.isNaN(amount) || amount <= 0) {
    appStore.notify({ type: 'error', message: 'Montant invalide' })
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      title: editForm.value.title.trim(),
      amount,
      date: editForm.value.date,
      type: editForm.value.type,
      categoryId: editForm.value.categoryId || undefined,
      isRecurring: editForm.value.isRecurring,
      recurrence: (editForm.value.isRecurring && editForm.value.recurrence) ? editForm.value.recurrence : undefined,
    }
    const updated = await api(`/api/user/expenses/${editingExpense.value.id}`, { method: 'PUT', body: payload })
    const idx = expenses.value.findIndex(e => e.id === editingExpense.value.id)
    if (idx >= 0) expenses.value[idx] = updated
    appStore.notify({ type: 'success', message: 'Opération mise à jour' })
    closeEditModal()
  } catch (e) {
    appStore.notify({ type: 'error', message: e.message || 'Erreur lors de la mise à jour' })
  } finally {
    isSubmitting.value = false
  }
}

async function deleteExpense() {
  if (!editingExpense.value) return
  showDeleteConfirmation.value = true
}

async function confirmDelete() {
  if (!editingExpense.value) return
  
  isDeleting.value = true
  try {
    await api(`/api/user/expenses/${editingExpense.value.id}`, { method: 'DELETE' })
    expenses.value = expenses.value.filter(e => e.id !== editingExpense.value.id)
    total.value = Math.max(0, total.value - 1)
    appStore.notify({ type: 'success', message: 'Opération supprimée' })
    closeEditModal()
    showDeleteConfirmation.value = false
  } catch (e) {
    appStore.notify({ type: 'error', message: e.message || 'Erreur lors de la suppression' })
  } finally {
    isDeleting.value = false
  }
}

function closeDeleteConfirmation() {
  showDeleteConfirmation.value = false
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getOperationColor(expense) {
  return expense.type === 'credit' ? 'var(--color-success)' : 'var(--color-danger)'
}

const loadedCount = computed(() => expenses.value.length)

onMounted(loadInitial)
</script>

<template>
  <div class="home-page">
    <!-- Barre de filtres -->
    <Transition name="modal-fade">
      <div v-if="showFiltersModal" class="modal-overlay" @click.self="showFiltersModal = false">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal__header">
            <BaseText weight="semibold" size="lg">Filtres</BaseText>
            <button class="icon-btn" @click="showFiltersModal = false" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          
          <div class="modal__body filters-modal-content">
            <!-- Type -->
            <div class="filter-group">
              <label class="filter-label">Type d'opération</label>
              <div class="filter-toggles">
                <button 
                  @click="filterType = filterType === 'expense' ? '' : 'expense'"
                  :class="['filter-toggle', { active: filterType === 'expense' }]"
                >
                  Dépense
                </button>
                <button 
                  @click="filterType = filterType === 'credit' ? '' : 'credit'"
                  :class="['filter-toggle', { active: filterType === 'credit' }]"
                >
                  Crédit
                </button>
              </div>
            </div>

            <!-- Catégorie -->
            <div class="filter-group">
              <label class="filter-label">Catégorie</label>
              <select v-model="filterCategory" class="filter-select">
                <option value="">Toutes les catégories</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <!-- Titre -->
            <div class="filter-group">
              <label class="filter-label">Libellé</label>
              <input
                v-model="filterTitle"
                type="text"
                placeholder="Rechercher..."
                class="filter-input"
              />
            </div>

            <!-- Sans catégorie -->
            <div class="filter-group">
              <label class="filter-label">
                <input 
                  v-model="filterWithoutCategory" 
                  type="checkbox"
                  class="checkbox-input"
                />
                <span>Opérations sans catégorie</span>
              </label>
            </div>

            <!-- Plage de dates -->
            <div class="filter-group">
              <label class="filter-label">Période</label>
              <div class="filter-date-presets">
                <button 
                  @click="filterDateRangeType = 'all'"
                  :class="['preset-btn', { active: filterDateRangeType === 'all' }]"
                >
                  Toutes
                </button>
                <button 
                  @click="filterDateRangeType = 'week'"
                  :class="['preset-btn', { active: filterDateRangeType === 'week' }]"
                >
                  7 jours
                </button>
                <button 
                  @click="filterDateRangeType = 'month'"
                  :class="['preset-btn', { active: filterDateRangeType === 'month' }]"
                >
                  30 jours
                </button>
                <button 
                  @click="filterDateRangeType = 'custom'"
                  :class="['preset-btn', { active: filterDateRangeType === 'custom' }]"
                >
                  Personnalisé
                </button>
              </div>

              <div v-if="filterDateRangeType === 'custom'" class="filter-date-range">
                <input
                  v-model="filterDateFrom"
                  type="date"
                  class="filter-date"
                />
                <span class="date-separator">→</span>
                <input
                  v-model="filterDateTo"
                  type="date"
                  class="filter-date"
                />
              </div>
            </div>

            <!-- Actions -->
            <div class="filter-actions">
              <button 
                v-if="filterType || filterCategory || filterTitle || filterDateRangeType !== 'all'"
                @click="resetFilters"
                class="btn-reset"
              >
                Réinitialiser
              </button>
              <BaseButton @click="showFiltersModal = false" size="sm" :full="true">
                Appliquer
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <div class="home-page__hero">
      <div class="home-page__hero-text">
        <BaseText as="h1" size="3xl" weight="bold">Accueil</BaseText>
        <BaseText as="p" color="secondary" size="sm">
          {{ total > 0 ? `${filteredExpenses.length} / ${total} opération${total > 1 ? 's' : ''}` : 'Aucune opération' }}
        </BaseText>
      </div>

      <div class="home-page__actions">
        <div class="home-page__filter-controls">
          <button @click="showFiltersModal = true" class="btn-filter-icon" title="Filtrer">
            <BaseIcon name="settings" :size="20" />
          </button>
          <button 
            v-if="expenses.some(e => !e.category)"
            @click="filterWithoutCategory = !filterWithoutCategory"
            class="btn-filter-shortcut"
            :class="{ active: filterWithoutCategory }"
            title="Opérations sans catégorie"
          >
            <i class="ri-shape-line"></i>
          </button>
          <Transition name="scale-fade">
            <button 
              v-if="hasActiveFilters"
              @click="resetFilters"
              class="btn-reset-filters"
              title="Réinitialiser les filtres"
            >
              <i class="ri-filter-off-line"></i>
            </button>
          </Transition>
        </div>

        <div class="home-page__summary">
          <BaseButton variant="ghost" size="sm" @click="router.push({ name: 'operations' })">
            <BaseIcon name="plus" :size="16" />
            Ajouter une opération
          </BaseButton>
        </div>
      </div>
    </div>

    <div class="home-page__list">
      <div v-if="isLoading" class="home-page__loader">
        <BaseLoader size="lg" />
      </div>

      <div v-else-if="filteredExpenses.length === 0" class="home-page__empty">
        <BaseText color="secondary">{{ expenses.length === 0 ? 'Aucune opération trouvée pour le moment.' : 'Aucune opération ne correspond aux filtres.' }}</BaseText>
      </div>

      <div v-else class="home-page__expenses">
        <button
          v-for="expense in filteredExpenses"
          :key="expense.id"
          class="expense-card"
          @click="openEditModal(expense)"
        >
          <div class="expense-card__main">
            <div>
              <BaseText weight="semibold">{{ expense.title }}</BaseText>
              <div class="expense-card__meta">
                <span>{{ formatDate(expense.date) }}</span>
              </div>
            </div>
            <div class="expense-card__amount" :style="{ color: getOperationColor(expense) }">
              {{ expense.type === 'credit' ? '+' : '-' }}{{ expense.amount.toFixed(2) }} {{ currency }}
            </div>
          </div>
          <div class="expense-card__tag-row">
            <span
              v-for="catTag in getCategoryLineage(expense.category)"
              :key="catTag.id"
              class="expense-card__tag expense-card__tag--category"
              :style="{ backgroundColor: catTag.color ? `${catTag.color}20` : undefined, borderColor: catTag.color || undefined, color: catTag.color || undefined }"
            >
              {{ catTag.name }}
            </span>
            <span v-if="expense.isRecurring" class="expense-card__tag">↻ {{ expense.recurrenceLabel }}</span>
            <span v-if="expense.description" class="expense-card__note">{{ expense.description }}</span>
          </div>
        </button>

        <div id="home-scroll-sentinel" class="home-page__sentinel">
          <BaseLoader v-if="isLoadingMore" size="sm" />
          <BaseText v-else-if="!hasMore && total > LIMIT" size="xs" color="secondary">
            — Toutes les opérations sont chargées —
          </BaseText>
        </div>
      </div>
    </div>

    <!-- Modal d'édition -->
    <Transition name="modal-fade">
      <div v-if="editingExpense" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal__header">
            <BaseText weight="semibold" size="lg">Modifier l'opération</BaseText>
            <button class="icon-btn" @click="closeEditModal" type="button">
              <BaseIcon name="close" :size="20" />
            </button>
          </div>
          <form @submit.prevent="updateExpense" class="modal__body">
            <div class="form-grid">
              <BaseInput v-model="editForm.title" label="Nom" placeholder="Ex: Courses supermarché" required />
              <BaseStepper
                v-model="editForm.amount"
                label="Montant"
                required
                placeholder="0,00"
                :hint="`Montant minimal 0,01`"
                :min="0.01"
                :max="1000000"
                :step="1"
              />
              <div class="form-group">
                <label class="form-label">Type</label>
                <select v-model="editForm.type" class="form-select" required>
                  <option value="expense">Dépense</option>
                  <option value="credit">Crédit</option>
                </select>
              </div>
              <BaseInput v-model="editForm.date" label="Date" type="date" required />
              <div class="form-group form-col-span">
                <label class="form-label">Catégorie</label>
                <select v-model="editForm.categoryId" class="form-select">
                  <option value="">Sans catégorie</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>
              <div class="form-row form-col-span">
                <label class="checkbox-label">
                  <input v-model="editForm.isRecurring" type="checkbox" />
                  <span>Permanente</span>
                </label>
                <div v-if="editForm.isRecurring" class="form-group">
                  <select v-model="editForm.recurrence" class="form-select" required>
                    <option value="">Choisir un rythme</option>
                    <option value="daily">Quotidienne</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="biweekly">Une semaine sur deux</option>
                    <option value="monthly">Mensuelle</option>
                    <option value="bimonthly">Un mois sur deux</option>
                    <option value="yearly">Annuelle</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
          <div class="modal__footer">
            <BaseButton variant="ghost" size="sm" @click="closeEditModal">Annuler</BaseButton>
            <BaseButton variant="danger" size="sm" :loading="isDeleting" @click="deleteExpense">
              <BaseIcon name="trash" :size="14" />
              Supprimer
            </BaseButton>
            <BaseButton variant="primary" size="sm" :loading="isSubmitting" @click="updateExpense">
              <BaseIcon name="check" :size="14" />
              Enregistrer
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal de confirmation de suppression -->
    <Transition name="modal-fade">
      <div v-if="showDeleteConfirmation && editingExpense" class="modal-overlay" @click.self="closeDeleteConfirmation">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal__header">
            <BaseText weight="semibold" size="lg">Confirmer la suppression</BaseText>
            <button class="icon-btn" @click="closeDeleteConfirmation" type="button">
              <BaseIcon name="close" :size="20" />
            </button>
          </div>
          <div class="modal__body">
            <BaseText color="secondary">
              Êtes-vous sûr de vouloir supprimer l'opération "<strong>{{ editingExpense.title }}</strong>" ? Cette action est irréversible.
            </BaseText>
          </div>
          <div class="modal__footer">
            <BaseButton variant="ghost" size="sm" @click="closeDeleteConfirmation">Annuler</BaseButton>
            <BaseButton variant="danger" size="sm" :loading="isDeleting" @click="confirmDelete">
              <BaseIcon name="trash" :size="14" />
              Supprimer définitivement
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
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
  font-size: var(--text-sm); font-family: inherit;
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

/* ─── FILTRES ─────────────────────────────────────────── */
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
  background: var(--color-background);
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
  background: var(--color-background);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.filter-date {
  flex: 1;
  border: none;
  padding: var(--space-2);
  min-width: 120px;
  background: transparent;
}

.filter-date:focus {
  box-shadow: none;
}

.date-range-separator {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  padding: 0 var(--space-1);
}

/* ─── FILTRES MODAL ────────────────────────────────── */
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

/* Contenu de la modale de filtres */
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

/* ─── FILTER CONTROLS ──────────────────────────────────── */
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

/* ─── TRANSITIONS ──────────────────────────────────────── */
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
