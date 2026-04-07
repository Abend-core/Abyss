<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'
import { useAppStore } from '@/stores/app.store.js'
import { generateRecurrenceDates } from '@/utils/recurrence.js'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseStepper from '@/components/atoms/BaseStepper.vue'
import BaseText from '@/components/atoms/BaseText.vue'
import BaseLoader from '@/components/atoms/BaseLoader.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'

const router = useRouter()
const { api } = useApi()
const appStore = useAppStore()

// ── État ─────────────────────────────────────────────────
const expenses      = ref([])
const categories    = ref([])
const currency      = ref('€')
const isLoading     = ref(false)
const isLoadingMore = ref(false)
const hasMore       = ref(true)
const offset        = ref(0)
const pageSize      = 15

// ── Formulaire ───────────────────────────────────────────
const showForm    = ref(true)
const isSubmitting= ref(false)
const form        = ref({
  title: '', amount: '',
  date: new Date().toISOString().split('T')[0],
  type: 'expense', categoryId: '', isRecurring: false, recurrence: '',
})

watch(() => form.value.isRecurring, (isRecurring) => {
  if (isRecurring && !form.value.recurrence) {
    form.value.recurrence = 'daily'
  }
})

// ── Modal détail ─────────────────────────────────────────
const selected  = ref(null)
const isDeleting= ref(false)

// ── Chargement initial ───────────────────────────────────
async function loadInitial() {
  isLoading.value = true
  offset.value = 0
  hasMore.value = true
  try {
    const [expensesRes, catsRes, userRes] = await Promise.allSettled([
      api(`/api/user/expenses?offset=${offset.value}&limit=${pageSize}`),
      api('/api/categories'),
      api('/api/user'),
    ])
    if (expensesRes.status === 'fulfilled') {
      expenses.value = expensesRes.value?.data ?? []
      hasMore.value = expensesRes.value?.hasMore ?? false
      offset.value += pageSize
    }
    if (catsRes.status === 'fulfilled') categories.value = catsRes.value ?? []
    if (userRes.status === 'fulfilled') {
      const cur = userRes.value.settings?.currency || 'EUR'
      currency.value = { EUR:'€', USD:'$', GBP:'£', JPY:'¥', CHF:'CHF', AUD:'A$' }[cur] || cur
    }
  } finally {
    isLoading.value = false
    await nextTick()
  }
}

// ── Charger plus de dépenses ─────────────────────────────
async function loadMoreExpenses() {
  if (isLoadingMore.value || !hasMore.value) return
  
  isLoadingMore.value = true
  try {
    const res = await api(`/api/user/expenses?offset=${offset.value}&limit=${pageSize}`)
    if (res?.data) {
      expenses.value.push(...res.data)
      hasMore.value = res.hasMore ?? false
      offset.value += pageSize
    } else {
      hasMore.value = false
    }
  } catch (e) {
    console.error('Erreur chargement dépenses:', e)
    hasMore.value = false
  } finally {
    isLoadingMore.value = false
  }
}
async function createExpense() {
  const amount = parseFloat(form.value.amount)
  if (!form.value.title.trim()) { appStore.notify({ type:'error', message:'Le nom est requis' }); return }
  if (Number.isNaN(amount) || amount <= 0) {
    appStore.notify({ type:'error', message:'Montant invalide. Saisissez une valeur supérieure à 0.' });
    return
  }
  if (form.value.isRecurring && !form.value.recurrence) {
    appStore.notify({ type:'error', message:'Choisissez un rythme' }); return
  }
  isSubmitting.value = true
  try {
    const base = {
      title: form.value.title.trim(), amount,
      date: form.value.date,
      categoryId: form.value.categoryId || undefined,
      isRecurring: form.value.isRecurring,
      recurrence:  form.value.isRecurring ? form.value.recurrence : undefined,
    }
    const payloads = [{ ...base, type: form.value.type }]
    if (form.value.isRecurring && form.value.recurrence) {
      generateRecurrenceDates(form.value.date, form.value.recurrence, 12).forEach(date => {
        payloads.push({ ...base, date, isRecurring: false, recurrence: null, type: form.value.type })
      })
    }
    const results = []
    for (const p of payloads) results.push(await api('/api/user/expenses', { method:'POST', body:p }))

    expenses.value.unshift(results[0])
    expenses.value = expenses.value.slice(0, pageSize)

    appStore.notify({
      type: 'success',
      message: form.value.isRecurring
        ? `Opération créée + ${results.length - 1} occurrences`
        : 'Opération ajoutée !',
    })
    form.value = { title:'', amount:'', date:new Date().toISOString().split('T')[0], type:'expense', categoryId:'', isRecurring:false, recurrence:'' }
  } catch (e) {
    appStore.notify({ type:'error', message: e.message || 'Erreur lors de la création' })
  } finally {
    isSubmitting.value = false
  }
}

