<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'
import { useAuthStore } from '@/stores/auth.store.js'
import { useAppStore } from '@/stores/app.store.js'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseText from '@/components/atoms/BaseText.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'

const router = useRouter()
const api = useApi()
const authStore = useAuthStore()
const appStore = useAppStore()

const accountId = ref(authStore.user?.id ?? '')
const currency = ref('EUR')
const selectedFile = ref(null)
const selectedFileName = ref('')
const showDeleteModal = ref(false)
const fileInput = ref(null)
const showExportPasswordModal = ref(false)
const exportPassword = ref('')
const isExporting = ref(false)
const currencyOptions = [
  { code: 'EUR', label: '€ Euro' },
  { code: 'USD', label: '$ Dollar US' },
  { code: 'GBP', label: '£ Livre sterling' },
  { code: 'JPY', label: '¥ Yen japonais' },
  { code: 'CHF', label: 'CHF Franc suisse' },
  { code: 'AUD', label: '$ Dollar australien' },
]

async function loadSettings() {
  try {
    const account = await api('/api/user')
    accountId.value = account.id
    currency.value = account.settings?.currency ?? 'EUR'
  } catch (error) {
    appStore.notify({ type: 'error', message: 'Impossible de charger les paramètres.' })
  }
}

async function saveCurrency() {
  try {
    await api('/api/user', { method: 'PUT', body: { currency: currency.value } })
    appStore.notify({ type: 'success', message: 'Devise mise à jour. Les montants seront recalculés au prochain chargement.' })
    await loadSettings()
  } catch (error) {
    appStore.notify({ type: 'error', message: 'Impossible d’enregistrer les paramètres.' })
  }
}

async function exportData() {
  showExportPasswordModal.value = true
}

