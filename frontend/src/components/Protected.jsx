import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'

export default function Protected({ children, roles }) {
  const { user, hydrated, access } = useAuth()
  const loc = useLocation()
  if (!hydrated) return <div style={{ padding: 80, textAlign: 'center' }}>Yuklanmoqda…</div>
  if (!access || !user) return <Navigate to="/auth/login" state={{ from: loc.pathname }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}
