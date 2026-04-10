import { reactive, ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'
import { useAppStore } from '@/stores/app.store.js'

const CURRENCY_SYMBOLS = {
  EUR: '€', USD: '$', GBP: '£', JPY: '¥', CHF: 'CHF', AUD: 'A$',
}

const RECURRENCE_FR_TO_CODE = {
  Quotidienne: 'daily',
  Hebdomadaire: 'weekly',
  'Une semaine sur deux': 'biweekly',
  Mensuelle: 'monthly',
  'Un mois sur deux': 'bimonthly',
  Annuelle: 'yearly',
}

const VALID_RECURRENCES = ['daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'yearly']

function getDateRangePreset(type, from = '', to = '') {
  const today = new Date()
  const start = new Date()

  switch (type) {
    case 'week':
      start.setDate(today.getDate() - 7)
      return { from: start.toISOString().split('T')[0], to: today.toISOString().split('T')[0] }
    case 'month':
      start.setMonth(today.getMonth() - 1)
      return { from: start.toISOString().split('T')[0], to: today.toISOString().split('T')[0] }
    case 'custom':
      return { from, to }
    default:
      return { from: '', to: '' }
  }
}

export function useHomePage() {
  const router = useRouter()
  const appStore = useAppStore()
  const { api } = useApi()

  const expenses = ref([])
  const categories = ref([])
  const total = ref(0)
  const offset = ref(0)
  const LIMIT = 15
  const currency = ref('€')
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const hasMore = ref(true)
  const filters = reactive({
    type: '',
    category: '',
    title: '',
    dateRangeType: 'all',
    dateFrom: '',
    dateTo: '',
    withoutCategory: false,
  })

  const editingExpense = ref(null)
  const editForm = reactive({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    categoryId: '',
    isRecurring: false,
    recurrence: '',
  })

  const isSubmitting = ref(false)
  const isDeleting = ref(false)
  const showFiltersModal = ref(false)
  const showDeleteConfirmation = ref(false)

  const hasActiveFilters = computed(() => {
    return filters.type !== '' ||
      filters.category !== '' ||
      filters.title !== '' ||
      filters.withoutCategory ||
      filters.dateRangeType !== 'all'
  })

  const hasUncategorized = computed(() => expenses.value.some(exp => !exp.category))

  const filteredExpenses = computed(() => {
    return expenses.value.filter(exp => {
      if (filters.type && exp.type !== filters.type) return false
      if (filters.withoutCategory) {
        if (exp.category) return false
      }
      if (filters.category) {
        if (!categoryMatchesFilter(exp.category, filters.category)) return false
      }
      if (filters.title) {
        const searchTerm = filters.title.toLowerCase()
        const titleMatch = exp.title.toLowerCase().includes(searchTerm)
        const descMatch = exp.description?.toLowerCase().includes(searchTerm) ?? false
        if (!titleMatch && !descMatch) return false
      }
      if (filters.dateFrom) {
        const expDate = new Date(exp.date)
        const fromDate = new Date(filters.dateFrom)
        if (expDate < fromDate) return false
      }
      if (filters.dateTo) {
        const expDate = new Date(exp.date)
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59, 999)
        if (expDate > toDate) return false
      }
      return true
    })
  })

  watch(() => filters.dateRangeType, newType => {
    if (newType !== 'custom') {
      const preset = getDateRangePreset(newType)
      filters.dateFrom = preset.from
      filters.dateTo = preset.to
    }
  })

  function resetFilters() {
    filters.type = ''
    filters.category = ''
    filters.title = ''
    filters.withoutCategory = false
    filters.dateRangeType = 'all'
    filters.dateFrom = ''
    filters.dateTo = ''
  }

  function setFilters(newFilters) {
    Object.assign(filters, newFilters)
  }

  function setEditForm(newForm) {
    Object.assign(editForm, newForm)
  }

  function normalizeRecurrence(val) {
    if (!val) return ''
    if (VALID_RECURRENCES.includes(val)) return val
    return RECURRENCE_FR_TO_CODE[val] ?? ''
  }

  function getCategoryLineage(category) {
    if (!category) return []
    const parent = categories.value.find(c => c.id === category.parentId)
    return parent ? [parent, category] : [category]
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

  function formatCurrency(value) {
    return `${Number(value).toFixed(2)} ${currency.value}`
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function getOperationColor(expense) {
    return expense.type === 'credit' ? 'var(--color-success)' : 'var(--color-danger)'
  }

  function openEditModal(expense) {
    editingExpense.value = expense
    Object.assign(editForm, {
      title: expense.title,
      amount: expense.amount.toString(),
      date: expense.date,
      type: expense.type || 'expense',
      categoryId: expense.category?.id ?? '',
      isRecurring: expense.isRecurring,
      recurrence: normalizeRecurrence(expense.recurrence),
    })
  }

  function closeEditModal() {
    editingExpense.value = null
    Object.assign(editForm, {
      title: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      categoryId: '',
      isRecurring: false,
      recurrence: '',
    })
  }

  async function updateExpense() {
    if (!editingExpense.value) return
    if (!editForm.title.trim()) {
      appStore.notify({ type: 'error', message: 'Le nom est requis' })
      return
    }

    const amount = parseFloat(editForm.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      appStore.notify({ type: 'error', message: 'Montant invalide' })
      return
    }

    isSubmitting.value = true
    try {
      const payload = {
        title: editForm.title.trim(),
        amount,
        date: editForm.date,
        type: editForm.type,
        categoryId: editForm.categoryId || undefined,
        isRecurring: editForm.isRecurring,
        recurrence: editForm.isRecurring && editForm.recurrence ? editForm.recurrence : undefined,
      }
      const updated = await api(`/api/user/expenses/${editingExpense.value.id}`, {
        method: 'PUT',
        body: payload,
      })
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

  function deleteExpense() {
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

  function goToOperations() {
    router.push({ name: 'operations' })
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
        total.value = expensesRes.value.total ?? 0
        hasMore.value = expensesRes.value.hasMore ?? false
        offset.value = expenses.value.length
      }

      if (userRes.status === 'fulfilled') {
        const cur = userRes.value.settings?.currency || 'EUR'
        currency.value = CURRENCY_SYMBOLS[cur] || cur
      }

      if (catsRes.status === 'fulfilled') {
        categories.value = catsRes.value ?? []
      }
    } finally {
      isLoading.value = false
      await nextTick()
    }
  }

  async function loadMore() {
    if (!hasMore.value || isLoadingMore.value) return
    isLoadingMore.value = true
    try {
      const res = await api(`/api/user/expenses?limit=${LIMIT}&offset=${offset.value}`)
      expenses.value.push(...(res.data ?? []))
      total.value = res.total ?? total.value
      hasMore.value = res.hasMore ?? false
      offset.value += res.data?.length ?? 0
    } finally {
      isLoadingMore.value = false
    }
  }

  onMounted(loadInitial)

  return {
    expenses,
    categories,
    total,
    currency,
    isLoading,
    isLoadingMore,
    hasMore,
    LIMIT,
    filters,
    filteredExpenses,
    hasActiveFilters,
    hasUncategorized,
    editingExpense,
    editForm,
    isSubmitting,
    isDeleting,
    showFiltersModal,
    showDeleteConfirmation,
    openEditModal,
    closeEditModal,
    updateExpense,
    deleteExpense,
    confirmDelete,
    closeDeleteConfirmation,
    resetFilters,
    setFilters,
    goToOperations,
    loadMore,
    formatDate,
    getOperationColor,
    getCategoryLineage,
  }
}
