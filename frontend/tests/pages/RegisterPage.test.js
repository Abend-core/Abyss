import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import RegisterPage from '@/pages/RegisterPage.vue'

// --- Mock useApi -----------------------------------------------------------
const mockPost  = vi.fn()
const mockError = ref(null)
vi.mock('@/composables/useApi.js', () => ({
  useApi: () => ({ post: mockPost, error: mockError, loading: ref(false) }),
}))

// --- Mock useEntropy -------------------------------------------------------
// Controlled via module-level reactive ref so individual tests can adjust it.
const mockIsStrong = ref(true)
vi.mock('@/composables/useEntropy.js', () => ({
  useEntropy: () => ({
    isStrong:  mockIsStrong,
    entropy:   ref(128),
    color:     ref('success'),
    progress:  ref(100),
    label:     ref('Excellent'),
    TARGET:    120,
  }),
}))

// ---------------------------------------------------------------------------

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/login', component: { template: '<div/>' } },
      { path: '/register', component: RegisterPage },
    ],
  })
}

async function mountPage() {
  const router = makeRouter()
  const pinia  = createPinia()
  setActivePinia(pinia)

  await router.push('/register')
  await router.isReady()

  const wrapper = mount(RegisterPage, {
    global: { plugins: [router, pinia] },
  })
  return { wrapper, router }
}

// ---------------------------------------------------------------------------

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockIsStrong.value = true
    mockError.value    = null
  })

  // --- Rendering ------------------------------------------------------------

  it('renders email, password and confirm inputs', async () => {
    const { wrapper } = await mountPage()
    expect(wrapper.find('input#register-email').exists()).toBe(true)
    expect(wrapper.find('input#register-password').exists()).toBe(true)
    expect(wrapper.find('input#register-confirm').exists()).toBe(true)
  })

  it('renders a submit button', async () => {
    const { wrapper } = await mountPage()
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('shows a link to the login page', async () => {
    const { wrapper } = await mountPage()
    expect(wrapper.html()).toContain('/login')
  })

  // --- Client-side validation -----------------------------------------------

  it('shows email error when form is empty', async () => {
    const { wrapper } = await mountPage()
    await wrapper.find('form').trigger('submit')
    expect(wrapper.html()).toContain("L'adresse email est requise.")
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('shows email format error for invalid email', async () => {
    const { wrapper } = await mountPage()
    await wrapper.find('input#register-email').setValue('notanemail')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.html()).toContain("n'est pas valide")
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('blocks submission when entropy is too low (isStrong = false)', async () => {
    mockIsStrong.value = false
    const { wrapper } = await mountPage()

    await wrapper.find('input#register-email').setValue('user@example.com')
    await wrapper.find('input#register-password').setValue('weak')
    await wrapper.find('input#register-confirm').setValue('weak')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.html()).toContain('120 bits')
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('shows confirmation error when passwords do not match', async () => {
    const { wrapper } = await mountPage()

    await wrapper.find('input#register-email').setValue('user@example.com')
    await wrapper.find('input#register-password').setValue('StrongPass1!')
    await wrapper.find('input#register-confirm').setValue('DifferentPass1!')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.html()).toContain('ne correspondent pas')
    expect(mockPost).not.toHaveBeenCalled()
  })

  // --- Successful registration ----------------------------------------------

  it('calls api.post with correct payload on valid submit', async () => {
    mockPost.mockResolvedValueOnce({ id: 'uuid-123', email: 'new@example.com', createdAt: new Date().toISOString() })
    const { wrapper } = await mountPage()

    await wrapper.find('input#register-email').setValue('  New@Example.com  ')
    await wrapper.find('input#register-password').setValue('StrongPass1!')
    await wrapper.find('input#register-confirm').setValue('StrongPass1!')
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))

    expect(mockPost).toHaveBeenCalledWith('/api/auth/register', {
      email:    'New@Example.com',   // trimmed but NOT lowercased here (backend handles it)
      password: 'StrongPass1!',
    })
  })

  it('redirects to /login after successful registration', async () => {
    mockPost.mockResolvedValueOnce({ id: 'uuid-456', email: 'u@u.com', createdAt: '' })
    const { wrapper, router } = await mountPage()

    await wrapper.find('input#register-email').setValue('u@u.com')
    await wrapper.find('input#register-password').setValue('StrongPass1!')
    await wrapper.find('input#register-confirm').setValue('StrongPass1!')
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))

    expect(router.currentRoute.value.path).toBe('/login')
  })

  // --- Failed registration --------------------------------------------------

  it('shows global error when API throws', async () => {
    mockPost.mockRejectedValueOnce(new Error('Email déjà utilisé'))
    const { wrapper } = await mountPage()

    await wrapper.find('input#register-email').setValue('taken@example.com')
    await wrapper.find('input#register-password').setValue('StrongPass1!')
    await wrapper.find('input#register-confirm').setValue('StrongPass1!')
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))

    expect(wrapper.html()).toContain('Email déjà utilisé')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('shows global error when API returns no id', async () => {
    mockPost.mockResolvedValueOnce({})   // Missing id
    const { wrapper } = await mountPage()

    await wrapper.find('input#register-email').setValue('u@u.com')
    await wrapper.find('input#register-password').setValue('StrongPass1!')
    await wrapper.find('input#register-confirm').setValue('StrongPass1!')
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))

    expect(wrapper.html()).toContain('Impossible de créer le compte')
  })

  it('uses api.error message when available on failure', async () => {
    mockError.value = 'Conflit: email déjà pris'
    mockPost.mockRejectedValueOnce(new Error('Conflict'))
    const { wrapper } = await mountPage()

    await wrapper.find('input#register-email').setValue('u@u.com')
    await wrapper.find('input#register-password').setValue('StrongPass1!')
    await wrapper.find('input#register-confirm').setValue('StrongPass1!')
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))

    // api.error takes precedence over err.message in the catch block
    expect(wrapper.html()).toContain('Conflit: email déjà pris')
  })

  it('does not redirect on registration failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('500'))
    const { wrapper, router } = await mountPage()

    await wrapper.find('input#register-email').setValue('u@u.com')
    await wrapper.find('input#register-password').setValue('StrongPass1!')
    await wrapper.find('input#register-confirm').setValue('StrongPass1!')
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))

    expect(router.currentRoute.value.path).toBe('/register')
  })
})
