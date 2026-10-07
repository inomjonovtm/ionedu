import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
export const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || 'http://127.0.0.1:8000'

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('access')
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

function clearTokens() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
}

let refreshing = null
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true

    const refresh = localStorage.getItem('refresh')

    // No refresh token at all → just retry the original WITHOUT auth so public endpoints work
    if (!refresh) {
      clearTokens()
      try {
        delete original.headers.Authorization
        return await axios({ ...original, baseURL })
      } catch {
        return Promise.reject(error)
      }
    }

    // Try refreshing
    try {
      if (!refreshing) {
        refreshing = axios.post(`${baseURL}/auth/refresh/`, { refresh })
          .finally(() => setTimeout(() => { refreshing = null }, 0))
      }
      const { data } = await refreshing
      localStorage.setItem('access', data.access)
      original.headers.Authorization = `Bearer ${data.access}`
      return api(original)
    } catch {
      // Refresh failed (expired/invalid) — drop tokens, then retry original anonymously
      clearTokens()
      try {
        delete original.headers.Authorization
        return await axios({ ...original, baseURL })
      } catch (e2) {
        return Promise.reject(e2)
      }
    }
  },
)

export const absUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return MEDIA_URL + path
}

export default api
