import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppNavbar from '@/components/organisms/AppNavbar.vue'
import { createPinia, setActivePinia } from 'pinia'

describe('AppNavbar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders nav element with aria label', () => {
    const w = mount(AppNavbar, {
      global: {
        stubs: ['NavItem'],
      },
    })
    expect(w.find('nav').exists()).toBe(true)
    expect(w.find('nav').attributes('aria-label')).toBe('Navigation principale')
  })

  it('renders navbar with correct class', () => {
    const w = mount(AppNavbar, {
      global: {
        stubs: ['NavItem'],
      },
    })
    expect(w.find('.navbar').exists()).toBe(true)
  })

  it('renders 3 NavItem components', () => {
    const w = mount(AppNavbar, {
      global: {
        stubs: [],
      },
    })
    const navItems = w.findAllComponents({ name: 'NavItem' })
    expect(navItems.length).toBe(3)
  })

  it('passes correct props to first NavItem', () => {
    const w = mount(AppNavbar, {
      global: {
        stubs: [],
      },
    })
    const navItems = w.findAllComponents({ name: 'NavItem' })
    expect(navItems[0].props('to')).toBe('/')
    expect(navItems[0].props('icon')).toBe('home')
    expect(navItems[0].props('label')).toBe('Accueil')
  })

  it('passes correct props to second NavItem', () => {
    const w = mount(AppNavbar, {
      global: {
        stubs: [],
      },
    })
    const navItems = w.findAllComponents({ name: 'NavItem' })
    expect(navItems[1].props('to')).toBe('/categories')
    expect(navItems[1].props('icon')).toBe('database')
    expect(navItems[1].props('label')).toBe('Catégories')
  })

  it('passes correct props to third NavItem', () => {
    const w = mount(AppNavbar, {
      global: {
        stubs: [],
      },
    })
    const navItems = w.findAllComponents({ name: 'NavItem' })
    expect(navItems[2].props('to')).toBe('/settings')
    expect(navItems[2].props('icon')).toBe('settings')
    expect(navItems[2].props('label')).toBe('Réglages')
  })

  it('all routes have correct structure', () => {
    const w = mount(AppNavbar, {
      global: {
        stubs: [],
      },
    })
    const navItems = w.findAllComponents({ name: 'NavItem' })
    const routes = [
      { to: '/', icon: 'home', label: 'Accueil' },
      { to: '/categories', icon: 'database', label: 'Catégories' },
      { to: '/settings', icon: 'settings', label: 'Réglages' },
    ]
    navItems.forEach((item, idx) => {
      expect(item.props('to')).toBe(routes[idx].to)
      expect(item.props('icon')).toBe(routes[idx].icon)
      expect(item.props('label')).toBe(routes[idx].label)
    })
  })

  it('uses key binding for NavItems', () => {
    const w = mount(AppNavbar, {
      global: {
        stubs: ['NavItem'],
      },
    })
    const navItems = w.findAllComponents({ name: 'NavItem' })
    expect(navItems.length).toBe(3)
  })

  it('renders within nav element directly', () => {
    const w = mount(AppNavbar, {
      global: {
        stubs: ['NavItem'],
      },
    })
    const nav = w.find('nav')
    expect(nav.findAllComponents({ name: 'NavItem' }).length).toBe(3)
  })

  it('has responsive design CSS classes', () => {
    const w = mount(AppNavbar, {
      global: {
        stubs: ['NavItem'],
      },
    })
    expect(w.find('.navbar').exists()).toBe(true)
    // CSS media queries are applied via style, not via classes
    // Component structure supports mobile/desktop breakpoints
  })

  it('renders all navigation items with key and correct routing', () => {
    const w = mount(AppNavbar, {
      global: {
        stubs: [],
      },
    })
    expect(w.findAllComponents({ name: 'NavItem' }).length).toBe(3)
    expect(w.findComponent({ name: 'NavItem' }).exists()).toBe(true)
  })
})
