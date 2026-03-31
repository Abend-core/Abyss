/**
 * Tests composant — BaseInput
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseInput from '../../../src/components/atoms/BaseInput.vue'

describe('BaseInput', () => {
  it('affiche le label si fourni', () => {
    const w = mount(BaseInput, { props: { label: 'Email', id: 'inp-email' } })
    expect(w.find('label').text()).toContain('Email')
  })

  it('n\'affiche pas de label si absent', () => {
    const w = mount(BaseInput, { props: { id: 'inp-test' } })
    expect(w.find('label').exists()).toBe(false)
  })

  it('affiche une étoile * si required', () => {
    const w = mount(BaseInput, { props: { label: 'Email', required: true, id: 'inp-req' } })
    expect(w.find('.field__required').exists()).toBe(true)
  })

  it('émet update:modelValue à l\'input', async () => {
    const w = mount(BaseInput, { props: { modelValue: '', id: 'inp-emit' } })
    await w.find('input').setValue('test@example.com')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['test@example.com'])
  })

  it('affiche le message d\'erreur et classe --error', () => {
    const w = mount(BaseInput, {
      props: { id: 'inp-err', error: 'Champ requis' }
    })
    expect(w.find('.field').classes()).toContain('field--error')
    expect(w.find('[role="alert"]').text()).toBe('Champ requis')
  })

  it('n\'affiche pas de message d\'erreur sans erreur', () => {
    const w = mount(BaseInput, { props: { id: 'inp-ok' } })
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('affiche le hint si fourni (et pas d\'erreur)', () => {
    const w = mount(BaseInput, { props: { id: 'inp-hint', hint: 'Astuce' } })
    expect(w.find('.field__message--hint').text()).toBe('Astuce')
  })

  describe('type password', () => {
    it('affiche le bouton oeil pour type=password', () => {
      const w = mount(BaseInput, { props: { type: 'password', id: 'inp-pw' } })
      expect(w.find('.field__eye').exists()).toBe(true)
    })

    it('bascule le type input en texte au clic sur l\'oeil', async () => {
      const w = mount(BaseInput, { props: { type: 'password', id: 'inp-toggle' } })
      expect(w.find('input').attributes('type')).toBe('password')
      await w.find('.field__eye').trigger('click')
      expect(w.find('input').attributes('type')).toBe('text')
    })

    it('re-masque le mot de passe au 2e clic', async () => {
      const w = mount(BaseInput, { props: { type: 'password', id: 'inp-toggle2' } })
      await w.find('.field__eye').trigger('click')
      await w.find('.field__eye').trigger('click')
      expect(w.find('input').attributes('type')).toBe('password')
    })

    it('n\'affiche PAS l\'oeil pour type=text', () => {
      const w = mount(BaseInput, { props: { type: 'text', id: 'inp-text' } })
      expect(w.find('.field__eye').exists()).toBe(false)
    })
  })

  it('désactive le champ si disabled', () => {
    const w = mount(BaseInput, { props: { disabled: true, id: 'inp-dis' } })
    expect(w.find('input').attributes('disabled')).toBeDefined()
    expect(w.find('.field').classes()).toContain('field--disabled')
  })
})
