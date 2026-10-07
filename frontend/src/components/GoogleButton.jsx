import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
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

/**
 * Official "Continue with Google" button (Google Identity Services).
 * Renders nothing if VITE_GOOGLE_CLIENT_ID is not configured, so the
 * auth pages keep working before OAuth credentials are set up.
 */
export default function GoogleButton({ text = 'continue_with' }) {
  const ref = useRef(null)
  const loginWithGoogle = useAuth(s => s.loginWithGoogle)
  const navigate = useNavigate()
  const loc = useLocation()

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false
    loadGsi().then(() => {
      if (cancelled || !ref.current) return
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }) => {
          try {
            const data = await loginWithGoogle(credential)
            toast.success(data.created ? 'Akkaunt yaratildi! Xush kelibsiz.' : 'Xush kelibsiz!')
            navigate(loc.state?.from || '/', { replace: true })
          } catch (e) {
            toast.error(e.response?.data?.detail || "Google orqali kirishda xatolik")
          }
        },
      })
      const width = Math.min(400, ref.current.offsetWidth || 400)
      window.google.accounts.id.renderButton(ref.current, {
        type: 'standard', theme: 'outline', size: 'large',
        text, shape: 'pill', logo_alignment: 'left', width,
      })
    }).catch(() => { /* network blocked — leave the area empty */ })
    return () => { cancelled = true }
  }, [loginWithGoogle, navigate, loc.state, text])

  if (!CLIENT_ID) return null

  return (
    <>
      <div ref={ref} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
      <div className="auth-divider"><span>yoki</span></div>
    </>
  )
}
