<script setup>
import { computed, onMounted, ref } from 'vue'
import { useApi } from '@/composables/useApi.js'
import { useAppStore } from '@/stores/app.store.js'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseText from '@/components/atoms/BaseText.vue'
import CategoryTree from '@/components/organisms/CategoryTree.vue'

const api = useApi()
const appStore = useAppStore()
const categories = ref([])
const newCategory = ref('')
const editingCategory = ref(null)
const editForm = ref({ name: '', color: '' })

/* ─── Tree builder ──────────────────────────────────────── */
function buildTree(list) {
  const map = {}
  list.forEach((cat) => { map[cat.id] = { ...cat, children: [] } })
  const roots = []
  list.forEach((cat) => {
    if (cat.parentId && map[cat.parentId]) map[cat.parentId].children.push(map[cat.id])
    else roots.push(map[cat.id])
  })
  const sortNode = (arr) => {
    arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.name.localeCompare(b.name))
    arr.forEach((n) => sortNode(n.children))
  }
  sortNode(roots)
  return roots
}

const categoryTree = computed(() => buildTree(categories.value))

/* ─── Siblings helper ───────────────────────────────────── */
function getSiblings(category) {
  return categories.value
    .filter((c) => c.parentId === (category.parentId ?? null))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
}

/* ─── API calls ─────────────────────────────────────────── */
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
  const idx = categories.value.findIndex((c) => c.id === id)
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
  categories.value = categories.value.map((cat) => {
    if (cat.parentId === deletedId) {
      return { ...cat, parentId: null }
    }
    return cat
  })
  categories.value = [...categories.value]
}