// ── Supprimer une opération ────────────────────────────────
async function deleteExpense(expense) {
  if (!confirm(`Supprimer "${expense.title}" ?`)) return
  isDeleting.value = true
  try {
    await api(`/api/user/expenses/${expense.id}`, { method:'DELETE' })
    expenses.value = expenses.value.filter(e => e.id !== expense.id)
    selected.value = null
    appStore.notify({ type:'success', message:'Opération supprimée' })
  } catch {
    appStore.notify({ type:'error', message:'Erreur lors de la suppression' })
  } finally {
    isDeleting.value = false
  }
}

// ── Helpers ──────────────────────────────────────────────
function openDetail(expense) { selected.value = expense }
function closeDetail()       { selected.value = null }

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

function getCategoryTagStyle(cat) {
  if (!cat) return {}
  const color = cat.color || 'var(--color-warning)'
  return {
    backgroundColor: cat.color ? `${cat.color}20` : 'var(--color-warning-subtle)',
    borderColor: cat.color || 'transparent',
    color,
  }
}

const categoriesMap = computed(() => {
  const m = new Map()
  categories.value.forEach(c => m.set(c.id, c))
  return m
})

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
}

function getOperationColor(expense) {
  return expense.type === 'credit' ? 'var(--color-success)' : 'var(--color-danger)'
}

// ── Scroll infinie ──────────────────────────────────────
function handleScroll() {
  const scrollElement = document.querySelector('.expenses-list')
  if (!scrollElement) return
  
  const { scrollTop, scrollHeight, clientHeight } = scrollElement
  const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200 // 200px avant la fin
  
  if (isNearBottom && !isLoadingMore.value && hasMore.value) {
    loadMoreExpenses()
  }
}

function setupScrollListener() {
  const scrollElement = document.querySelector('.expenses-list')
  if (scrollElement) {
    scrollElement.addEventListener('scroll', handleScroll)
  }
}

function cleanupScrollListener() {
  const scrollElement = document.querySelector('.expenses-list')
  if (scrollElement) {
    scrollElement.removeEventListener('scroll', handleScroll)
  }
}

onMounted(async () => {
  await loadInitial()
  await nextTick()
  setupScrollListener()
})

