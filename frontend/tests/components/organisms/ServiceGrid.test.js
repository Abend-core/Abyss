import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ServiceGrid from '@/components/organisms/ServiceGrid.vue'

describe('ServiceGrid', () => {
  it('renders section with correct class', () => {
    const w = mount(ServiceGrid, {
      props: {
        services: [],
        isChecking: false,
      },
      global: {
        stubs: ['ServiceCard', 'BaseLoader', 'BaseText'],
      },
    })
    expect(w.find('.service-grid').exists()).toBe(true)
  })

  it('shows loading state when checking and no services checked', () => {
    const w = mount(ServiceGrid, {
      props: {
        services: [
          { id: '1', name: 'Service 1', lastChecked: null },
          { id: '2', name: 'Service 2', lastChecked: null },
        ],
        isChecking: true,
      },
      global: {
        stubs: ['ServiceCard', 'BaseText'],
      },
    })
    expect(w.find('.service-grid__loading').exists()).toBe(true)
  })

  it('renders loader component when checking', () => {
    const w = mount(ServiceGrid, {
      props: {
        services: [],
        isChecking: true,
      },
      global: {
        stubs: ['ServiceCard', 'BaseText'],
      },
    })
    const loader = w.findComponent({ name: 'BaseLoader' })
    expect(loader.exists()).toBe(true)
  })

  it('renders loading text message', () => {
    const w = mount(ServiceGrid, {
      props: {
        services: [],
        isChecking: true,
      },
      global: {
        stubs: ['ServiceCard'],
      },
    })
    expect(w.text()).toContain('Vérification des services')
  })

  it('shows loading state with correct size', () => {
    const w = mount(ServiceGrid, {
      props: {
        services: [],
        isChecking: true,
      },
      global: {
        stubs: ['ServiceCard', 'BaseText'],
      },
    })
    const loader = w.findComponent({ name: 'BaseLoader' })
    expect(loader.props('size')).toBe('lg')
  })

  it('renders service cards grid when not loading', () => {
    const services = [
      { id: '1', name: 'API', lastChecked: '2025-01-23T10:00:00Z' },
      { id: '2', name: 'DB', lastChecked: '2025-01-23T10:00:00Z' },
    ]
    const w = mount(ServiceGrid, {
      props: { services, isChecking: false },
      global: {
        stubs: ['BaseLoader', 'BaseText'],
      },
    })
    expect(w.find('.service-grid__cards').exists()).toBe(true)
  })

  it('renders ServiceCard for each service', () => {
    const services = [
      { id: '1', name: 'API', lastChecked: '2025-01-23T10:00:00Z' },
      { id: '2', name: 'DB', lastChecked: '2025-01-23T10:00:00Z' },
      { id: '3', name: 'Cache', lastChecked: '2025-01-23T10:00:00Z' },
    ]
    const w = mount(ServiceGrid, {
      props: { services, isChecking: false },
      global: {
        stubs: ['BaseLoader', 'BaseText'],
      },
    })
    const cards = w.findAllComponents({ name: 'ServiceCard' })
    expect(cards.length).toBe(3)
  })

  it('passes service prop to ServiceCard', () => {
    const service = { id: '1', name: 'API', lastChecked: '2025-01-23T10:00:00Z' }
    const w = mount(ServiceGrid, {
      props: { services: [service], isChecking: false },
      global: {
        stubs: ['BaseLoader', 'BaseText'],
      },
    })
    const card = w.findComponent({ name: 'ServiceCard' })
    expect(card.props('service')).toEqual(service)
  })

  it('hides loading when services have been checked', () => {
    const services = [
      { id: '1', name: 'API', lastChecked: '2025-01-23T10:00:00Z' },
    ]
    const w = mount(ServiceGrid, {
      props: { services, isChecking: true },
      global: {
        stubs: ['ServiceCard', 'BaseText'],
      },
    })
    expect(w.find('.service-grid__cards').exists()).toBe(true)
    expect(w.find('.service-grid__loading').exists()).toBe(false)
  })

  it('renders grid with correct CSS classes', () => {
    const services = [
      { id: '1', name: 'API', lastChecked: '2025-01-23T10:00:00Z' },
    ]
    const w = mount(ServiceGrid, {
      props: { services, isChecking: false },
      global: {
        stubs: ['ServiceCard', 'BaseLoader', 'BaseText'],
      },
    })
    expect(w.find('.service-grid').exists()).toBe(true)
    expect(w.find('.service-grid__cards').exists()).toBe(true)
  })

  it('handles empty services array', () => {
    const w = mount(ServiceGrid, {
      props: { services: [], isChecking: false },
      global: {
        stubs: ['ServiceCard', 'BaseLoader', 'BaseText'],
      },
    })
    expect(w.find('.service-grid__cards').exists()).toBe(true)
    expect(w.findAllComponents({ name: 'ServiceCard' }).length).toBe(0)
  })

  it('maintains correct grid layout with multiple services', () => {
    const services = Array.from({ length: 6 }, (_, i) => ({
      id: String(i),
      name: `Service ${i}`,
      lastChecked: '2025-01-23T10:00:00Z',
    }))
    const w = mount(ServiceGrid, {
      props: { services, isChecking: false },
      global: {
        stubs: ['BaseLoader', 'BaseText'],
      },
    })
    const cards = w.findAllComponents({ name: 'ServiceCard' })
    expect(cards.length).toBe(6)
  })
})
