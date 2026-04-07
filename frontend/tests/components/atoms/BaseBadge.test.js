import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseBadge from '@/components/atoms/BaseBadge.vue'

describe('BaseBadge', () => {
  it('renders default variant', () => {
    const w = mount(BaseBadge, {
      slots: { default: 'Badge' },
    })
    expect(w.classes()).toContain('badge')
  })

  it('renders success variant', () => {
    const w = mount(BaseBadge, {
      props: { variant: 'success' },
      slots: { default: 'Success' },
    })
    expect(w.classes()).toContain('badge--success')
  })

  it('renders warning variant', () => {
    const w = mount(BaseBadge, {
      props: { variant: 'warning' },
      slots: { default: 'Warning' },
    })
    expect(w.classes()).toContain('badge--warning')
  })

  it('renders danger variant', () => {
    const w = mount(BaseBadge, {
      props: { variant: 'danger' },
      slots: { default: 'Danger' },
    })
    expect(w.classes()).toContain('badge--danger')
  })

  it('renders info variant', () => {
    const w = mount(BaseBadge, {
      props: { variant: 'info' },
      slots: { default: 'Info' },
    })
    expect(w.classes()).toContain('badge--info')
  })

  it('renders small size', () => {
    const w = mount(BaseBadge, {
      props: { size: 'sm' },
      slots: { default: 'Small' },
    })
    expect(w.classes()).toContain('badge--sm')
  })

  it('renders medium size', () => {
    const w = mount(BaseBadge, {
      props: { size: 'md' },
      slots: { default: 'Medium' },
    })
    expect(w.classes()).toContain('badge--md')
  })

  it('hides dot indicator when false', () => {
    const w = mount(BaseBadge, {
      props: { dot: false },
      slots: { default: 'No Dot' },
    })
    expect(w.find('.badge__dot').exists()).toBe(false)
  })

  it('shows dot indicator when true', () => {
    const w = mount(BaseBadge, {
      props: { dot: true },
      slots: { default: 'With Dot' },
    })
    expect(w.find('.badge__dot').exists()).toBe(true)
  })

  it('renders text content', () => {
    const w = mount(BaseBadge, {
      slots: { default: 'Test Content' },
    })
    expect(w.text()).toContain('Test Content')
  })
})
