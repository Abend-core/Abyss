import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'
import { useAppStore } from '@/stores/app.store.js'

export function useExpensesPage() {
  const router = useRouter()
  const { api } = useApi()
  const appStore = useAppStore()

  // ── État ──────────────────────────────────────────
  const expenses = ref([])
  const categories = ref([])
  const currency = ref('€')
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const hasMore = ref(false)
  const offset = ref(0)
  const pageSize = 3

  // ── Formulaire ────────────────────────────────────
  const showForm = ref(true)
  const isSubmitting = ref(false)
  const form = ref({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    categoryId: '',
    isRecurring: false,
    recurrence: '',
    description: '',
  })

  watch(() => form.value.isRecurring, (isRecurring) => {
    if (isRecurring && !form.value.recurrence) {
      form.value.recurrence = 'daily'
    }
  })

  // ── Modal détail ──────────────────────────────────
  const selected = ref(null)
  const isDeleting = ref(false)
  const editingExpense = ref(null)
  const showDeleteConfirmation = ref(false)
  const pendingDeleteExpense = ref(null)

  // ── Chargement initial ────────────────────────────
  async function fetchExpenses(offsetValue = 0, limit = pageSize) {
    const res = await api(`/api/user/expenses?offset=${offsetValue}&limit=${limit}`)
    if (!res?.data) return null
    return {
      data: res.data,
      hasMore: res.hasMore ?? false,
      count: Array.isArray(res.data) ? res.data.length : 0,
    }
  }

  async function loadInitial() {
    isLoading.value = true
    offset.value = 0
    hasMore.value = false
    try {
      const [expensesRes, catsRes, userRes] = await Promise.allSettled([
        fetchExpenses(0, pageSize),
        api('/api/categories'),
        api('/api/user'),
      ])
      if (expensesRes.status === 'fulfilled' && expensesRes.value) {
        expenses.value = expensesRes.value.data
        offset.value = expensesRes.value.count
        hasMore.value = expensesRes.value.hasMore
      }
      if (catsRes.status === 'fulfilled') categories.value = catsRes.value ?? []
      if (userRes.status === 'fulfilled') {
        const cur = userRes.value.settings?.currency || 'EUR'
        currency.value = { EUR: '€', USD: '$', GBP: '£', JPY: '¥', CHF: 'CHF', AUD: 'A$' }[cur] || cur
      }
    } finally {
      isLoading.value = false
      await nextTick()
    }
  }

  // ── Charger plus de dépenses ──────────────────────
  async function loadMoreExpenses() {
    if (isLoadingMore.value || !hasMore.value) return

    isLoadingMore.value = true
    try {
      const res = await fetchExpenses(offset.value, pageSize)
      if (res?.data) {
        expenses.value.push(...res.data)
        hasMore.value = res.hasMore
        offset.value += res.count
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

  async function fillAfterDeletion() {
    try {
      const res = await fetchExpenses(offset.value, pageSize - expenses.value.length)
      if (res?.data?.length) {
        expenses.value.push(...res.data)
        offset.value += res.count
        hasMore.value = res.hasMore
      } else {
        hasMore.value = false
      }
    } catch (e) {
      console.error('Erreur restauration après suppression :', e)
      hasMore.value = false
    }
  }

  // ── Créer une opération ───────────────────────────
  async function createExpense() {
    const amount = parseFloat(form.value.amount)
    if (!form.value.title.trim()) {
      appStore.notify({ type: 'error', message: 'Le nom est requis' })
      return
    }
    if (Number.isNaN(amount) || amount <= 0) {
      appStore.notify({ type: 'error', message: 'Montant invalide. Saisissez une valeur supérieure à 0.' })
      return
    }
    if (form.value.isRecurring && !form.value.recurrence) {
      appStore.notify({ type: 'error', message: 'Choisissez un rythme' })
      return
    }

    isSubmitting.value = true
    try {
      const payload = {
        title: form.value.title.trim(),
        amount,
        date: form.value.date,
        categoryId: form.value.categoryId || undefined,
        isRecurring: form.value.isRecurring,
        recurrence: form.value.isRecurring ? form.value.recurrence : undefined,
        description: form.value.description?.trim() || undefined,
        type: form.value.type,
      }

      const result = await api('/api/user/expenses', { method: 'POST', body: payload })
      expenses.value.unshift(result)
      expenses.value = expenses.value.slice(0, pageSize)

      appStore.notify({
        type: 'success',
        message: form.value.isRecurring
          ? 'Opération créée. Une règle de dépense récurrente a été enregistrée.'
          : 'Opération ajoutée !',
      })
      form.value = {
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        categoryId: '',
        isRecurring: false,
        recurrence: '',
        description: '',
      }
    } catch (e) {
      appStore.notify({ type: 'error', message: e.message || 'Erreur lors de la création' })
    } finally {
      isSubmitting.value = false
    }
  }

  async function updateExpense(updatedExpense = null) {
    const expenseToUpdate = updatedExpense || editingExpense.value
    if (!expenseToUpdate) return

    const amount = parseFloat(updatedExpense?.amount ?? form.value.amount)
    const title = (updatedExpense?.title ?? form.value.title).trim()
    const date = updatedExpense?.date || form.value.date
    const type = updatedExpense?.type || form.value.type
    const description = updatedExpense?.description?.trim() || form.value.description?.trim() || undefined
    const categoryId = updatedExpense?.categoryId || editingExpense.value?.category?.id || selected.value?.category?.id || form.value.categoryId || undefined

    if (!title) {
      appStore.notify({ type: 'error', message: 'Le nom est requis' })
      return
    }
    if (Number.isNaN(amount) || amount <= 0) {
      appStore.notify({ type: 'error', message: 'Montant invalide. Saisissez une valeur supérieure à 0.' })
      return
    }

    isSubmitting.value = true
    try {
      const payload = {
        title,
        amount,
        date,
        categoryId,
        type,
        description,
      }

      const updated = await api(`/api/user/expenses/${expenseToUpdate.id}`, {
        method: 'PUT',
        body: payload,
      })

      const idx = expenses.value.findIndex(e => e.id === expenseToUpdate.id)
      if (idx >= 0) expenses.value[idx] = updated
      selected.value = updated

      if (!updatedExpense) {
        editingExpense.value = null
        showForm.value = false
        form.value = {
          title: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          type: 'expense',
          categoryId: '',
          isRecurring: false,
          recurrence: '',
          description: '',
        }
      }

      appStore.notify({ type: 'success', message: 'Opération modifiée !' })
    } catch (e) {
      appStore.notify({ type: 'error', message: e.message || 'Erreur lors de la mise à jour' })
    } finally {
      isSubmitting.value = false
    }
  }

  async function submitExpense() {
    if (editingExpense.value) {
      await updateExpense()
    } else {
      await createExpense()
    }
  }

  // ── Supprimer une opération ───────────────────────
  function requestDeleteExpense(expense) {
    pendingDeleteExpense.value = expense
    showDeleteConfirmation.value = true
  }

  async function confirmDeleteExpense() {
    const expense = pendingDeleteExpense.value
    if (!expense) return

    isDeleting.value = true
    try {
      await api(`/api/user/expenses/${expense.id}`, { method: 'DELETE' })
      expenses.value = expenses.value.filter(e => e.id !== expense.id)
      selected.value = null
      pendingDeleteExpense.value = null
      showDeleteConfirmation.value = false
      appStore.notify({ type: 'success', message: 'Opération supprimée' })

      if (expenses.value.length < pageSize && hasMore.value) {
        await fillAfterDeletion()
      }
    } catch {
      appStore.notify({ type: 'error', message: 'Erreur lors de la suppression' })
    } finally {
      isDeleting.value = false
    }
  }

  function closeDeleteConfirmation() {
    showDeleteConfirmation.value = false
    pendingDeleteExpense.value = null
  }

  // ── Helpers ───────────────────────────────────────
  const categoriesMap = computed(() => {
    const m = new Map()
    categories.value.forEach(c => m.set(c.id, c))
    return m
  })

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

  function getCategoryColor(expense) {
    if (!expense.category) return 'var(--color-warning)'
    return expense.category.color || 'var(--color-warning)'
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function getOperationColor(expense) {
    return expense.type === 'credit' ? 'var(--color-success)' : 'var(--color-danger)'
  }

  function openDetail(expense) {
    selected.value = expense
  }

  function openEdit(expense) {
    editingExpense.value = expense
    showForm.value = true
    selected.value = null
    form.value = {
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      type: expense.type || 'expense',
      categoryId: expense.category?.id || '',
      isRecurring: expense.isRecurring,
      recurrence: expense.recurrence || '',
      description: expense.description || '',
    }
  }

  function closeDetail() {
    selected.value = null
  }

  // ── Scroll infinie ────────────────────────────────
  function handleScroll() {
    const scrollElement = document.querySelector('.expenses-list')
    if (!scrollElement) return

    const { scrollTop, scrollHeight, clientHeight } = scrollElement
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200

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

  return {
    // État
    expenses,
    categories,
    currency,
    isLoading,
    isLoadingMore,
    hasMore,
    offset,
    pageSize,

    // Formulaire
    showForm,
    isSubmitting,
    form,
    editingExpense,

    // Modal
    selected,
    isDeleting,
    showDeleteConfirmation,
    pendingDeleteExpense,

    // Fonctions
    loadInitial,
    loadMoreExpenses,
    submitExpense,
    createExpense,
    updateExpense,
    requestDeleteExpense,
    confirmDeleteExpense,
    closeDeleteConfirmation,
    openDetail,
    openEdit,
    closeDetail,

    // Helpers
    categoriesMap,
    getCategoryPath,
    getCategoryLineage,
    getCategoryTagStyle,
    getCategoryColor,
    formatDate,
    getOperationColor,
  }
}
