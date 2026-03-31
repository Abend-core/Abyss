import { computed } from 'vue'

/** Taille de l'alphabet selon les caractères présents dans le mot de passe */
function charsetSize(password) {
  let size = 0
  if (/[a-z]/.test(password)) size += 26     // minuscules
  if (/[A-Z]/.test(password)) size += 26     // majuscules
  if (/[0-9]/.test(password)) size += 10     // chiffres
  if (/[^a-zA-Z0-9]/.test(password)) size += 32 // caractères spéciaux (~)
  return size
}

/**
 * Calcule l'entropie Shannon en bits :
 *   H = log2(charset) × length
 *
 * Objectif cible : 150 bits
 */
export function useEntropy(passwordRef) {
  const TARGET   = 120
  const MAX_DISP = 120 // cap de la barre

  const entropy = computed(() => {
    const pwd = passwordRef.value ?? ''
    if (!pwd.length) return 0
    const cs = charsetSize(pwd)
    if (cs === 0) return 0
    return Math.log2(cs) * pwd.length
  })

  /** Pourcentage pour la barre (0–100), plafonné à 100 */
  const progress = computed(() =>
    Math.min((entropy.value / MAX_DISP) * 100, 100)
  )

  /** true quand l'entropie atteint l'objectif */
  const isStrong = computed(() => entropy.value >= TARGET)

  /**
   * Couleur de la barre selon le niveau
   *   0–49  → danger
   *   50–99 → warning
   *   100+  → success
   */
  const color = computed(() => {
    const e = entropy.value
    if (e >= 100) return 'success'
    if (e >= 50)  return 'warning'
    return 'danger'
  })

  /** Label textuel du niveau */
  const label = computed(() => {
    const e = entropy.value
    if (e === 0)   return ''
    if (e < 40)    return 'Très faible'
    if (e < 70)    return 'Faible'
    if (e < 100)   return 'Moyen'
    if (e < TARGET) return 'Bon'
    return 'Excellent'
  })

  return { entropy, progress, isStrong, color, label, TARGET }
}
