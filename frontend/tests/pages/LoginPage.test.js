import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import LoginPage from '@/pages/LoginPage.vue'
import { useAuthStore } from '@/stores/auth.store.js'

// --- Mock useApi -----------------------------------------------------------
// useApi is called inside submit(), so the mock factory must always return
// the same controllable instance.
const mockPost = vi.fn()
vi.mock('@/composables/useApi.js', () => ({
  useApi: () => ({ post: mockPost, loading: { value: false }, error: { value: null } }),
}))

// ---------------------------------------------------------------------------

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/login', component: LoginPage },
      { path: '/register', component: { template: '<div/>' } },
      { path: '/expenses', component: { template: '<div/>' } },
    ],
  })
}

async function mountPage(routerOverride) {
  const router = routerOverride ?? makeRouter()
  const pinia  = createPinia()
  setActivePinia(pinia)

  await router.push('/login')
  await router.isReady()

  const wrapper = mount(LoginPage, {
    global: { plugins: [router, pinia] },
  })
  return { wrapper, router }
}

// ---------------------------------------------------------------------------

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  // --- Rendering ------------------------------------------------------------

  it('renders email and password inputs', async () => {
    const { wrapper } = await mountPage()
    expect(wrapper.find('input#login-email').exists()).toBe(true)
    expect(wrapper.find('input#login-password').exists()).toBe(true)
  })

  it('renders the submit button', async () => {
    const { wrapper } = await mountPage()
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('shows a link to the register page', async () => {
    const { wrapper } = await mountPage()
    expect(wrapper.html()).toContain('/register')
  })

  // --- Client-side validation -----------------------------------------------

  it('shows email error when submitting empty form', async () => {
    const { wrapper } = await mountPage()
    await wrapper.find('form').trigger('submit')
    expect(wrapper.html()).toContain("L'adresse email est requise.")
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('shows password error when only email is filled', async () => {
    const { wrapper } = await mountPage()
    await wrapper.find('input#login-email').setValue('test@example.com')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.html()).toContain('Le mot de passe est requis.')
    expect(mockPost).not.toHaveBeenCalled()
  })

  // --- Successful login -----------------------------------------------------

  it('calls api.post with lowercased email on submit', async () => {
    mockPost.mockResolvedValueOnce({
      token: 'test.jwt.token',
      user: { id: '1', email: 'user@example.com' },
    })
    const { wrapper } = await mountPage()

    await wrapper.find('input#login-email').setValue('USER@Example.COM')
    await wrapper.find('input#login-password').setValue('s3cr3t!')
    await wrapper.find('form').trigger('submit')
    await vi.runAllTimersAsync?.()

    expect(mockPost).toHaveBeenCalledWith('/api/auth/login', {
      email: 'user@example.com',
      password: 's3cr3t!',
    })
  })

  it('stores the session in auth store on success', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = makeRouter()

    mockPost.mockResolvedValueOnce({
      token: 'abc.def.ghi',
      user: { id: '42', email: 'alice@test.com' },
    })

    await router.push('/login')
    await router.isReady()

    const wrapper = mount(LoginPage, { global: { plugins: [router, pinia] } })
    const auth    = useAuthStore()

    await wrapper.find('input#login-email').setValue('alice@test.com')
    await wrapper.find('input#login-password').setValue('password123')
    await wrapper.find('form').trigger('submit')
    // Flush the async submit() promise
    await new Promise(r => setTimeout(r, 0))

    expect(auth.token).toBe('abc.def.ghi')
    expect(auth.user).toEqual({ id: '42', email: 'alice@test.com' })
  })

  it('redirects to /expenses after successful login', async () => {
    mockPost.mockResolvedValueOnce({
      token: 'tok',
      user: { id: '1', email: 'u@u.com' },
    })
    const { wrapper, router } = await mountPage()

    await wrapper.find('input#login-email').setValue('u@u.com')
    await wrapper.find('input#login-password').setValue('pass')
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))

    expect(router.currentRoute.value.path).toBe('/expenses')
  })

  it('respects ?redirect query param after login', async () => {
    mockPost.mockResolvedValueOnce({ token: 'tok', user: {} })
    const router = makeRouter()
    const pinia  = createPinia()
    setActivePinia(pinia)

    await router.push('/login?redirect=/expenses')
    await router.isReady()

    const wrapper = mount(LoginPage, { global: { plugins: [router, pinia] } })
    await wrapper.find('input#login-email').setValue('u@u.com')
    await wrapper.find('input#login-password').setValue('pass')
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))

    expect(router.currentRoute.value.path).toBe('/expenses')
  })

  // --- Failed login ---------------------------------------------------------

  it('shows global error on API failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('Identifiants invalides'))
    const { wrapper } = await mountPage()

    await wrapper.find('input#login-email').setValue('bad@bad.com')
    await wrapper.find('input#login-password').setValue('wrong')
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))

    expect(wrapper.html()).toContain('Identifiants invalides')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('shows fallback message when error has no message', async () => {
    mockPost.mockRejectedValueOnce(new Error(''))
    const { wrapper } = await mountPage()

    await wrapper.find('input#login-email').setValue('x@x.com')
    await wrapper.find('input#login-password').setValue('pass')
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))

    expect(wrapper.html()).toContain('Échec de la connexion')
  })

  it('does not redirect on login failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('401'))
    const { wrapper, router } = await mountPage()

    await wrapper.find('input#login-email').setValue('x@x.com')
    await wrapper.find('input#login-password').setValue('pass')
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))

    expect(router.currentRoute.value.path).toBe('/login')
  })
})
