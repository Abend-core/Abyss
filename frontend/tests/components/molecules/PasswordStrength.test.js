import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PasswordStrength from '@/components/molecules/PasswordStrength.vue'

describe('PasswordStrength', () => {
  it('does not render when password is empty', () => {
    const w = mount(PasswordStrength, {
      props: {
        password: '',
      },
      global: {
        stubs: ['BaseText'],
      },
    })
    expect(w.find('.pwd-strength').exists()).toBe(false)
  })

  it('renders when password has length', () => {
    const w = mount(PasswordStrength, {
      props: {
        password: 'test',
      },
      global: {
        stubs: ['BaseText'],
      },
    })
    expect(w.find('.pwd-strength').exists()).toBe(true)
  })

  it('has progressbar role in track element', () => {
    const w = mount(PasswordStrength, {
      props: {
        password: 'password123',
      },
      global: {
        stubs: ['BaseText'],
      },
    })
    expect(w.find('[role="progressbar"]').exists()).toBe(true)
  })

  it('displays aria-live polite attribute', () => {
    const w = mount(PasswordStrength, {
      props: {
        password: 'test123',
      },
      global: {
        stubs: ['BaseText'],
      },
    })
    expect(w.find('.pwd-strength').attributes('aria-live')).toBe('polite')
  })

  it('renders fill element with dynamic width', () => {
    const w = mount(PasswordStrength, {
      props: {
        password: 'password123!@#',
      },
      global: {
        stubs: ['BaseText'],
      },
    })
    const fill = w.find('.pwd-strength__fill')
    expect(fill.exists()).toBe(true)
    expect(fill.attributes('style')).toMatch(/width:/)
  })

  it('renders metadata section with BaseText components', () => {
    const w = mount(PasswordStrength, {
      props: {
        password: 'testpass',
      },
      global: {
        stubs: false,
      },
    })
    expect(w.find('.pwd-strength__meta').exists()).toBe(true)
    const texts = w.findAllComponents({ name: 'BaseText' })
    expect(texts.length).toBeGreaterThanOrEqual(2)
  })

  it('shows entropy bits calculation', () => {
    const w = mount(PasswordStrength, {
      props: {
        password: 'test',
      },
      global: {
        stubs: ['BaseText'],
      },
    })
    const meta = w.find('.pwd-strength__meta')
    expect(meta.exists()).toBe(true)
    // The entropy calculation is done by useEntropy composable
    // We verify the structure exists
    expect(meta.html()).toContain('/')
  })

  it('updates when password prop changes', async () => {
    const w = mount(PasswordStrength, {
      props: {
        password: 'initial',
      },
      global: {
        stubs: ['BaseText'],
      },
    })
    expect(w.find('.pwd-strength').exists()).toBe(true)

    await w.setProps({ password: 'much-longer-password-with-more-entropy' })
    expect(w.find('.pwd-strength').exists()).toBe(true)
    // Both should show the progress bar
  })

  it('has correct CSS classes for container', () => {
    const w = mount(PasswordStrength, {
      props: {
        password: 'test',
      },
      global: {
        stubs: ['BaseText'],
      },
    })
    expect(w.find('.pwd-strength').classes()).toContain('pwd-strength')
    expect(w.find('.pwd-strength__track').exists()).toBe(true)
    expect(w.find('.pwd-strength__fill').exists()).toBe(true)
    expect(w.find('.pwd-strength__meta').exists()).toBe(true)
  })

  it('renders with proper ARIA attributes for accessibility', () => {
    const w = mount(PasswordStrength, {
      props: {
        password: 'secure-pass-123',
      },
      global: {
        stubs: ['BaseText'],
      },
    })
    const track = w.find('[role="progressbar"]')
    expect(track.attributes('aria-valuemin')).toBe('0')
    expect(track.attributes('aria-valuemax')).toBeDefined()
    expect(track.attributes('aria-label')).toBeDefined()
  })
})
