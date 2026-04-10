import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'
import { useAuthStore } from '@/stores/auth.store.js'
import { useAppStore } from '@/stores/app.store.js'

export function useSettingsPage() {
  const router = useRouter()
  const { api } = useApi()
  const authStore = useAuthStore()
  const appStore = useAppStore()

  // ── État ──────────────────────────────────────────
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

  // ── Load settings ─────────────────────────────────
  async function loadSettings() {
    try {
      const account = await api('/api/user')
      accountId.value = account.id
      currency.value = account.settings?.currency ?? 'EUR'
    } catch (error) {
      const message = error.message || 'Impossible de charger les paramètres.'
      appStore.notify({ type: 'error', message })
      console.error('Settings load error:', error)
    }
  }

  // ── Save currency ─────────────────────────────────
  async function saveCurrency(newCurrency) {
    const value = newCurrency || currency.value
    try {
      await api('/api/user', { method: 'PUT', body: { currency: value } })
      appStore.notify({
        type: 'success',
        message: 'Devise mise à jour. Les montants seront recalculés au prochain chargement.',
      })
      await loadSettings()
    } catch (error) {
      appStore.notify({ type: 'error', message: error.message || 'Impossible d\'enregistrer les paramètres.' })
    }
  }

  // ── Export data ───────────────────────────────────
  async function exportData() {
    showExportPasswordModal.value = true
  }

  async function confirmExport() {
    if (!exportPassword.value.trim()) {
      appStore.notify({ type: 'warning', message: 'Veuillez entrer votre mot de passe.' })
      return
    }

    isExporting.value = true
    await nextTick()
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

  // ── Import data ───────────────────────────────────
  function selectImportFile() {
    fileInput.value?.click()
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    selectedFile.value = file
    selectedFileName.value = file.name
  }

  async function confirmImport() {
    if (!selectedFile.value) return
    try {
      const text = await selectedFile.value.text()
      const data = JSON.parse(text)

      const confirmMsg = `Êtes-vous sûr ? Cette action basculera vos données actuelles avec le fichier importé.`
      if (!confirm(confirmMsg)) return

      await api('/api/account/import', {
        method: 'POST',
        body: data,
      })
      appStore.notify({ type: 'success', message: 'Données importées. Redirection en cours...' })
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      appStore.notify({ type: 'error', message: error.message || 'Impossible d importer fichier.' })
    }
  }

  function cancelImport() {
    selectedFile.value = null
    selectedFileName.value = ''
    fileInput.value.value = ''
  }

  // ── Delete account ────────────────────────────────
  async function confirmDeleteAccount() {
    if (!confirm('Cette action est irréversible. Êtes-vous absolument sûr ?')) return
    showDeleteModal.value = false
    try {
      await api('/api/user/delete', { method: 'DELETE' })
      appStore.notify({ type: 'success', message: 'Compte supprimé. Redirection...' })
      setTimeout(() => {
        authStore.logout()
        router.push('/login')
      }, 1000)
    } catch (error) {
      appStore.notify({
        type: 'error',
        message: error.message || 'Impossible de supprimer le compte.',
      })
    }
  }

  onMounted(loadSettings)

  return {
    // État
    accountId,
    currency,
    selectedFile,
    selectedFileName,
    showDeleteModal,
    fileInput,
    showExportPasswordModal,
    exportPassword,
    isExporting,

    // Constantes
    currencyOptions,

    // Fonctions
    loadSettings,
    saveCurrency,
    exportData,
    confirmExport,
    cancelExport,
    selectImportFile,
    handleFileChange,
    confirmImport,
    cancelImport,
    confirmDeleteAccount,
  }
}