onUnmounted(cleanupScrollListener)
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
    <Transition name="slide-down">
      <div v-if="showForm" class="form-card">
        <div class="form-card__title">
          <BaseText weight="semibold">Nouvelle opération</BaseText>
        </div>
        <form @submit.prevent="createExpense" class="form-grid">
          <BaseInput v-model="form.title" label="Nom" placeholder="Ex: Courses supermarché" required class="form-col-span" />
          <BaseStepper
            v-model="form.amount"
            label="Montant"
            required
            placeholder="0,00"
            :hint="`Montant minimal 1`"
            :min="1"
            :max="1000000"
            :step="1"
          />
          <BaseInput v-model="form.date" label="Date" type="date" required />
          <div class="form-group">
            <label class="form-label">Type</label>
            <select v-model="form.type" class="form-select" required>
              <option value="expense">Dépense</option>
              <option value="credit">Crédit</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Catégorie</label>
            <select v-model="form.categoryId" class="form-select">
              <option value="">Sans catégorie</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-row form-col-span">
            <label class="checkbox-label">
              <input v-model="form.isRecurring" type="checkbox" />
              <span>Permanente</span>
            </label>
            <div v-if="form.isRecurring" class="form-group">
              <select v-model="form.recurrence" class="form-select" required>
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="biweekly">Une semaine sur deux</option>
                <option value="monthly">Mensuelle</option>
                <option value="bimonthly">Un mois sur deux</option>
                <option value="yearly">Annuelle</option>
              </select>
            </div>
          </div>
          <BaseButton type="submit" class="form-col-span" :full="true" :loading="isSubmitting" :disabled="!form.title.trim() || !form.amount">
            Ajouter l'opération
          </BaseButton>
        </form>
      </div>
    </Transition>

    <!-- ── Liste ──────────────────────────────────── -->
    <div class="expenses-list">
      <div v-if="isLoading" class="state-center">
        <BaseLoader size="lg" />
      </div>

      <template v-else-if="expenses.length === 0">
        <div class="empty-state">
          <BaseIcon name="chart" :size="48" color="var(--color-text-muted)" />
          <BaseText color="secondary">Aucune opération pour le moment.</BaseText>
          <BaseButton variant="primary" size="sm" @click="showForm = true">
            <BaseIcon name="plus" :size="14" />
            Ajouter ma première opération
          </BaseButton>
        </div>
      </template>

      <template v-else>
        <button
          v-for="expense in expenses"
          :key="expense.id"
          class="expense-card"
          @click="openDetail(expense)"
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
              :style="getCategoryTagStyle(catTag)"
            >
              {{ catTag.name }}
            </span>
            <span v-if="expense.isRecurring" class="expense-card__tag">↻ {{ RECURRENCE_LABELS[expense.recurrence] ?? expense.recurrence }}</span>
            <span v-if="expense.description" class="expense-card__note">{{ expense.description }}</span>
          </div>
        </button>

        <div v-if="isLoadingMore" class="loading-more">
          <BaseLoader size="sm" />
          <BaseText size="xs" color="secondary">Chargement...</BaseText>
        </div>

        <div v-else-if="!hasMore && expenses.length > 0" class="history-note">
          <BaseText size="xs" color="secondary">
            Toutes les opérations sont affichées.
          </BaseText>
        </div>
      </template>
    </div>

    <!-- ── Modal détail ───────────────────────────── -->
    <Transition name="modal-fade">
      <div v-if="selected" class="modal-overlay" @click.self="closeDetail">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal__header">
            <BaseText weight="semibold" size="lg">Détail de l'opération</BaseText>
            <button class="icon-btn" @click="closeDetail" type="button">
              <BaseIcon name="close" :size="20" />
            </button>
          </div>
          <div class="modal__body">
            <div class="modal__amount">
              <span class="modal__amount-value" :style="{ color: getOperationColor(selected) }">
                {{ selected.type === 'credit' ? '+' : '-' }}{{ selected.amount.toFixed(2) }}
              </span>
              <span class="modal__amount-cur">{{ currency }}</span>
            </div>
            <dl class="modal__details">
              <div class="modal__row">
                <dt>Nom</dt>
                <dd>{{ selected.title }}</dd>
              </div>
              <div class="modal__row">
                <dt>Date</dt>
                <dd>{{ formatDate(selected.date) }}</dd>
              </div>
              <div class="modal__row">
                <dt>Type</dt>
                <dd>{{ selected.type === 'credit' ? 'Crédit' : 'Dépense' }}</dd>
              </div>
              <div v-if="selected.category" class="modal__row">
                <dt>Catégorie</dt>
                <dd>
                  <span class="modal__cat-dot" :style="{ background: getCategoryColor(selected) }" />
                  {{ getCategoryPath(selected.category) }}
                </dd>
              </div>
              <div v-if="selected.isRecurring" class="modal__row">
                <dt>Récurrence</dt>
                <dd>{{ selected.recurrence }}</dd>
              </div>
              <div v-if="selected.description" class="modal__row">
                <dt>Note</dt>
                <dd>{{ selected.description }}</dd>
              </div>
            </dl>
          </div>
          <div class="modal__footer">
            <BaseButton variant="ghost" size="sm" @click="closeDetail">Fermer</BaseButton>
            <BaseButton variant="danger" size="sm" :loading="isDeleting" @click="deleteExpense(selected)">
              <BaseIcon name="trash" :size="14" />
              Supprimer
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>

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
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-3); }
.page-header__text { display: flex; flex-direction: column; gap: var(--space-1); }