/* ─── Move up in current list ───────────────────────────── */
async function handleMoveUp(category) {
  const siblings = getSiblings(category)
  const idx = siblings.findIndex((c) => c.id === category.id)
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

/* ─── Move down in current list ─────────────────────────── */
async function handleMoveDown(category) {
  const siblings = getSiblings(category)
  const idx = siblings.findIndex((c) => c.id === category.id)
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

/* ─── Indent: become child of previous sibling ──────────── */
async function handleIndent(category) {
  if (category.parentId) return  // déjà au niveau max
  const hasCh = categories.value.some((c) => c.parentId === category.id)
  if (hasCh) return              // a des enfants, ne peut pas devenir enfant
  const siblings = getSiblings(category)
  const idx = siblings.findIndex((c) => c.id === category.id)
  if (idx <= 0) return
  const newParent = siblings[idx - 1]
  if (newParent.parentId) return // le parent serait déjà un enfant (impossible)
  const newPos = categories.value.filter((c) => c.parentId === newParent.id).length
  try {
    await apiMove(category.id, newParent.id, newPos)
    updateLocalCategory(category.id, { parentId: newParent.id, position: newPos })
  } catch {
    appStore.notify({ type: 'error', message: 'Impossible d\'indenter.' })
  }
}

/* ─── Dedent: go up one level ───────────────────────────── */
async function handleDedent(category) {
  if (!category.parentId) return
  const parent = categories.value.find((c) => c.id === category.parentId)
  const grandParentId = parent?.parentId ?? null
  const newPos = categories.value.filter((c) => c.parentId === grandParentId).length
  try {
    await apiMove(category.id, grandParentId, newPos)
    updateLocalCategory(category.id, { parentId: grandParentId, position: newPos })
  } catch {
    appStore.notify({ type: 'error', message: 'Impossible de dédenter.' })
  }
}

/* ─── Nest: drag & drop, become child of target ─────────── */
async function handleNest({ id, parentId }) {
  if (id === parentId) return;
  const target = categories.value.find((c) => c.id === parentId)
  const dragged = categories.value.find((c) => c.id === id)
  // Refus si le target est déjà un enfant (profondeur > 1)
  if (target?.parentId) return
  // Refus si le dragé a lui-même des enfants (ne peut pas devenir enfant)
  const hasChildren = categories.value.some((c) => c.parentId === id)
  if (hasChildren) return;
  const newPos = categories.value.filter((c) => c.parentId === parentId).length
  try {
    await apiMove(id, parentId, newPos)
    await loadCategories()
  } catch {
    appStore.notify({ type: 'error', message: 'Impossible de déplacer.' })
  }
}

/* ─── Edit ────────────────────────────────────────────── */
function openEditModal(category) {
  editingCategory.value = category
  editForm.value = {
    name: category.name,
    color: category.color || '',
  }
}

function closeEditModal() {
  editingCategory.value = null
  editForm.value = { name: '', color: '' }
}

async function saveEdit() {
  const name = editForm.value.name.trim()
  if (!name) return appStore.notify({ type: 'warning', message: 'Le nom est requis.' })
  
  try {
    await api.put(`/api/categories/${editingCategory.value.id}`, {
      name,
      color: editForm.value.color || null,
    })
    updateLocalCategory(editingCategory.value.id, { name, color: editForm.value.color || null })
    closeEditModal()
    appStore.notify({ type: 'success', message: 'Catégorie modifiée.' })
  } catch {
    appStore.notify({ type: 'error', message: 'Impossible de modifier la catégorie.' })
  }
}
async function removeCategory(id) {
  try {
    await api.del(`/api/categories/${id}`)
    categories.value = categories.value.filter((c) => c.id !== id)
    detachChildrenOf(id)
    appStore.notify({ type: 'success', message: 'Catégorie supprimée.' })
  } catch {
    appStore.notify({ type: 'error', message: 'Impossible de supprimer la catégorie.' })
  }
}

/* ─── Add ───────────────────────────────────────────────── */
async function addCategory() {
  const name = newCategory.value.trim()
  if (!name) return appStore.notify({ type: 'warning', message: 'Le nom est requis.' })
  try {
    const created = await api.post('/api/categories', { name })
    categories.value.push(created)
    newCategory.value = ''
  } catch {
    appStore.notify({ type: 'error', message: 'Impossible de créer la catégorie.' })
  }
}

onMounted(loadCategories)
</script>

<template>
  <div class="categories-page">
    <div class="categories-page__header">
      <div>
        <BaseText as="h1" size="2xl" weight="bold">Catégories</BaseText>
        <BaseText as="p" color="secondary" size="sm">
          Gérez vos catégories d'opérations avant de créer vos opérations.
        </BaseText>
      </div>
    </div>

    <section class="categories-page__form">
      <BaseInput
        v-model="newCategory"
        label="Nouvelle catégorie"
        placeholder="Courses, Transport, Loisirs..."
        @keyup.enter="addCategory"
      />
      <BaseButton @click="addCategory" size="sm">Ajouter</BaseButton>
    </section>

    <section class="categories-page__list">
      <div v-if="categories.length === 0" class="categories-page__empty">
        Aucune catégorie définie pour le moment.
      </div>

      <CategoryTree
        v-else
        :categories="categoryTree"
        @move-up="handleMoveUp"
        @move-down="handleMoveDown"
        @indent="handleIndent"
        @dedent="handleDedent"
        @nest="handleNest"
        @delete="removeCategory"
        @edit="openEditModal"
      />
    </section>

    <!-- Modal d'édition -->
    <Transition name="modal-fade">
      <div v-if="editingCategory" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal__header">
            <BaseText weight="semibold" size="lg">Modifier la catégorie</BaseText>
            <button class="icon-btn" @click="closeEditModal" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form @submit.prevent="saveEdit" class="modal__body">
            <BaseInput
              v-model="editForm.name"
              label="Nom"
              required
              placeholder="Courses, Transport..."
            />
            <div>
              <label class="color-label">Couleur</label>
              <input
                v-model="editForm.color"
                type="color"
                class="color-input"
              />
              <BaseText size="xs" color="secondary">Choisissez une couleur pour personnaliser vos tags.</BaseText>
            </div>
            <div class="modal__actions">
              <BaseButton type="button" variant="secondary" @click="closeEditModal">Annuler</BaseButton>
              <BaseButton type="submit">Enregistrer</BaseButton>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.categories-page {
  padding: var(--space-5) var(--content-padding);
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.categories-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.categories-page__form {
  display: flex;
  gap: var(--space-3);
  align-items: flex-end;
}

.categories-page__form > :first-child {
  flex: 1;
  min-width: 0;
}

.categories-page__list {
  display: grid;
  gap: var(--space-3);
}

.categories-page__card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-bg-surface);
}

.categories-page__card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: var(--space-4);
}

.categories-page__empty {
  color: var(--color-text-muted);
  padding: var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-xl);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.modal {
  background: var(--color-bg-surface);
  border-radius: var(--radius-xl);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.icon-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.icon-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.modal__body {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.color-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.color-input {
  width: 60px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: none;
}

.modal__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-2);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
