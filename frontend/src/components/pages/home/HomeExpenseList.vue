<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import HomeExpenseCard from '@/components/pages/home/HomeExpenseCard.vue'
import BaseLoader from '@/components/atoms/BaseLoader.vue'
import BaseText from '@/components/atoms/BaseText.vue'

const props = defineProps({
  expenses: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  currency: { type: String, default: '€' },
  isLoading: { type: Boolean, default: false },
  isLoadingMore: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  limit: { type: Number, default: 15 },
})
const emit = defineEmits(['select-expense', 'load-more'])

const sentinel = ref(null)
let observer = null

function setupObserver() {
  if (observer || !sentinel.value) return
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && props.hasMore) {
      emit('load-more')
    }
  }, { root: null, rootMargin: '200px 0px', threshold: 0.1 })
  observer.observe(sentinel.value)
}

onMounted(async () => {
  await nextTick()
  setupObserver()
})

watch(() => sentinel.value, async (value) => {
  if (value) {
    await nextTick()
    setupObserver()
  }
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="home-page__list">
    <div v-if="isLoading" class="home-page__loader">
      <BaseLoader size="lg" />
    </div>

    <div v-else-if="expenses.length === 0" class="home-page__empty">
      <BaseText color="secondary">Aucune opération trouvée pour le moment.</BaseText>
    </div>

    <div v-else class="home-page__expenses">
      <HomeExpenseCard
        v-for="expense in expenses"
        :key="expense.id"
        :expense="expense"
        :categories="categories"
        :currency="currency"
        @select="expense => emit('select-expense', expense)"
      />

      <div id="home-scroll-sentinel" class="home-page__sentinel" ref="sentinel">
        <BaseLoader v-if="isLoadingMore" size="sm" />
        <BaseText v-else-if="!hasMore && total > limit" size="xs" color="secondary">
          — Toutes les opérations sont chargées —
        </BaseText>
      </div>
    </div>
  </div>
</template>
