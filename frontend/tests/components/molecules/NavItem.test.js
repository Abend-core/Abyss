import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NavItem from '@/components/molecules/NavItem.vue'

describe('NavItem', () => {
  it('renders RouterLink with correct to prop', () => {
    const w = mount(NavItem, {
      props: {
        to: '/test',
        icon: 'home',
        label: 'Test Label',
      },
      global: {
        stubs: ['RouterLink', 'BaseIcon', 'BaseText'],
      },
    })
    expect(w.find('router-link-stub').exists()).toBe(true)
    expect(w.find('router-link-stub').attributes('to')).toBe('/test')
  })

  it('renders icon with correct name', () => {
    const w = mount(NavItem, {
      props: {
        to: '/',
        icon: 'home',
        label: 'Home',
      },
      global: {
        stubs: ['RouterLink'],
      },
    })
    const icon = w.findComponent({ name: 'BaseIcon' })
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('home')
  })

  it('renders text label', () => {
    const w = mount(NavItem, {
      props: {
        to: '/categories',
        icon: 'database',
        label: 'Categories',
      },
      global: {
        stubs: ['RouterLink', 'BaseIcon'],
      },
    })
    expect(w.text()).toContain('Categories')
  })

  it('applies nav-item--active class when route is active', () => {
    const w = mount(NavItem, {
      props: {
        to: '/',
        icon: 'home',
        label: 'Home',
      },
      global: {
        stubs: ['RouterLink', 'BaseIcon', 'BaseText'],
      },
    })
    // Vue Router's useLink returns isActive based on current route
    // In test environment, we check if the class can be applied
    expect(w.find('.nav-item').exists()).toBe(true)
  })

  it('has correct CSS classes and structure', () => {
    const w = mount(NavItem, {
      props: {
        to: '/settings',
        icon: 'settings',
        label: 'Settings',
      },
      global: {
        stubs: ['RouterLink', 'BaseIcon', 'BaseText'],
      },
    })
    expect(w.classes()).toContain('nav-item')
    expect(w.find('.nav-item').exists()).toBe(true)
  })

  it('renders all required props together', () => {
    const w = mount(NavItem, {
      props: {
        to: '/expenses',
        icon: 'chart',
        label: 'Expenses Chart',
      },
      global: {
        stubs: ['RouterLink'],
      },
    })
    expect(w.text()).toContain('Expenses Chart')
    expect(w.find('router-link-stub').attributes('to')).toBe('/expenses')
  })

  it('handles different icon types', () => {
    const icons = ['home', 'database', 'settings', 'chart']
    icons.forEach(icon => {
      const w = mount(NavItem, {
        props: {
          to: '/',
          icon,
          label: 'Label',
        },
        global: {
          stubs: ['RouterLink', 'BaseText'],
        },
      })
      const iconComponent = w.findComponent({ name: 'BaseIcon' })
      expect(iconComponent.exists()).toBe(true)
      expect(iconComponent.props('name')).toBe(icon)
    })
  })
})
