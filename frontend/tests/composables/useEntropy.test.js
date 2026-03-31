/**
 * Tests unitaires — composable useEntropy
 */

import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useEntropy } from '../../src/composables/useEntropy.js'

describe('useEntropy', () => {
  function makeEntropy(password) {
    const pw = ref(password)
    return useEntropy(pw)
  }

  describe('entropy', () => {
    it('retourne 0 pour un mot de passe vide', () => {
      const { entropy } = makeEntropy('')
      expect(entropy.value).toBe(0)
    })

    it('valeur positive pour un mot de passe non vide', () => {
      const { entropy } = makeEntropy('abc')
      expect(entropy.value).toBeGreaterThan(0)
    })

    it('augmente avec la longueur', () => {
      const { entropy: e1 } = makeEntropy('abc')
      const { entropy: e2 } = makeEntropy('abcdef')
      expect(e2.value).toBeGreaterThan(e1.value)
    })

    it('augmente avec la diversité des caractères', () => {
      const { entropy: e1 } = makeEntropy('aaaaaa')    // que minuscules : charset 26
      const { entropy: e2 } = makeEntropy('aA1!aA')    // tout : charset 26+26+10+32 = 94
      expect(e2.value).toBeGreaterThan(e1.value)
    })

    it('est réactif — change quand la ref change', () => {
      const pw = ref('abc')
      const { entropy } = useEntropy(pw)
      const before = entropy.value
      pw.value = 'abcABC123!'
      expect(entropy.value).toBeGreaterThan(before)
    })
  })

  describe('isStrong (cible 120 bits)', () => {
    it('false pour un mot de passe faible', () => {
      const { isStrong } = makeEntropy('abc')
      expect(isStrong.value).toBe(false)
    })

    it('true pour un mot de passe >= 120 bits d\'entropie', () => {
      // "aA1!aA1!aA1!aA1!aA1!aA" : 94^22 > 2^120
      const { isStrong } = makeEntropy('aA1!aA1!aA1!aA1!aA1!aA')
      expect(isStrong.value).toBe(true)
    })
  })

  describe('color', () => {
    it('danger pour entropie < 50', () => {
      const { color } = makeEntropy('abc')
      expect(color.value).toBe('danger')
    })

    it('warning pour entropie entre 50 et 99', () => {
      // "abcABC123" → charset 62, longueur 9 → ~53.7 bits
      const { color } = makeEntropy('abcABC123')
      expect(color.value).toBe('warning')
    })

    it('success pour entropie >= 100', () => {
      // "aA1!aA1!aA1!aA1!" → charset 94, longueur 16 → ~104.6 bits
      const { color } = makeEntropy('aA1!aA1!aA1!aA1!')
      expect(color.value).toBe('success')
    })
  })

  describe('progress', () => {
    it('0 pour mot de passe vide', () => {
      const { progress } = makeEntropy('')
      expect(progress.value).toBe(0)
    })

    it('100 max — plafonné même si entropie > MAX_DISP', () => {
      const { progress } = makeEntropy('aA1!aA1!aA1!aA1!aA1!aA1!aA1!aA1!')
      expect(progress.value).toBe(100)
    })

    it('valeur proportionnelle sous le plafond', () => {
      const { progress } = makeEntropy('abc') // entropie faible
      expect(progress.value).toBeGreaterThan(0)
      expect(progress.value).toBeLessThan(100)
    })
  })

  describe('label', () => {
    it('vide pour password vide', () => {
      const { label } = makeEntropy('')
      expect(label.value).toBe('')
    })

    it('Excellent pour un mot de passe très fort', () => {
      const { label } = makeEntropy('aA1!aA1!aA1!aA1!aA1!aA1!aA1!aA1!')
      expect(label.value).toBe('Excellent')
    })
  })
})
