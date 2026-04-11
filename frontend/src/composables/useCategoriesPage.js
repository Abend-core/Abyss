import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi.js'
import { useAppStore } from '@/stores/app.store.js'

export function useCategoriesPage() {
  const api = useApi()
  const appStore = useAppStore()

  // ── État ──────────────────────────────────────────
  const categories = ref([])
  const newCategory = ref('')
  const editingCategory = ref(null)
  const editForm = ref({ name: '', color: '' })

  // ── Tree builder ──────────────────────────────────
  function buildTree(list) {
    console.log('buildTree input:', list.map(c => ({ id: c.id, name: c.name, parentId: c.parentId })))
    
    // Supprimer les doublons par ID
    const uniqueList = list.filter((cat, index, arr) => 
      arr.findIndex(c => c.id === cat.id) === index
    )
    
    console.log('buildTree uniqueList:', uniqueList.map(c => ({ id: c.id, name: c.name, parentId: c.parentId })))
    
    const map = {}
    uniqueList.forEach(cat => {
      map[cat.id] = { ...cat, children: [] }
    })
    const roots = []
    const added = new Set() // Pour éviter les doublons
    uniqueList.forEach(cat => {
      if (added.has(cat.id)) return // Déjà ajouté
      if (cat.parentId && map[cat.parentId]) {
        map[cat.parentId].children.push(map[cat.id])
        added.add(cat.id)
      } else {
        roots.push(map[cat.id])
        added.add(cat.id)
      }
    })
    
    console.log('buildTree result:', roots.map(c => ({ id: c.id, name: c.name, children: c.children.map(ch => ({ id: ch.id, name: ch.name })) })))
    
    const sortNode = arr => {
      arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.name.localeCompare(b.name))
      arr.forEach(n => sortNode(n.children))
    }
    sortNode(roots)
    return roots
  }

  const categoryTree = computed(() => buildTree(categories.value))

  // ── Siblings helper ───────────────────────────────
  function getSiblings(category) {
    return categories.value
      .filter(c => c.parentId === (category.parentId ?? null))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }

  // ── API calls ─────────────────────────────────────
  async function loadCategories() {
    try {
      categories.value = await api.get('/api/categories')
    } catch {
      appStore.notify({ type: 'error', message: 'Impossible de charger les catégories.' })
    }
  }

  async function apiMove(id, parentId, position) {
    await api.put(`/api/categories/${id}`, { parentId: parentId ?? null, position: position ?? 0 })
  }

  function updateLocalCategory(id, data) {
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      categories.value[idx] = { ...categories.value[idx], ...data }
      categories.value = [...categories.value]
    }
  }

  function moveLocalCategory(category, aboveCategory, newPosition, abovePosition) {
    updateLocalCategory(category.id, { position: newPosition })
    updateLocalCategory(aboveCategory.id, { position: abovePosition })
  }

  function detachChildrenOf(deletedId) {
    categories.value = categories.value.map(cat => {
      if (cat.parentId === deletedId) {
        return { ...cat, parentId: null }
      }
      return cat
    })
    categories.value = [...categories.value]
  }

  // ── Move up in current list ───────────────────────
  async function handleMoveUp(category) {
    const siblings = getSiblings(category)
    const idx = siblings.findIndex(c => c.id === category.id)
    if (idx <= 0) return
    const above = siblings[idx - 1]
    try {
      await Promise.all([
        apiMove(category.id, category.parentId, idx - 1),
        apiMove(above.id, above.parentId, idx),
      ])
      moveLocalCategory(category, above, idx - 1, idx)
    } catch {
      appStore.notify({ type: 'error', message: 'Impossible de déplacer.' })
    }
  }

  // ── Move down in current list ─────────────────────
  async function handleMoveDown(category) {
    const siblings = getSiblings(category)
    const idx = siblings.findIndex(c => c.id === category.id)
    if (idx >= siblings.length - 1) return
    const below = siblings[idx + 1]
    try {
      await Promise.all([
        apiMove(category.id, category.parentId, idx + 1),
        apiMove(below.id, below.parentId, idx),
      ])
      moveLocalCategory(category, below, idx + 1, idx)
    } catch {
      appStore.notify({ type: 'error', message: 'Impossible de déplacer.' })
    }
  }

  // ── Promote to parent level ───────────────────────
  async function handlePromote(category) {
    if (!category.parentId) return
    const parent = categories.value.find(c => c.id === category.parentId)
    if (!parent) return
    const siblings = getSiblings(parent)
    const indexOfParent = categories.value.findIndex(c => c.id === parent.id)
    const newPosition = (siblings[siblings.length - 1]?.position ?? 0) + 1
    try {
      await apiMove(category.id, parent.parentId, newPosition)
      updateLocalCategory(category.id, { parentId: parent.parentId })
    } catch {
      appStore.notify({ type: 'error', message: 'Impossible de promouvoir.' })
    }
  }

  // ── Demote (make child of previous sibling) ──────
  async function handleDemote(category) {
    const siblings = getSiblings(category)
    const idx = siblings.findIndex(c => c.id === category.id)
    if (idx <= 0) return
    const previousSibling = siblings[idx - 1]
    const newPosition = 0
    try {
      await apiMove(category.id, previousSibling.id, newPosition)
      updateLocalCategory(category.id, { parentId: previousSibling.id })
    } catch {
      appStore.notify({ type: 'error', message: 'Impossible de déplacer.' })
    }
  }

  async function handleNest({ id, parentId }) {
    const category = categories.value.find(c => c.id === id)
    if (!category) return
    try {
      await apiMove(category.id, parentId, 0)
      updateLocalCategory(category.id, { parentId })
    } catch {
      appStore.notify({ type: 'error', message: 'Impossible de déplacer.' })
    }
  }

  // ── Add new category ──────────────────────────────
  async function handleAddCategory() {
    if (!newCategory.value.trim()) return
    try {
      const res = await api.post('/api/categories', { name: newCategory.value.trim() })
      categories.value.push(res)
      categories.value = [...categories.value]
      newCategory.value = ''
    } catch {
      appStore.notify({ type: 'error', message: 'Impossible de créer la catégorie.' })
    }
  }

  // ── Edit category ─────────────────────────────────
  async function handleSaveEdit() {
    if (!editingCategory.value || !editForm.value.name.trim()) return
    try {
      await api.put(`/api/categories/${editingCategory.value.id}`, {
        name: editForm.value.name.trim(),
        color: editForm.value.color,
      })
      updateLocalCategory(editingCategory.value.id, {
        name: editForm.value.name.trim(),
        color: editForm.value.color,
      })
      editingCategory.value = null
      editForm.value = { name: '', color: '' }
    } catch {
      appStore.notify({ type: 'error', message: 'Impossible de mettre à jour la catégorie.' })
    }
  }

  function openEdit(category) {
    editingCategory.value = category
    editForm.value = { name: category.name, color: category.color }
  }

  function cancelEdit() {
    editingCategory.value = null
    editForm.value = { name: '', color: '' }
  }

  // ── Delete category ───────────────────────────────
  async function handleDeleteCategory(category) {
    if (!confirm(`Supprimer la catégorie "${category.name}" ?`)) return
    try {
      await api.delete(`/api/categories/${category.id}`)
      detachChildrenOf(category.id)
      categories.value = categories.value.filter(c => c.id !== category.id)
      appStore.notify({ type: 'success', message: 'Catégorie supprimée.' })
    } catch {
      appStore.notify({ type: 'error', message: 'Impossible de supprimer la catégorie.' })
    }
  }

  onMounted(loadCategories)

  return {
    // État
    categories,
    newCategory,
    editingCategory,
    editForm,

    // Props
    categoryTree,

    // Fonctions
    loadCategories,
    handleMoveUp,
    handleMoveDown,
    handlePromote,
    handleDemote,
    handleAddCategory,
    handleSaveEdit,
    openEdit,
    cancelEdit,
    handleDeleteCategory,
  }
}
