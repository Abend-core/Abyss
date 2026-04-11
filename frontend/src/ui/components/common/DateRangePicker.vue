<template>
  <div class="date-range-picker" ref="rootRef">
    <div class="drp-field" @click="togglePanel" tabindex="0" @keydown.enter.prevent="togglePanel">
      <input
        type="text"
        readonly
        :value="displayValue"
        placeholder="Sélectionner une plage"
        class="drp-input"
        aria-label="Sélectionner une plage de dates"
      />
      <button
        v-if="hasValue"
        type="button"
        class="drp-clear"
        @click.stop="clearRange"
        aria-label="Effacer la plage"
      >
        ×
      </button>
      <span class="drp-chevron">▾</span>
    </div>

    <div v-if="isOpen" class="drp-panel">
      <div class="drp-header">
        <button type="button" class="drp-nav" @click="prevMonth" aria-label="Mois précédent">←</button>
        <div class="drp-month-label">{{ monthLabel }}</div>
        <button type="button" class="drp-nav" @click="nextMonth" aria-label="Mois suivant">→</button>
      </div>

      <div class="drp-weekdays">
        <span v-for="weekday in weekdays" :key="weekday" class="drp-weekday">{{ weekday }}</span>
      </div>

      <div class="drp-days">
        <button
          v-for="cell in calendarCells"
          :key="cell.key"
          type="button"
          class="drp-day"
          :class="{
            'drp-day--disabled': !cell.inCurrentMonth,
            'drp-day--selected': cell.isSelected,
            'drp-day--range': cell.isInRange,
            'drp-day--start': cell.isStart,
            'drp-day--end': cell.isEnd,
            'drp-day--preview': cell.isPreview,
          }"
          :disabled="!cell.inCurrentMonth"
          @click="selectDay(cell.date)"
          @mouseover="hoverDay(cell.date)"
        >
          {{ cell.day }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'change'])

const rootRef = ref(null)
const isOpen = ref(false)
const activeMonth = ref(new Date())
const hoverDate = ref('')

const parseRange = (value) => {
  if (!value) return { start: '', end: '' }
  const normalized = value.replace(/\s*(?:→|->|to)\s*/gi, '|')
  const [start = '', end = ''] = normalized.split('|')
  return { start, end }
}

const selectedStart = computed(() => parseRange(props.modelValue).start)
const selectedEnd = computed(() => parseRange(props.modelValue).end)
const hasValue = computed(() => selectedStart.value && selectedEnd.value)

const displayValue = computed(() => {
  if (!hasValue.value) return ''
  const { start, end } = parseRange(props.modelValue)
  return `${formatDisplayDate(start)} → ${formatDisplayDate(end)}`
})

