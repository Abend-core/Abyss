import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'
import { useAppStore } from '@/stores/app.store.js'
import { generateRecurrenceDates } from '@/utils/recurrence.js'

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
  const hasMore = ref(true)
  const offset = ref(0)
  const pageSize = 15

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
  })

  watch(() => form.value.isRecurring, (isRecurring) => {
    if (isRecurring && !form.value.recurrence) {
      form.value.recurrence = 'daily'
    }
  })

  // ── Modal détail ──────────────────────────────────
  const selected = ref(null)
  const isDeleting = ref(false)

  // ── Chargement initial ────────────────────────────
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
      const base = {
        title: form.value.title.trim(),
        amount,
        date: form.value.date,
        categoryId: form.value.categoryId || undefined,
        isRecurring: form.value.isRecurring,
        recurrence: form.value.isRecurring ? form.value.recurrence : undefined,
      }
      const payloads = [{ ...base, type: form.value.type }]
      if (form.value.isRecurring && form.value.recurrence) {
        generateRecurrenceDates(form.value.date, form.value.recurrence, 12).forEach(date => {
          payloads.push({
            ...base,
            date,
            isRecurring: false,
            recurrence: null,
            type: form.value.type,
          })
        })
      }

      const results = []
      for (const p of payloads) {
        results.push(await api('/api/user/expenses', { method: 'POST', body: p }))
      }

      expenses.value.unshift(results[0])
      expenses.value = expenses.value.slice(0, pageSize)

      appStore.notify({
        type: 'success',
        message: form.value.isRecurring
          ? `Opération créée + ${results.length - 1} occurrences`
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
      }
    } catch (e) {
      appStore.notify({ type: 'error', message: e.message || 'Erreur lors de la création' })
    } finally {
      isSubmitting.value = false
    }
  }

  // ── Supprimer une opération ───────────────────────
  async function deleteExpense(expense) {
    if (!confirm(`Supprimer "${expense.title}" ?`)) return
    isDeleting.value = true
    try {
      await api(`/api/user/expenses/${expense.id}`, { method: 'DELETE' })
      expenses.value = expenses.value.filter(e => e.id !== expense.id)
      selected.value = null
      appStore.notify({ type: 'success', message: 'Opération supprimée' })
    } catch {
      appStore.notify({ type: 'error', message: 'Erreur lors de la suppression' })
    } finally {
      isDeleting.value = false
    }
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

    // Modal
    selected,
    isDeleting,

    // Fonctions
    loadInitial,
    loadMoreExpenses,
    createExpense,
    deleteExpense,
    openDetail,
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
