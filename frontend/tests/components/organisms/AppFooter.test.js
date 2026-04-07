import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFooter from '@/components/organisms/AppFooter.vue'
import { createPinia, setActivePinia } from 'pinia'

describe('AppFooter', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders footer element with aria label', () => {
    const w = mount(AppFooter, {
      global: {
        stubs: ['NavItem', 'BaseButton'],
      },
    })
    expect(w.find('.app-footer').exists()).toBe(true)
    expect(w.find('footer').attributes('aria-label')).toBe('Navigation principale')
  })

  it('renders navigation list', () => {
    const w = mount(AppFooter, {
      global: {
        stubs: ['NavItem', 'BaseButton'],
      },
    })
    expect(w.find('.app-footer__nav').exists()).toBe(true)
  })

  it('renders 5 NavItems for each route', () => {
    const w = mount(AppFooter, {
      global: {
        stubs: ['BaseButton'],
      },
    })
    const navItems = w.findAllComponents({ name: 'NavItem' })
    expect(navItems.length).toBe(5)
  })

  it('passes correct props to NavItem components', () => {
    const w = mount(AppFooter, {
      global: {
        stubs: ['BaseButton'],
      },
    })
    const navItems = w.findAllComponents({ name: 'NavItem' })
    expect(navItems[0].props('to')).toBe('/stats')
    expect(navItems[0].props('icon')).toBe('chart')
    expect(navItems[0].props('label')).toBe('Stats')
  })

  it('renders FAB (floating action button)', () => {
    const w = mount(AppFooter, {
      global: {
        stubs: ['NavItem'],
      },
    })
    const fab = w.find('.app-footer__fab')
    expect(fab.exists()).toBe(true)
  })

  it('FAB has correct aria label', () => {
    const w = mount(AppFooter, {
      global: {
        stubs: ['NavItem'],
      },
    })
    const fab = w.find('.app-footer__fab')
    expect(fab.attributes('aria-label')).toBe('Ajouter une opération')
  })

  it('FAB renders emoji content', () => {
    const w = mount(AppFooter, {
      global: {
        stubs: ['NavItem'],
      },
    })
    const fab = w.find('.app-footer__fab')
    expect(fab.text()).toBe('➕')
  })

  it('FAB button is BaseButton component', () => {
    const w = mount(AppFooter, {
      global: {
        stubs: ['NavItem'],
      },
    })
    const btn = w.findComponent({ name: 'BaseButton' })
    expect(btn.exists()).toBe(true)
    expect(btn.classes()).toContain('app-footer__fab')
  })

  it('all NavItem routes are configured correctly', () => {
    const w = mount(AppFooter, {
      global: {
        stubs: ['BaseButton'],
      },
    })
    const navItems = w.findAllComponents({ name: 'NavItem' })
    const routes = [
      { to: '/stats', icon: 'chart', label: 'Stats' },
      { to: '/operations', icon: 'database', label: 'Opérations' },
      { to: '/', icon: 'home', label: 'Accueil' },
      { to: '/categories', icon: 'database', label: 'Catégories' },
      { to: '/settings', icon: 'settings', label: 'Compte' },
    ]
    navItems.forEach((item, idx) => {
      expect(item.props('to')).toBe(routes[idx].to)
      expect(item.props('icon')).toBe(routes[idx].icon)
      expect(item.props('label')).toBe(routes[idx].label)
    })
  })

  it('renders with correct CSS classes', () => {
    const w = mount(AppFooter, {
      global: {
        stubs: ['NavItem', 'BaseButton'],
      },
    })
    expect(w.find('footer').classes()).toContain('app-footer')
    expect(w.find('nav').classes()).toContain('app-footer__nav')
  })
})