const monthLabel = computed(() => {
  return activeMonth.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

const weekdays = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

function formatDisplayDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function normalizeIso(date) {
  return date.toISOString().slice(0, 10)
}

const calendarCells = computed(() => {
  const year = activeMonth.value.getFullYear()
  const month = activeMonth.value.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = (firstOfMonth.getDay() + 6) % 7
  const startDate = new Date(firstOfMonth)
  startDate.setDate(firstOfMonth.getDate() - startWeekday)

  const cells = []
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const iso = normalizeIso(date)
    const inCurrentMonth = date.getMonth() === month
    const isSelected = iso === selectedStart.value || iso === selectedEnd.value
    const rangeStart = selectedStart.value
    const rangeEnd = selectedEnd.value
    const previewStart = selectedStart.value && !selectedEnd.value ? selectedStart.value : ''
    const previewEnd = hoverDate.value

    const compareStartEnd = (a, b) => (a && b ? a <= b : false)
    const rangeStartValue = rangeStart && rangeEnd ? (rangeStart <= rangeEnd ? rangeStart : rangeEnd) : ''
    const rangeEndValue = rangeStart && rangeEnd ? (rangeStart <= rangeEnd ? rangeEnd : rangeStart) : ''
    const previewStartValue = previewStart
    const previewEndValue = previewEnd && previewStart ? (previewStart <= previewEnd ? previewEnd : previewStart) : ''
    const inRange = rangeStartValue && rangeEndValue && iso >= rangeStartValue && iso <= rangeEndValue
    const inPreview = previewStartValue && previewEndValue && !rangeEnd && iso >= previewStartValue && iso <= previewEndValue

    cells.push({
      key: iso,
      date: iso,
      day: date.getDate(),
      inCurrentMonth,
      isSelected,
      isStart: iso === rangeStartValue,
      isEnd: iso === rangeEndValue,
      isInRange: inRange,
      isPreview: inPreview,
    })
  }

  return cells
})

function togglePanel() {
  isOpen.value = !isOpen.value
}

function closePanel() {
  isOpen.value = false
  hoverDate.value = ''
}

function clearRange() {
  emit('update:modelValue', '')
  emit('change', '')
  hoverDate.value = ''
}

function selectDay(date) {
  const start = selectedStart.value
  const end = selectedEnd.value

  if (!start || (start && end)) {
    emit('update:modelValue', date)
    emit('change', date)
    hoverDate.value = ''
    return
  }

  let rangeStart = start
  let rangeEnd = date
  if (rangeEnd < rangeStart) {
    ;[rangeStart, rangeEnd] = [rangeEnd, rangeStart]
  }

  emit('update:modelValue', `${rangeStart}|${rangeEnd}`)
  emit('change', `${rangeStart}|${rangeEnd}`)
  hoverDate.value = ''
  closePanel()
}

function hoverDay(date) {
  if (!selectedStart.value || selectedEnd.value) return
  hoverDate.value = date
}

function prevMonth() {
  activeMonth.value = new Date(activeMonth.value.getFullYear(), activeMonth.value.getMonth() - 1, 1)
}

function nextMonth() {
  activeMonth.value = new Date(activeMonth.value.getFullYear(), activeMonth.value.getMonth() + 1, 1)
}

function handleClickOutside(event) {
  if (rootRef.value && !rootRef.value.contains(event.target)) {
    closePanel()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

watch(
  () => props.modelValue,
  (value) => {
    const { start, end } = parseRange(value)
    if (start) {
      const [year, month] = start.split('-')
      activeMonth.value = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.date-range-picker {
  position: relative;
  width: 100%;
}

.drp-field {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.drp-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-surface);
  color: var(--color-text);
  cursor: pointer;
}

.drp-field:focus-within .drp-input,
.drp-field:hover .drp-input {
  border-color: var(--color-primary);
}

.drp-clear {
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  cursor: pointer;
}

.drp-chevron {
  color: var(--color-text-secondary);
}

.drp-panel {
  position: absolute;
  z-index: 20;
  top: calc(100% + 0.5rem);
  left: 0;
  width: min(360px, 100%);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: 0 24px 54px -20px rgba(0, 0, 0, 0.35);
  padding: 1rem;
}

.drp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.drp-nav {
  border: none;
  background: transparent;
  font-size: 1.1rem;
  color: var(--color-text);
  cursor: pointer;
}

.drp-month-label {
  font-weight: 600;
  color: var(--color-text);
}

.drp-weekdays,
.drp-days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.25rem;
}

.drp-weekday,
.drp-day {
  display: grid;
  place-items: center;
  font-size: 0.85rem;
}

.drp-weekday {
  color: var(--color-text-secondary);
}

.drp-day {
  min-height: 2.5rem;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text);
  cursor: pointer;
}

.drp-day--disabled {
  opacity: 0.35;
  cursor: default;
}

.drp-day--range {
  background: rgba(59, 130, 246, 0.12);
}

.drp-day--preview {
  background: rgba(59, 130, 246, 0.08);
}

.drp-day--start,
.drp-day--end {
  background: var(--color-primary);
  color: white;
}

.drp-day--selected {
  font-weight: 700;
}
</style>
