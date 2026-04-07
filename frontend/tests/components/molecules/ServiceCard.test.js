import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ServiceCard from '@/components/molecules/ServiceCard.vue'

describe('ServiceCard', () => {
  const mockService = {
    id: 'service-1',
    name: 'API Server',
    description: 'Main API service',
    url: 'https://api.example.com',
    type: 'api',
    status: 'up',
    latency: 125,
    lastChecked: '2025-01-23T10:30:00Z',
  }

  it('renders article with status class', () => {
    const w = mount(ServiceCard, {
      props: { service: mockService },
      global: {
        stubs: ['BaseIcon', 'BaseBadge', 'BaseText'],
      },
    })
    expect(w.find('.service-card').exists()).toBe(true)
    expect(w.find('.service-card').classes()).toContain('service-card--up')
  })

  it('renders service name', () => {
    const w = mount(ServiceCard, {
      props: { service: mockService },
      global: {
        stubs: ['BaseIcon', 'BaseBadge'],
      },
    })
    expect(w.text()).toContain('API Server')
  })

  it('renders service description', () => {
    const w = mount(ServiceCard, {
      props: { service: mockService },
      global: {
        stubs: ['BaseIcon', 'BaseBadge'],
      },
    })
    expect(w.text()).toContain('Main API service')
  })

  it('renders icon based on service type', () => {
    const w = mount(ServiceCard, {
      props: { service: { ...mockService, type: 'database' } },
      global: {
        stubs: ['BaseBadge', 'BaseText'],
      },
    })
    const icon = w.findComponent({ name: 'BaseIcon' })
    expect(icon.exists()).toBe(true)
  })

  it('renders status badge with correct variant', () => {
    const w = mount(ServiceCard, {
      props: { service: mockService },
      global: {
        stubs: ['BaseIcon', 'BaseText'],
      },
    })
    const badge = w.findComponent({ name: 'BaseBadge' })
    expect(badge.exists()).toBe(true)
    expect(badge.props('variant')).toBe('success')
  })

  it('displays dot indicator for up status', () => {
    const w = mount(ServiceCard, {
      props: { service: mockService },
      global: {
        stubs: ['BaseIcon', 'BaseText'],
      },
    })
    const badge = w.findComponent({ name: 'BaseBadge' })
    expect(badge.props('dot')).toBe(true)
  })

  it('shows latency in milliseconds', () => {
    const w = mount(ServiceCard, {
      props: { service: { ...mockService, latency: 250 } },
      global: {
        stubs: ['BaseIcon', 'BaseBadge'],
      },
    })
    expect(w.text()).toContain('250 ms')
  })

  it('formats latency in seconds for large values', () => {
    const w = mount(ServiceCard, {
      props: { service: { ...mockService, latency: 1500 } },
      global: {
        stubs: ['BaseIcon', 'BaseBadge'],
      },
    })
    expect(w.text()).toContain('1.5 s')
  })

  it('renders undefined latency as dash', () => {
    const w = mount(ServiceCard, {
      props: { service: { ...mockService, latency: null } },
      global: {
        stubs: ['BaseIcon', 'BaseBadge'],
      },
    })
    expect(w.text()).toContain('—')
  })

  it('renders URL link with target blank', () => {
    const w = mount(ServiceCard, {
      props: { service: mockService },
      global: {
        stubs: ['BaseIcon', 'BaseBadge', 'BaseText'],
      },
    })
    const link = w.find('a[href]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe(mockService.url)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener')
  })

  it('handles different service statuses', () => {
    const statuses = ['up', 'down', 'checking', 'unknown']
    statuses.forEach(status => {
      const w = mount(ServiceCard, {
        props: { service: { ...mockService, status } },
        global: {
          stubs: ['BaseIcon', 'BaseBadge', 'BaseText'],
        },
      })
      expect(w.find(`.service-card--${status}`).exists()).toBe(true)
    })
  })

  it('renders with all section classes', () => {
    const w = mount(ServiceCard, {
      props: { service: mockService },
      global: {
        stubs: ['BaseIcon', 'BaseBadge', 'BaseText'],
      },
    })
    expect(w.find('.service-card__header').exists()).toBe(true)
    expect(w.find('.service-card__body').exists()).toBe(true)
    expect(w.find('.service-card__footer').exists()).toBe(true)
  })

  it('renders icon wrapper in header', () => {
    const w = mount(ServiceCard, {
      props: { service: mockService },
      global: {
        stubs: ['BaseIcon', 'BaseBadge', 'BaseText'],
      },
    })
    expect(w.find('.service-card__icon-wrap').exists()).toBe(true)
  })
})
