/**
 * Tests composant — BaseButton
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '../../../src/components/atoms/BaseButton.vue'

describe('BaseButton', () => {
  it('affiche le slot content', () => {
    const w = mount(BaseButton, { slots: { default: 'Envoyer' } })
    expect(w.text()).toContain('Envoyer')
  })

  it('type button par défaut', () => {
    const w = mount(BaseButton)
    expect(w.find('button').attributes('type')).toBe('button')
  })

  it('type submit si spécifié', () => {
    const w = mount(BaseButton, { props: { type: 'submit' } })
    expect(w.find('button').attributes('type')).toBe('submit')
  })

  it('classe btn--primary par défaut', () => {
    const w = mount(BaseButton)
    expect(w.find('button').classes()).toContain('btn--primary')
  })

  it('classe btn--danger si variant="danger"', () => {
    const w = mount(BaseButton, { props: { variant: 'danger' } })
    expect(w.find('button').classes()).toContain('btn--danger')
  })

  it('classe btn--full si full=true', () => {
    const w = mount(BaseButton, { props: { full: true } })
    expect(w.find('button').classes()).toContain('btn--full')
  })

  it('est désactivé si disabled=true', () => {
    const w = mount(BaseButton, { props: { disabled: true } })
    expect(w.find('button').element.disabled).toBe(true)
  })

  it('est désactivé si loading=true', () => {
    const w = mount(BaseButton, { props: { loading: true } })
    expect(w.find('button').element.disabled).toBe(true)
  })

  it('affiche le spinner si loading=true', () => {
    const w = mount(BaseButton, { props: { loading: true } })
    expect(w.find('.btn__spinner').exists()).toBe(true)
  })

  it('ne montre pas le spinner sans loading', () => {
    const w = mount(BaseButton, { props: { loading: false } })
    expect(w.find('.btn__spinner').exists()).toBe(false)
  })

  it('classe btn--loading si loading=true', () => {
    const w = mount(BaseButton, { props: { loading: true } })
    expect(w.find('button').classes()).toContain('btn--loading')
  })
})
