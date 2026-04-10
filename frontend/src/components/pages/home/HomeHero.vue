<script setup>
import BaseText from '@/components/atoms/BaseText.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'

const props = defineProps({
  total: { type: Number, required: true },
  filteredCount: { type: Number, required: true },
  hasActiveFilters: { type: Boolean, required: true },
  hasMore: { type: Boolean, default: false },
  hasUncategorized: { type: Boolean, required: true },
  isWithoutCategoryActive: { type: Boolean, default: false },
})
const emit = defineEmits(['open-filters', 'reset-filters', 'add-operation', 'toggle-uncategorized'])
</script>

<template>
  <div class="home-page__hero">
    <div class="home-page__hero-text">
      <BaseText as="h1" size="3xl" weight="bold">Accueil</BaseText>
      <BaseText as="p" color="secondary" size="sm">
        <template v-if="total > 0">
          <span v-if="hasActiveFilters">
            {{ filteredCount }} résultat{{ filteredCount > 1 ? 's' : '' }}
            <span v-if="hasMore"> chargés</span>
            <span v-else> trouvés</span>
          </span>
          <span v-else>
            {{ total }} opération{{ total > 1 ? 's' : '' }}
          </span>
        </template>
        <template v-else>
          Aucune opération
        </template>
      </BaseText>
    </div>

    <div class="home-page__actions">
      <div class="home-page__filter-controls">
        <button @click="$emit('open-filters')" class="btn-filter-icon" title="Filtrer">
          <BaseIcon name="settings" :size="20" />
        </button>
        <button
          v-if="hasUncategorized"
          @click="$emit('toggle-uncategorized')"
          class="btn-filter-shortcut"
          :class="{ active: isWithoutCategoryActive }"
          title="Opérations sans catégorie"
        >
          <i class="ri-shape-line"></i>
        </button>
        <Transition name="scale-fade">
          <button
            v-if="hasActiveFilters"
            @click="$emit('reset-filters')"
            class="btn-reset-filters"
            title="Réinitialiser les filtres"
          >
            <i class="ri-filter-off-line"></i>
          </button>
        </Transition>
      </div>

      <div class="home-page__summary">
        <BaseButton variant="ghost" size="sm" @click="$emit('add-operation')">
          <BaseIcon name="plus" :size="16" />
          Ajouter une opération
        </BaseButton>
      </div>
    </div>
  </div>
</template>
