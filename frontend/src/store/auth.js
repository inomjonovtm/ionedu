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

  async login(email, password) {
    const { data } = await api.post('/auth/login/', { email, password })
    localStorage.setItem('access', data.access)
    localStorage.setItem('refresh', data.refresh)
    set({ user: data.user, access: data.access, refresh: data.refresh })
    return data.user
  },

  async loginWithGoogle(credential) {
    const { data } = await api.post('/auth/google/', { credential })
    localStorage.setItem('access', data.access)
    localStorage.setItem('refresh', data.refresh)
    set({ user: data.user, access: data.access, refresh: data.refresh })
    return data
  },

  async register(payload) {
    const { data } = await api.post('/auth/register/', payload)
    localStorage.setItem('access', data.access)
    localStorage.setItem('refresh', data.refresh)
    set({ user: data.user, access: data.access, refresh: data.refresh })
    return data.user
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
