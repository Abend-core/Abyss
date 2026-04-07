import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseLoader from '@/components/atoms/BaseLoader.vue'

describe('BaseLoader', () => {
  it('rendu correctement', () => {
    const w = mount(BaseLoader)
    expect(w.find('.loader').exists()).toBe(true)
  })

  it('size md par défaut', () => {
    const w = mount(BaseLoader)
    expect(w.classes()).toContain('loader--md')
  })

  it('classe loader--sm si size="sm"', () => {
    const w = mount(BaseLoader, { props: { size: 'sm' } })
    expect(w.classes()).toContain('loader--sm')
  })

  it('classe loader--lg si size="lg"', () => {
    const w = mount(BaseLoader, { props: { size: 'lg' } })
    expect(w.classes()).toContain('loader--lg')
  })

  it('variant primary par défaut', () => {
    const w = mount(BaseLoader)
    expect(w.classes()).toContain('loader--primary')
  })

  it('classe loader--secondary si variant="secondary"', () => {
    const w = mount(BaseLoader, { props: { variant: 'secondary' } })
    expect(w.classes()).toContain('loader--secondary')
  })
})
