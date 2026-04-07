<script setup>
import { reactive, watch } from 'vue'
import BaseText from '@/components/atoms/BaseText.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  filters: { type: Object, default: () => ({}) },
  categories: { type: Array, default: () => [] },
  hasActiveFilters: { type: Boolean, default: false },
})
const emit = defineEmits(['update:show', 'update:filters', 'reset-filters'])

const localFilters = reactive({
  type: props.filters.type ?? '',
  category: props.filters.category ?? '',
  title: props.filters.title ?? '',
  dateRangeType: props.filters.dateRangeType ?? 'all',
  dateFrom: props.filters.dateFrom ?? '',
  dateTo: props.filters.dateTo ?? '',
  withoutCategory: props.filters.withoutCategory ?? false,
})

watch(
  () => props.filters,
  newFilters => {
    Object.assign(localFilters, {
      type: newFilters.type ?? '',
      category: newFilters.category ?? '',
      title: newFilters.title ?? '',
      dateRangeType: newFilters.dateRangeType ?? 'all',
      dateFrom: newFilters.dateFrom ?? '',
      dateTo: newFilters.dateTo ?? '',
      withoutCategory: newFilters.withoutCategory ?? false,
    })
  },
  { deep: true, immediate: true }
)

watch(
  localFilters,
  newFilters => emit('update:filters', { ...newFilters }),
  { deep: true }
)
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="$emit('update:show', false)">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__header">
          <BaseText weight="semibold" size="lg">Filtres</BaseText>
          <button class="icon-btn" @click="$emit('update:show', false)" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal__body filters-modal-content">
          <div class="filter-group">
            <label class="filter-label">Type d'opération</label>
            <div class="filter-toggles">
              <button
                @click="localFilters.type = localFilters.type === 'expense' ? '' : 'expense'"
                :class="['filter-toggle', { active: localFilters.type === 'expense' }]"
              >
                Dépense
              </button>
              <button
                @click="localFilters.type = localFilters.type === 'credit' ? '' : 'credit'"
                :class="['filter-toggle', { active: localFilters.type === 'credit' }]"
              >
                Crédit
              </button>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">Catégorie</label>
            <select v-model="localFilters.category" class="filter-select">
              <option value="">Toutes les catégories</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Libellé</label>
            <input
              v-model="localFilters.title"
              type="text"
              placeholder="Rechercher..."
              class="filter-input"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">
              <input v-model="localFilters.withoutCategory" type="checkbox" class="checkbox-input" />
              <span>Opérations sans catégorie</span>
            </label>
          </div>

          <div class="filter-group">
            <label class="filter-label">Période</label>
            <div class="filter-date-presets">
              <button
                @click="localFilters.dateRangeType = 'all'"
                :class="['preset-btn', { active: localFilters.dateRangeType === 'all' }]"
              >
                Toutes
              </button>
              <button
                @click="localFilters.dateRangeType = 'week'"
                :class="['preset-btn', { active: localFilters.dateRangeType === 'week' }]"
              >
                7 jours
              </button>
              <button
                @click="localFilters.dateRangeType = 'month'"
                :class="['preset-btn', { active: localFilters.dateRangeType === 'month' }]"
              >
                30 jours
              </button>
              <button
                @click="localFilters.dateRangeType = 'custom'"
                :class="['preset-btn', { active: localFilters.dateRangeType === 'custom' }]"
              >
                Personnalisé
              </button>
            </div>

            <div v-if="localFilters.dateRangeType === 'custom'" class="filter-date-range">
              <input v-model="localFilters.dateFrom" type="date" class="filter-date" />
              <span class="date-separator">→</span>
              <input v-model="localFilters.dateTo" type="date" class="filter-date" />
            </div>
          </div>

          <div class="filter-actions">
            <button
              v-if="hasActiveFilters"
              @click="$emit('reset-filters')"
              class="btn-reset"
            >
              Réinitialiser
            </button>
            <BaseButton @click="$emit('update:show', false)" size="sm" :full="true">
              Appliquer
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
