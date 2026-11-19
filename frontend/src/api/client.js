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

/** The session is gone for good — tell the app so the UI stops pretending to be signed in. */
function sessionExpired() {
  const had = !!localStorage.getItem('access') || !!localStorage.getItem('refresh')
  clearTokens()
  if (had) window.dispatchEvent(new Event('ionedu:session-expired'))
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// Transient failures worth one automatic retry: no response at all (network
// blip, server restarting) or a gateway / "busy" status.
function isTransient(error) {
  if (error.code === 'ERR_CANCELED') return false
  if (!error.response) return true
  return [502, 503, 504].includes(error.response.status)
}

let refreshing = null
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (!original) return Promise.reject(error)

    // ── one silent retry for transient failures (never for file uploads) ──
    const isUpload = typeof FormData !== 'undefined' && original.data instanceof FormData
    if (isTransient(error) && !original._retried && !isUpload) {
      original._retried = true
      await sleep(700)
      return api(original)
    }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true

    const refresh = localStorage.getItem('refresh')

    // No refresh token at all → retry WITHOUT auth so public endpoints still work
    if (!refresh) {
      sessionExpired()
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
      if (data.refresh) localStorage.setItem('refresh', data.refresh)
      original.headers.Authorization = `Bearer ${data.access}`
      return api(original)
    } catch {
      // Refresh failed (expired/invalid) — sign out, then retry anonymously
      sessionExpired()
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

/**
 * Human-readable message for a failed request.
 * Prefers what the server said; otherwise explains the kind of failure and
 * appends the status code so a report like "xato 500" can be traced.
 */
export function apiError(e, fallback = 'Xatolik yuz berdi') {
  const res = e?.response
  if (!res) return "Server bilan aloqa yo'q. Internetni tekshirib, qayta urinib ko'ring."
  const d = res.data
  if (d && typeof d === 'object') {
    const first = d.detail ?? Object.values(d)[0]
    const msg = Array.isArray(first) ? first[0] : first
    if (msg && typeof msg !== 'object') return String(msg)
  }
  if (res.status === 401) return 'Sessiya muddati tugagan. Qaytadan tizimga kiring.'
  if (res.status === 403) return "Bu amal uchun ruxsat yo'q."
  if (res.status === 404) return `${fallback}: ma'lumot topilmadi (404).`
  if (res.status === 413) return 'Fayl hajmi juda katta.'
  if (res.status >= 500) return `${fallback}: serverda xatolik (${res.status}). Birozdan so'ng qayta urinib ko'ring.`
  return `${fallback} (${res.status})`
}

export default api
