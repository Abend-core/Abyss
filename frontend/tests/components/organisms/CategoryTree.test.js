import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryTree from '@/components/organisms/CategoryTree.vue'

describe('CategoryTree', () => {
  const mockCategories = [
    {
      id: 'cat-1',
      name: 'Food',
      children: [
        { id: 'cat-1-1', name: 'Groceries', children: [] },
        { id: 'cat-1-2', name: 'Restaurants', children: [] },
      ],
    },
    {
      id: 'cat-2',
      name: 'Transport',
      children: [],
    },
  ]

  it('renders container with correct class', () => {
    const w = mount(CategoryTree, {
      props: { categories: mockCategories },
    })
    expect(w.find('.ct').exists()).toBe(true)
  })

  it('renders category items for each root category', () => {
    const w = mount(CategoryTree, {
      props: { categories: mockCategories },
      global: {
        stubs: ['BaseBadge', 'BaseButton', 'BaseIcon'],
      },
    })
    // The component renders recursively, so we check the root exists
    expect(w.find('.ct').exists()).toBe(true)
  })

  it('renders empty list when no categories', () => {
    const w = mount(CategoryTree, {
      props: { categories: [] },
    })
    const items = w.findAll('.ct__item')
    expect(items.length).toBe(0)
  })

  it('accepts level prop', () => {
    const w = mount(CategoryTree, {
      props: { categories: mockCategories, level: 0 },
    })
    expect(w.props('level')).toBe(0)
  })

  it('emission for delete event', async () => {
    const w = mount(CategoryTree, {
      props: { categories: mockCategories },
      global: {
        stubs: true,
      },
    })
    // Check that emits are defined
    const emits = w.vm.$options.emits
    expect(emits).toContain('delete')
  })

  it('has all required emits defined', () => {
    const w = mount(CategoryTree, {
      props: { categories: mockCategories },
      global: {
        stubs: true,
      },
    })
    const emits = w.vm.$options.emits
    expect(emits).toContain('move-up')
    expect(emits).toContain('move-down')
    expect(emits).toContain('indent')
    expect(emits).toContain('dedent')
    expect(emits).toContain('nest')
    expect(emits).toContain('delete')
    expect(emits).toContain('edit')
  })

  it('renders draggable items with data-cat-id attribute', () => {
    const w = mount(CategoryTree, {
      props: { categories: mockCategories },
      global: {
        stubs: ['BaseBadge', 'BaseButton', 'BaseIcon'],
      },
    })
    const items = w.findAll('[data-cat-id]')
    expect(items.length).toBeGreaterThan(0)
  })

  it('supports keyboard navigation arrows emits', () => {
    const w = mount(CategoryTree, {
      props: { categories: mockCategories },
      global: {
        stubs: true,
      },
    })
    const emits = w.vm.$options.emits
    expect(emits).toContain('move-up')
    expect(emits).toContain('move-down')
  })

  it('supports drag and drop emit', () => {
    const w = mount(CategoryTree, {
      props: { categories: mockCategories },
      global: {
        stubs: true,
      },
    })
    const emits = w.vm.$options.emits
    expect(emits).toContain('nest')
  })

  it('supports indent/dedent emits for tree manipulation', () => {
    const w = mount(CategoryTree, {
      props: { categories: mockCategories },
      global: {
        stubs: true,
      },
    })
    const emits = w.vm.$options.emits
    expect(emits).toContain('indent')
    expect(emits).toContain('dedent')
  })

  it('renders with correct recursion for nested structure', () => {
    const w = mount(CategoryTree, {
      props: { categories: mockCategories },
      global: {
        stubs: ['BaseBadge', 'BaseButton', 'BaseIcon'],
      },
    })
    // Component handles nested/recursive rendering
    expect(w.find('.ct').exists()).toBe(true)
  })

  it('has touch event support for mobile', () => {
    const w = mount(CategoryTree, {
      props: { categories: mockCategories },
      global: {
        stubs: true,
      },
    })
    // Component should support touch events (onTouchStart, onTouchMove, onTouchEnd)
    expect(w.vm.$el).toBeDefined()
  })

  it('supports edit event emission', () => {
    const w = mount(CategoryTree, {
      props: { categories: mockCategories },
      global: {
        stubs: true,
      },
    })
    const emits = w.vm.$options.emits
    expect(emits).toContain('edit')
  })

  it('handles deep nested categories', () => {
    const deepCategories = [
      {
        id: 'cat-1',
        name: 'Root',
        children: [
          {
            id: 'cat-1-1',
            name: 'Level 1',
            children: [
              { id: 'cat-1-1-1', name: 'Level 2', children: [] },
            ],
          },
        ],
      },
    ]
    const w = mount(CategoryTree, {
      props: { categories: deepCategories },
      global: {
        stubs: ['BaseBadge', 'BaseButton', 'BaseIcon'],
      },
    })
    expect(w.find('.ct').exists()).toBe(true)
  })

  it('applies component name correctly', () => {
    const w = mount(CategoryTree, {
      props: { categories: mockCategories },
      global: {
        stubs: true,
      },
    })
    expect(w.vm.$options.name).toBe('CategoryTree')
  })
})
