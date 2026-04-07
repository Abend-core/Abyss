import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseIcon from '@/components/atoms/BaseIcon.vue'

describe('BaseIcon', () => {
  it('rendu avec classe ri-{name}', () => {
    const w = mount(BaseIcon, { props: { name: 'home-line' } })
    expect(w.classes()).toContain('ri-home-line')
  })

  it('size 16 par défaut', () => {
    const w = mount(BaseIcon, { props: { name: 'home-line' } })
    expect(w.element.style.width).toBe('16px')
    expect(w.element.style.height).toBe('16px')
  })

  it('utilise la prop size si spécifiée', () => {
    const w = mount(BaseIcon, { props: { name: 'home-line', size: 24 } })
    expect(w.element.style.width).toBe('24px')
    expect(w.element.style.height).toBe('24px')
  })

  it('class "icon" toujours présente', () => {
    const w = mount(BaseIcon, { props: { name: 'home-line' } })
    expect(w.classes()).toContain('icon')
  })

  it('aria-hidden true par défaut', () => {
    const w = mount(BaseIcon, { props: { name: 'home-line' } })
    expect(w.attributes('aria-hidden')).toBe('true')
  })
})
