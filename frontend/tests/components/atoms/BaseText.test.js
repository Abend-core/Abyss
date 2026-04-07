import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseText from '@/components/atoms/BaseText.vue'

describe('BaseText', () => {
  it('affiche le contenu du slot', () => {
    const w = mount(BaseText, { slots: { default: 'Hello World' } })
    expect(w.text()).toBe('Hello World')
  })

  it('tag span par défaut', () => {
    const w = mount(BaseText)
    expect(w.element.tagName).toBe('SPAN')
  })

  it('peut être un tag p si as="p"', () => {
    const w = mount(BaseText, { props: { as: 'p' } })
    expect(w.element.tagName).toBe('P')
  })

  it('peut être un tag h1 si as="h1"', () => {
    const w = mount(BaseText, { props: { as: 'h1' } })
    expect(w.element.tagName).toBe('H1')
  })

  it('classe text--base par défaut', () => {
    const w = mount(BaseText)
    expect(w.classes()).toContain('text--base')
  })

  it('classe text--xs si size="xs"', () => {
    const w = mount(BaseText, { props: { size: 'xs' } })
    expect(w.classes()).toContain('text--xs')
  })

  it('classe text--primary si color="primary"', () => {
    const w = mount(BaseText, { props: { color: 'primary' } })
    expect(w.classes()).toContain('text--primary')
  })

  it('classe text--semibold si weight="semibold"', () => {
    const w = mount(BaseText, { props: { weight: 'semibold' } })
    expect(w.classes()).toContain('text--semibold')
  })

  it('classe text--mono si mono=true', () => {
    const w = mount(BaseText, { props: { mono: true } })
    expect(w.classes()).toContain('text--mono')
  })

  it('classe text--truncate si truncate=true', () => {
    const w = mount(BaseText, { props: { truncate: true } })
    expect(w.classes()).toContain('text--truncate')
  })
})
