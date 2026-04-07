import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseStepper from '@/components/atoms/BaseStepper.vue'

describe('BaseStepper', () => {
  it('affiche le label si fourni', () => {
    const w = mount(BaseStepper, { props: { label: 'Quantité' } })
    expect(w.text()).toContain('Quantité')
  })

  it('modelValue par défaut à 0', () => {
    const w = mount(BaseStepper)
    expect(w.find('input').element.value).toBe('0.00')
  })

  it('affiche la valeur modelValue', () => {
    const w = mount(BaseStepper, { props: { modelValue: '5' } })
    expect(w.find('input').element.value).toBe('5')
  })

  it('disabled peut être appliqué', () => {
    const w = mount(BaseStepper, { props: { disabled: true } })
    expect(w.find('input').element.disabled).toBe(true)
  })

  it('bouton decrement émit update avec valeur minus step', async () => {
    const w = mount(BaseStepper, { props: { modelValue: '10', step: 1 } })
    await w.find('.stepper-field__btn--decrement').trigger('click')
    expect(w.emitted('update:modelValue')).toBeTruthy()
    expect(w.emitted('update:modelValue')[0]).toEqual(['9.00'])
  })

  it('bouton increment émit update avec valeur plus step', async () => {
    const w = mount(BaseStepper, { props: { modelValue: '10', step: 1 } })
    await w.find('.stepper-field__btn--increment').trigger('click')
    expect(w.emitted('update:modelValue')).toBeTruthy()
    expect(w.emitted('update:modelValue')[0]).toEqual(['11.00'])
  })

  it('respect le min', async () => {
    const w = mount(BaseStepper, { props: { modelValue: '0', min: 0, step: 1 } })
    await w.find('.stepper-field__btn--decrement').trigger('click')
    // Ne devrait pas baisser en dessous de min
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('respect le max', async () => {
    const w = mount(BaseStepper, { props: { modelValue: '100', max: 100, step: 1 } })
    await w.find('.stepper-field__btn--increment').trigger('click')
    // Ne devrait pas monter au-dessus de max
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('affiche error si fourni', () => {
    const w = mount(BaseStepper, { props: { error: 'Valeur invalide' } })
    expect(w.classes()).toContain('stepper-field--error')
  })
})
