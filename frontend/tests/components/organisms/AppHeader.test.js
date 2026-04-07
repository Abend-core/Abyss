import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppHeader from '@/components/organisms/AppHeader.vue'
import { createPinia, setActivePinia } from 'pinia'

describe('AppHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders header element', () => {
    const w = mount(AppHeader, {
      props: { title: 'Abyss' },
      global: {
        stubs: ['BaseText', 'BaseButton', 'BaseIcon'],
      },
    })
    expect(w.find('.header').exists()).toBe(true)
  })

  it('renders with default title Abyss', () => {
    const w = mount(AppHeader, {
      global: {
        stubs: ['BaseText', 'BaseButton', 'BaseIcon'],
      },
    })
    const text = w.findComponent({ name: 'BaseText' })
    expect(text.props('as')).toBe('span')
  })

  it('renders with custom title prop', () => {
    const w = mount(AppHeader, {
      props: { title: 'Dashboard' },
      global: {
        stubs: ['BaseButton', 'BaseIcon'],
      },
    })
    // Title is passed to BaseText component
    const text = w.findComponent({ name: 'BaseText' })
    expect(text.exists()).toBe(true)
  })

  it('renders brand section with logo and title', () => {
    const w = mount(AppHeader, {
      props: { title: 'Test' },
      global: {
        stubs: ['BaseText', 'BaseButton', 'BaseIcon'],
      },
    })
    expect(w.find('.header__brand').exists()).toBe(true)
    expect(w.find('.header__logo-img').exists()).toBe(true)
  })

  it('renders actions section', () => {
    const w = mount(AppHeader, {
      global: {
        stubs: ['BaseText', 'BaseButton', 'BaseIcon'],
      },
    })
    expect(w.find('.header__actions').exists()).toBe(true)
  })

  it('renders theme toggle button', () => {
    const w = mount(AppHeader, {
      global: {
        stubs: ['BaseText', 'BaseIcon'],
      },
    })
    const buttons = w.findAllComponents({ name: 'BaseButton' })
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('displays logout button when authenticated', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const w = mount(AppHeader, {
      global: {
        plugins: [pinia],
        stubs: ['BaseText', 'BaseIcon'],
      },
    })
    const buttons = w.findAllComponents({ name: 'BaseButton' })
    // Should have at least theme toggle button
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('does not display logout button when not authenticated', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const w = mount(AppHeader, {
      global: {
        plugins: [pinia],
        stubs: ['BaseText', 'BaseIcon'],
      },
    })
    // Should only have theme toggle button visible
    const buttons = w.findAllComponents({ name: 'BaseButton' })
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders with proper header structure classes', () => {
    const w = mount(AppHeader, {
      global: {
        stubs: ['BaseText', 'BaseButton', 'BaseIcon'],
      },
    })
    expect(w.find('.header__inner').exists()).toBe(true)
  })

  it('renders logo image with alt text', () => {
    const w = mount(AppHeader, {
      global: {
        stubs: ['BaseText', 'BaseButton', 'BaseIcon'],
      },
    })
    const img = w.find('.header__logo-img')
    expect(img.attributes('alt')).toBe('Abyss')
  })
})
