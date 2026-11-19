import { create } from 'zustand'
import api from '../api/client'

export const useAuth = create((set, get) => ({
  user: null,
  access: localStorage.getItem('access') || null,
  refresh: localStorage.getItem('refresh') || null,
  hydrated: false,

  isAuthenticated: () => !!get().access && !!get().user,

  async hydrate() {
    const access = localStorage.getItem('access')
    if (!access) {
      set({ hydrated: true })
      return
    }
    try {
      const { data } = await api.get('/auth/me/')
      set({ user: data, access, hydrated: true })
    } catch {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      set({ user: null, access: null, refresh: null, hydrated: true })
    }
  },

  /** Store tokens + user after any successful sign-in. */
  completeAuth(data) {
    localStorage.setItem('access', data.access)
    localStorage.setItem('refresh', data.refresh)
    set({ user: data.user, access: data.access, refresh: data.refresh })
    return data.user
  },

  /**
   * Returns the user, or `{ verification_required, email, resend_in, debug_code }`
   * when the password is right but the email was never confirmed.
   */
  async login(email, password) {
    const { data } = await api.post('/auth/login/', { email, password })
    if (data.verification_required) return data
    return get().completeAuth(data)
  },

  async loginWithGoogle(credential) {
    const { data } = await api.post('/auth/google/', { credential })
    get().completeAuth(data)
    return data
  },

  /** Creates the account; the caller must then show the email-code step. */
  async register(payload) {
    const { data } = await api.post('/auth/register/', payload)
    if (data.access) get().completeAuth(data)
    return data
  },

  async logout() {
    try { await api.post('/auth/logout/', { refresh: localStorage.getItem('refresh') }) } catch { /* token already invalid */ }
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    set({ user: null, access: null, refresh: null })
  },

  async updateMe(formData) {
    // PATCH so partial uploads (e.g. only the avatar) don't trigger full-form validation
    const { data } = await api.patch('/auth/me/update/', formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    })
    set({ user: data })
    return data
  },
}))

// The API client fires this when the refresh token is no longer accepted:
// drop the user so protected pages send the visitor to the login screen
// instead of failing every request with a confusing error.
window.addEventListener('ionedu:session-expired', () => {
  useAuth.setState({ user: null, access: null, refresh: null })
})
