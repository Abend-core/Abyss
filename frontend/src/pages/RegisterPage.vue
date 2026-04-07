<script setup>
import { ref } from 'vue'
import { useRouter }     from 'vue-router'
import { useApi }        from '@/composables/useApi.js'
import { useEntropy }    from '@/composables/useEntropy.js'
import BaseInput          from '@/components/atoms/BaseInput.vue'
import BaseButton         from '@/components/atoms/BaseButton.vue'
import BaseText           from '@/components/atoms/BaseText.vue'
import PasswordStrength   from '@/components/molecules/PasswordStrength.vue'
import logoUrl            from '@/assets/logo.png'

const router = useRouter()
const api = useApi()

const email    = ref('')
const password = ref('')
const confirm  = ref('')
const loading  = ref(false)
const errors   = ref({ email: '', password: '', confirm: '', global: '' })

const { isStrong } = useEntropy(password)

function validate() {
  errors.value = { email: '', password: '', confirm: '', global: '' }
  let ok = true

  if (!email.value) {
    errors.value.email = 'L\'adresse email est requise.'
    ok = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.value.email = 'L\'adresse email n\'est pas valide.'
    ok = false
  }

  if (!password.value) {
    errors.value.password = 'Le mot de passe est requis.'
    ok = false
  } else if (!isStrong.value) {
    errors.value.password = 'Le mot de passe doit atteindre le niveau Excellent (120 bits).'
    ok = false
  }

  if (password.value !== confirm.value) {
    errors.value.confirm = 'Les mots de passe ne correspondent pas.'
    ok = false
  }

  return ok
}

async function submit() {
  if (!validate()) return

  loading.value = true
  errors.value.global = ''

  try {
    const data = await api.post('/api/auth/register', {
      email: email.value.trim(),
      password: password.value,
    })

    if (!data || !data.id) {
      errors.value.global = 'Impossible de créer le compte, réessayez.'
      return
    }

    // redirect vers login après création
    router.push('/login')
  } catch (err) {
    errors.value.global = api.error || err.message || 'Erreur réseau, réessayez.'
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
        <img :src="logoUrl" alt="Abyss" class="auth-page__logo-img" />
        <BaseText as="h1" size="3xl" weight="bold" color="primary">ABYSS</BaseText>
        <BaseText as="p" size="sm" color="muted">Créez votre compte</BaseText>
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
          id="register-email"
          type="email"
          label="Adresse email"
          placeholder="vous@exemple.com"
          :error="errors.email"
          required
          autocomplete="email"
        />

        <div class="auth-page__password-group">
          <BaseInput
            v-model="password"
            id="register-password"
            type="password"
            label="Mot de passe"
            placeholder="••••••••"
            :error="errors.password"
            required
            autocomplete="new-password"
          />

          <!-- Barre d'entropie — s'affiche dès la première lettre -->
          <PasswordStrength :password="password" />
        </div>

        <BaseInput
          v-model="confirm"
          id="register-confirm"
          type="password"
          label="Confirmer le mot de passe"
          placeholder="••••••••"
          :error="errors.confirm"
          required
          autocomplete="new-password"
        />

        <BaseButton
          type="submit"
          variant="primary"
          :loading="loading"
          full
        >
          Créer mon compte
        </BaseButton>
      </form>

      <!-- Lien connexion -->
      <p class="auth-page__footer-link">
        <BaseText size="sm" color="muted">Déjà un compte ?</BaseText>
        <RouterLink to="/login" class="auth-page__link">
          <BaseText size="sm" color="brand" weight="medium">Se connecter</BaseText>
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
  padding: var(--space-8) var(--content-padding);
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

.auth-page__logo-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 16px;
  display: block;
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

/* Groupe password + barre d'entropie */
.auth-page__password-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.auth-page__footer-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

:deep(.text--brand) { color: var(--color-primary); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