/* ── Icon button (close, etc.) ───────────────────── */
.icon-btn {
  background: none; border: none; cursor: pointer;
  color: var(--color-text-secondary); display: flex;
  padding: var(--space-1); border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}
.icon-btn:hover { color: var(--color-text-primary); }

/* ── Form card ───────────────────────────────────── */
.form-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}
.form-card__title {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: var(--space-4);
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.form-col-span { grid-column: 1 / -1; }
.form-group    { display: flex; flex-direction: column; gap: var(--space-2); }
.form-label    { font-size: var(--text-sm); font-weight: var(--font-medium); }
.form-row      { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.checkbox-label{ display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); cursor: pointer; }

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

/* ── Expense list ────────────────────────────────── */
.expenses-list { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-2);
  max-height: 70vh;
  overflow-y: auto;
}

/* ── Expense card ────────────────────────────────── */
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

.expense-card__note {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-style: italic;
  margin-left: auto;
}

.history-link {
  background: none;
  border: none;
  color: var(--color-primary);
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}
.history-link:hover {
  color: var(--color-primary-hover);
}

.history-note {
  padding-top: var(--space-3);
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  color: var(--color-text-secondary);
}

/* ── Modal ───────────────────────────────────────── */
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
  width: 100%; max-width: 480px; overflow: hidden;
}
@media (min-width: 640px) { .modal { border-radius: var(--radius-xl); } }

.modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.modal__body { padding: var(--space-4) var(--space-5); }

.modal__amount {
  display: flex; align-items: baseline; justify-content: center;
  gap: var(--space-2); padding: var(--space-5) 0;
}
.modal__amount-value { font-size: var(--text-3xl); font-weight: var(--font-bold); color: var(--color-danger); }
.modal__amount-cur   { font-size: var(--text-xl); color: var(--color-text-secondary); }

.modal__details {
  border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden;
}
.modal__row {
  display: flex; justify-content: space-between; align-items: center;
  gap: var(--space-4); padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.modal__row:last-child { border-bottom: none; }
.modal__row dt { font-size: var(--text-sm); color: var(--color-text-secondary); flex-shrink: 0; }
.modal__row dd { font-size: var(--text-sm); font-weight: var(--font-medium); text-align: right; display: flex; align-items: center; gap: var(--space-2); }
.modal__cat-dot { width: 0.6rem; height: 0.6rem; border-radius: 50%; flex-shrink: 0; }

.modal__footer {
  display: flex; gap: var(--space-3); justify-content: flex-end;
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
}

/* ── Transitions ─────────────────────────────────── */
.slide-down-enter-active, .slide-down-leave-active { transition: all var(--transition-normal); overflow: hidden; }
.slide-down-enter-from, .slide-down-leave-to       { opacity: 0; max-height: 0; transform: translateY(-8px); }
.slide-down-enter-to,   .slide-down-leave-from     { opacity: 1; max-height: 1200px; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity var(--transition-fast); }
.modal-fade-enter-from,  .modal-fade-leave-to      { opacity: 0; }
.modal-fade-enter-active .modal,
.modal-fade-leave-active .modal { transition: transform var(--transition-normal); }
.modal-fade-enter-from .modal,
.modal-fade-leave-to .modal { transform: translateY(24px); }

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
