<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useApi } from '@/composables/useApi.js'
import { useAuthStore } from '@/stores/auth.store.js'
import BaseInput  from '@/components/atoms/BaseInput.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseText   from '@/components/atoms/BaseText.vue'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const email    = ref('')
const password = ref('')
const loading  = ref(false)
const errors   = ref({ email: '', password: '', global: '' })

function validate() {
  errors.value = { email: '', password: '', global: '' }
  let ok = true
  if (!email.value)    { errors.value.email    = 'L\'adresse email est requise.'; ok = false }
  if (!password.value) { errors.value.password = 'Le mot de passe est requis.';   ok = false }
  return ok
}

async function submit() {
  if (!validate()) return
  loading.value = true

  try {
    const api = useApi()
    const response = await api.post('/api/auth/login', {
      email: email.value.toLowerCase().trim(),
      password: password.value,
    })

    auth.setSession({ token: response.token, user: response.user })

    const redirect = route.query.redirect || '/expenses'
    router.push(redirect)
  } catch (err) {
    errors.value.global = err.message || 'Échec de la connexion. Vérifiez vos identifiants.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-page__card">
      <!-- Brand -->
      <div class="auth-page__brand">
        <span class="auth-page__logo" aria-hidden="true">🌑</span>
        <BaseText as="h1" size="3xl" weight="bold" color="primary">ABYSS</BaseText>
        <BaseText as="p" size="sm" color="muted">Connectez-vous à votre espace</BaseText>
      </div>

      <!-- Erreur globale -->
      <Transition name="fade">
        <div v-if="errors.global" class="auth-page__error" role="alert">
          <BaseText size="sm" color="danger">{{ errors.global }}</BaseText>
        </div>
      </Transition>

      <!-- Formulaire -->
      <form class="auth-page__form" novalidate @submit.prevent="submit">
        <BaseInput
          v-model="email"
          id="login-email"
          type="email"
          label="Adresse email"
          placeholder="vous@exemple.com"
          :error="errors.email"
          required
          autocomplete="email"
        />

        <BaseInput
          v-model="password"
          id="login-password"
          type="password"
          label="Mot de passe"
          placeholder="••••••••"
          :error="errors.password"
          required
          autocomplete="current-password"
        />

        <BaseButton
          type="submit"
          variant="primary"
          :loading="loading"
          full
        >
          Se connecter
        </BaseButton>
      </form>

      <!-- Lien inscription -->
      <p class="auth-page__footer-link">
        <BaseText size="sm" color="muted">Pas encore de compte ?</BaseText>
        <RouterLink to="/register" class="auth-page__link">
          <BaseText size="sm" color="brand" weight="medium">Créer un compte</BaseText>
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5) var(--content-padding);
  /* Fond légèrement différent du layout pour les pages auth */
  background: var(--color-bg-base);
}

.auth-page__card {
  width: 100%;
  max-width: 26rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.auth-page__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  text-align: center;
}

.auth-page__logo {
  font-size: 3rem;
  line-height: 1;
  filter: drop-shadow(0 0 20px rgba(79, 142, 247, 0.4));
}

.auth-page__error {
  background: var(--color-danger-subtle);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
}

.auth-page__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-page__footer-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.auth-page__link {
  /* héritage de la couleur via BaseText */
}

/* Text brand color */
:deep(.text--brand) { color: var(--color-primary); }

/* Transition fondu erreur globale */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
