<script setup>
import { toRef }       from 'vue'
import { useEntropy }  from '@/composables/useEntropy.js'
import BaseText        from '@/components/atoms/BaseText.vue'

const props = defineProps({
  /** Valeur du mot de passe à analyser */
  password: { type: String, required: true },
})

const { entropy, progress, color, label, TARGET } = useEntropy(toRef(props, 'password'))

const COLOR_VAR = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger:  'var(--color-danger)',
}
</script>

<template>
  <div v-if="password.length > 0" class="pwd-strength" aria-live="polite">
    <!-- Barre de progression -->
    <div class="pwd-strength__track" role="progressbar"
         :aria-valuenow="Math.round(entropy)"
         :aria-valuemin="0"
         :aria-valuemax="TARGET"
         :aria-label="`Entropie : ${Math.round(entropy)} bits sur ${TARGET}`">
      <div
        class="pwd-strength__fill"
        :style="{
          width: `${progress}%`,
          background: COLOR_VAR[color]
        }"
      />
    </div>

    <!-- Infos textuelles -->
    <div class="pwd-strength__meta">
      <BaseText size="xs" :color="color" weight="medium">{{ label }}</BaseText>
      <BaseText size="xs" color="muted">
        {{ Math.round(entropy) }} / {{ TARGET }} bits
      </BaseText>
    </div>
  </div>
</template>

<style scoped>
.pwd-strength {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.pwd-strength__track {
  height: 6px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.pwd-strength__fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              background 0.3s ease;
  min-width: 2px;
}

.pwd-strength__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Couleurs du texte via BaseText color prop — mapping CSS */
:deep(.text--success) { color: var(--color-success); }
:deep(.text--warning) { color: var(--color-warning); }
:deep(.text--danger)  { color: var(--color-danger); }
</style>