async function confirmExport() {
  if (!exportPassword.value.trim()) {
    appStore.notify({ type: 'warning', message: 'Veuillez entrer votre mot de passe.' })
    return
  }

  isExporting.value = true
  try {
    const data = await api('/api/account/export', {
      method: 'POST',
      body: { password: exportPassword.value },
    })
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `abyss-export-${accountId.value || 'data'}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    appStore.notify({ type: 'success', message: 'Fichier exporté.' })
    showExportPasswordModal.value = false
    exportPassword.value = ''
  } catch (error) {
    appStore.notify({ type: 'error', message: error.message || 'Impossible d exporter fichier.' })
  } finally {
    isExporting.value = false
  }
}

function cancelExport() {
  showExportPasswordModal.value = false
  exportPassword.value = ''
}

function selectImportFile() {
  fileInput.value?.click()
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  selectedFile.value = file
  selectedFileName.value = file.name
}

async function importData() {
  if (!selectedFile.value) {
    return appStore.notify({ type: 'warning', message: 'Choisissez un fichier JSON à importer.' })
  }

  try {
    const content = await selectedFile.value.text()
    const payload = JSON.parse(content)
    await api.post('/api/user/import', payload)
    await loadSettings()
    selectedFile.value = null
    selectedFileName.value = ''
    appStore.notify({ type: 'success', message: 'Données importées.' })
  } catch (error) {
    appStore.notify({ type: 'error', message: 'Le fichier JSON est invalide ou l’import a échoué.' })
  }
}

async function removeAccount() {

  showDeleteModal.value = true
}

function cancelDeleteAccount() {
  showDeleteModal.value = false
}

async function confirmDeleteAccount() {
  try {
    await api.del('/api/user')
    authStore.logout()
    accountId.value = ''
    currency.value = 'EUR'
    selectedFile.value = null
    selectedFileName.value = ''
    showDeleteModal.value = false
    router.push('/login')
    appStore.notify({ type: 'success', message: 'Compte supprimé avec succès.' })
  } catch (error) {
    appStore.notify({ type: 'error', message: 'Impossible de supprimer le compte.' })
  }
}

onMounted(loadSettings)
</script>

<template>
  <div class="settings-page">
    <div class="settings-page__header">
      <BaseText as="h1" size="2xl" weight="bold">Compte</BaseText>
      <BaseText as="p" color="secondary" size="sm">
        Identifiant et paramètres de votre profil.
      </BaseText>
      <div class="settings-page__account-id">
        <span class="settings-page__account-label">Identifiant du compte :</span>
        {{ accountId || 'Chargement...' }}
      </div>
    </div>

    <section class="settings-page__section">
      <div class="settings-page__section-title">Devise</div>
      <div class="settings-page__item">
        <div class="settings-page__item-left">
          <BaseText weight="medium">Monnaie</BaseText>
          <BaseText size="sm" color="muted">
            La devise sera utilisée pour afficher vos opérations.
          </BaseText>
        </div>
        <div class="settings-page__item-actions">
          <select v-model="currency" class="settings-page__select">
            <option v-for="option in currencyOptions" :key="option.code" :value="option.code">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <BaseButton @click="saveCurrency" :loading="api.loading" size="sm">
        Enregistrer
      </BaseButton>
    </section>

    <section class="settings-page__section">
      <div class="settings-page__section-title">Sauvegarde et restauration</div>
      <div class="settings-page__block">
        <BaseText weight="medium">Exporter mes données</BaseText>
        <BaseText size="sm" color="muted">Téléchargez le contenu de votre compte au format JSON.</BaseText>
        <BaseButton @click="exportData" size="sm">Exporter</BaseButton>
      </div>

      <div class="settings-page__block settings-page__import-block">
        <BaseText weight="medium">Importer des données</BaseText>
        <BaseText size="sm" color="muted">
          Choisissez un fichier JSON d’export Abyss pour importer vos catégories et opérations.
        </BaseText>
        <div class="settings-page__file-input-row">
          <input
            ref="fileInput"
            type="file"
            accept="application/json"
            class="settings-page__file-input"
            @change="handleFileChange"
          />
          <BaseButton @click="selectImportFile" size="sm">Choisir un fichier</BaseButton>
          <span class="settings-page__file-name">{{ selectedFileName || 'Aucun fichier sélectionné' }}</span>
        </div>
        <BaseButton @click="importData" size="sm" :disabled="!selectedFileName">Importer</BaseButton>
      </div>
    </section>

    <section class="settings-page__section settings-page__danger-zone">
      <BaseText as="h2" size="lg" weight="bold">Supprimer mon compte</BaseText>
      <BaseText size="sm" color="muted">
        Toutes vos données seront supprimées immédiatement. Aucune récupération possible.
      </BaseText>
      <BaseButton type="button" variant="danger" @click="removeAccount">Supprimer mon compte</BaseButton>
    </section>

    <!-- Modal de confirmation du mot de passe pour l'export -->
    <div v-if="showExportPasswordModal" class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal-card">
        <BaseText as="h2" size="xl" weight="bold">Exporter vos données</BaseText>
        <BaseText size="sm" color="muted">
          Veuillez entrer votre mot de passe pour confirmer l'export.
        </BaseText>
        <div class="settings-page__form-group">
          <input
            v-model="exportPassword"
            type="password"
            placeholder="Mot de passe"
            class="settings-page__input"
            @keyup.enter="confirmExport"
          />
        </div>
        <div class="modal-actions">
          <BaseButton variant="secondary" size="sm" @click="cancelExport" :disabled="isExporting">Annuler</BaseButton>
          <BaseButton variant="primary" size="sm" @click="confirmExport" :disabled="isExporting">
            {{ isExporting ? 'Exportation...' : 'Exporter' }}
          </BaseButton>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal-card">
        <BaseText as="h2" size="xl" weight="bold">Confirmer la suppression</BaseText>
        <BaseText size="sm" color="muted">
          Cette action supprimera définitivement votre compte et toutes vos données.
        </BaseText>
        <div class="modal-actions">
          <BaseButton variant="secondary" size="sm" @click="cancelDeleteAccount">Annuler</BaseButton>
          <BaseButton variant="danger" size="sm" @click="confirmDeleteAccount" :loading="api.loading">Supprimer</BaseButton>
        </div>
      </div>
    </div>

    <section class="settings-page__about">
      <BaseText size="xs" color="muted">Abyss — v1.0.0</BaseText>
      <BaseText size="xs" color="muted">Vue 3 · Fastify · PostgreSQL</BaseText>
    </section>
  </div>
</template>

<style scoped>
.settings-page {
  padding: var(--space-5) var(--content-padding);
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.settings-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.settings-page__account-id {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-bg-surface);
  word-break: break-all;
  font-family: monospace;
}

.settings-page__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-bg-surface);
  padding: var(--space-5);
}

.settings-page__section-title {
  font-weight: 700;
  letter-spacing: .01em;
}

.settings-page__item,
.settings-page__category-form,
.settings-page__category {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.settings-page__item-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
  min-width: 240px;
}

.settings-page__item-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.settings-page__select {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  padding: var(--space-3) var(--space-4);
  min-width: 12rem;
}

.settings-page__categories {
  display: grid;
  gap: var(--space-3);
}

.settings-page__category {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.settings-page__empty {
  color: var(--color-text-muted);
}

.settings-page__block {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.settings-page__file-input-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.settings-page__file-input {
  display: none;
}

.settings-page__file-name {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.34);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  z-index: var(--z-modal);
}

.modal-card {
  width: min(100%, 520px);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  background: var(--color-bg-surface);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.settings-page__danger-zone {
  border-color: var(--color-danger);
}

.settings-page__about {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.settings-page__form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-4) 0;
}

.settings-page__input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-family: inherit;
}

.settings-page__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-subtle);
}
</style>
