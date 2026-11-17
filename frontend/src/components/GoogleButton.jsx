import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useAuth } from '../store/auth'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

let gsiLoading = null
function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!gsiLoading) {
    gsiLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = GSI_SRC
      s.async = true
      s.onload = resolve
      s.onerror = () => { gsiLoading = null; reject(new Error('GSI load failed')) }
      document.head.appendChild(s)
    })
  }
  return gsiLoading
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.300-4.600 7l7.600 5.900c4.400-4.100 6.700-10.100 6.700-17.400z"/>
      <path fill="#FBBC05" d="M10.500 28.600A14.500 14.500 0 0 1 9.700 24c0-1.600.300-3.200.800-4.600l-7.900-6.200A24 24 0 0 0 0 24c0 3.900.900 7.500 2.600 10.800l7.900-6.200z"/>
      <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.600-5.900c-2.100 1.400-4.900 2.300-8.300 2.300-6.300 0-11.600-4.200-13.500-10l-7.900 6.200C6.500 42.600 14.600 48 24 48z"/>
    </svg>
  )
}

/**
 * "Continue with Google" (Google Identity Services).
 *
 * The OAuth client id comes from the backend (/auth/config/ → GOOGLE_CLIENT_ID in
 * backend/.env), with VITE_GOOGLE_CLIENT_ID as a fallback, so it is configured
 * in one place. Until it is configured the button is shown only in development,
 * as a placeholder that explains what is missing.
 */
export default function GoogleButton({ text = 'continue_with' }) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)
  const loginWithGoogle = useAuth(s => s.loginWithGoogle)
  const navigate = useNavigate()
  const loc = useLocation()

  const { data: cfg, isLoading } = useQuery({
    queryKey: ['auth-config'],
    queryFn: () => api.get('/auth/config/').then(r => r.data).catch(() => ({})),
    staleTime: 5 * 60 * 1000,
  })
  const clientId = cfg?.google_client_id || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  const dest = loc.state?.from || '/'

  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    loadGsi().then(() => {
      if (cancelled || !ref.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            const data = await loginWithGoogle(credential)
            toast.success(data.created ? 'Akkaunt yaratildi! Xush kelibsiz.' : 'Xush kelibsiz!')
            navigate(dest, { replace: true })
          } catch (e) {
            toast.error(e.response?.data?.detail || 'Google orqali kirishda xatolik')
          }
        },
      })
      const width = Math.min(400, ref.current.offsetWidth || 400)
      window.google.accounts.id.renderButton(ref.current, {
        type: 'standard', theme: 'outline', size: 'large',
        text, shape: 'rectangular', logo_alignment: 'center', width,
      })
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [clientId, loginWithGoogle, navigate, dest, text])

  if (isLoading) return null
  if (!clientId && !import.meta.env.DEV) return null

  const label = text === 'signup_with' ? "Google orqali ro'yxatdan o'tish" : 'Google orqali kirish'

  return (
    <>
      {clientId && !failed ? (
        <div ref={ref} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
      ) : (
        <button type="button" className="btn btn-secondary btn-lg btn-block"
          onClick={() => toast(failed
            ? "Google xizmatiga ulanib bo'lmadi. Internetni tekshiring."
            : "Google orqali kirish hali sozlanmagan: backend/.env fayliga GOOGLE_CLIENT_ID kiriting.", { icon: 'ℹ️', duration: 6000 })}>
          <GoogleG /> {label}
        </button>
      )}
      <div className="auth-divider"><span>yoki email orqali</span></div>
    </>
  )
}
