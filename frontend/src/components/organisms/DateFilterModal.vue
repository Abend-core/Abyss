<template>
  <div v-if="isOpen" class="date-filter-modal-overlay" @click.self="close">
    <div class="date-filter-modal">
      <div class="modal-header">
        <h2>Filtrer par date</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="modal-content">
        <!-- Mode de filtrage ───────────────────────────────────── -->
        <div class="filter-modes">
          <button
            :class="['mode-btn', { active: filterMode === 'month' }]"
            @click="filterMode = 'month'"
          >
            Mois
          </button>
          <button
            :class="['mode-btn', { active: filterMode === 'year' }]"
            @click="filterMode = 'year'"
          >
            Année
          </button>
          <button
            :class="['mode-btn', { active: filterMode === 'custom' }]"
            @click="filterMode = 'custom'"
          >
            Personnalisé
          </button>
        </div>

        <!-- Mode MOIS ────────────────────────────────────────── -->
        <div v-if="filterMode === 'month'" class="filter-section">
          <label>Sélectionner un mois</label>
          <select v-model="selectedMonth" class="filter-select">
            <option :value="null" disabled>Choisir un mois...</option>
            <option v-for="month in availableMonths" :key="month" :value="month">
              {{ formatMonth(month) }}
            </option>
          </select>
          <p class="info-text">
            {{ selectedMonth ? `Affiche les données du mois de ${formatMonth(selectedMonth)}` : 'Sélectionnez un mois' }}
          </p>
        </div>

        <!-- Mode ANNÉE ────────────────────────────────────────── -->
        <div v-if="filterMode === 'year'" class="filter-section">
          <label>Sélectionner une année</label>
          <select v-model.number="selectedYear" class="filter-select">
            <option :value="null" disabled>Choisir une année...</option>
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
          <p class="info-text">
            {{ selectedYear ? `Affiche les données de l'année ${selectedYear}` : 'Sélectionnez une année' }}
          </p>
        </div>

        <!-- Mode PERSONNALISÉ ──────────────────────────────────── -->
        <div v-if="filterMode === 'custom'" class="filter-section">
          <label>Sélectionner une plage de dates</label>
          <div class="date-inputs-group">
            <div class="date-group">
              <label class="small-label">Debut</label>
              <input v-model="customStart" type="date" class="date-input" />
            </div>
            <div class="date-group">
              <label class="small-label">Fin</label>
              <input v-model="customEnd" type="date" class="date-input" />
            </div>
          </div>
          <p class="info-text">
            {{ customStart && customEnd
              ? `Affiche les données du ${formatDate(customStart)} au ${formatDate(customEnd)}`
              : 'Sélectionnez une plage de dates'
            }}
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="close">Annuler</button>
        <button class="btn-apply" @click="apply" :disabled="!isValid">
          {{ isValid ? 'Appliquer' : 'Sélectionner une période' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  filterMode: { type: String, default: 'month' },
  selectedMonth: { type: [String, null], default: null },
  selectedYear: { type: [Number, null], default: null },
  customStart: { type: [String, null], default: null },
  customEnd: { type: [String, null], default: null },
  availableMonths: { type: Array, default: () => [] },
  availableYears: { type: Array, default: () => [] },
  groupingPeriodLabel: { type: String, default: '' },
})

const emit = defineEmits([
  'close',
  'update:filterMode',
  'update:selectedMonth',
  'update:selectedYear',
  'update:customStart',
  'update:customEnd',
  'apply',
])

// Watchers pour mettre à jour les props
const filterMode = computed({
  get: () => props.filterMode,
  set: (val) => emit('update:filterMode', val),
})

const selectedMonth = computed({
  get: () => props.selectedMonth,
  set: (val) => emit('update:selectedMonth', val),
})

const selectedYear = computed({
  get: () => props.selectedYear,
  set: (val) => emit('update:selectedYear', val),
})

const customStart = computed({
  get: () => props.customStart,
  set: (val) => emit('update:customStart', val),
})

const customEnd = computed({
  get: () => props.customEnd,
  set: (val) => emit('update:customEnd', val),
})

const dateRange = computed(() => {
  if (props.filterMode === 'month' && props.selectedMonth) {
    const start = new Date(`${props.selectedMonth}-01`)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  }

  if (props.filterMode === 'year' && props.selectedYear) {
    return {
      start: `${props.selectedYear}-01-01`,
      end: `${props.selectedYear}-12-31`,
    }
  }

  if (props.filterMode === 'custom' && props.customStart && props.customEnd) {
    return {
      start: props.customStart,
      end: props.customEnd,
    }
  }

  return null
})

// Validation
const isValid = computed(() => {
  if (props.filterMode === 'month') return props.selectedMonth
  if (props.filterMode === 'year') return props.selectedYear
  if (props.filterMode === 'custom') return props.customStart && props.customEnd
  return false
})

// Méthodes
function formatMonth(month) {
  return new Date(`${month}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function close() {
  emit('close')
}

function apply() {
  if (isValid.value) {
    emit('apply')
  }
}
</script>

<style scoped>
.date-filter-modal-overlay {
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
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.date-filter-modal {
  background: var(--color-bg);
  color: var(--color-text, #111111);
  border-radius: 12px;
  box-shadow: 0 20px 45px -15px rgba(0, 0, 0, 0.25);
  border: 1px solid var(--color-border);
  width: min(500px, 90%);
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.modal-content {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.filter-modes {
  display: flex;
  gap: var(--space-2);
}

.mode-btn {
  flex: 1;
  padding: var(--space-3) var(--space-2);
  border: 2px solid var(--color-border);
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.mode-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.mode-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: 8px;
}

.filter-section label {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.95rem;
}

.filter-select,
.date-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.filter-select:hover,
.date-input:hover,
.filter-select:focus,
.date-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.date-inputs-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.date-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.date-group label {
  font-size: 0.85rem;
}

.small-label {
  font-size: 0.8rem;
  font-weight: 500;
}

.info-text {
  margin: 0;
  padding: var(--space-3);
  background: var(--color-bg);
  border-radius: 6px;
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  border-left: 3px solid var(--color-primary);
}

.modal-footer {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.btn-cancel,
.btn-apply {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.btn-cancel:hover {
  background: var(--color-border);
}

.btn-apply {
  background: var(--color-primary);
  color: white;
}

.btn-apply:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-apply:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .date-filter-modal {
    width: 95%;
    max-height: 95vh;
    border-radius: 16px 16px 0 0;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    animation: slideUpMobile 0.3s ease-out;
  }

  @keyframes slideUpMobile {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .date-range {
    flex-direction: column;
    align-items: stretch;
  }

  .separator {
    transform: rotate(90deg);
    margin: var(--space-2) 0;
  }
}
</style>
