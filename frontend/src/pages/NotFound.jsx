import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Icon from '../components/Icon'

export default function NotFound() {
  return (
    <Layout>
      <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 520 }} className="fade-up">
          <div style={{ width: 200, height: 200, margin: '0 auto 32px', color: 'var(--green-600)' }}>
            <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="100" cy="100" r="80"/>
              <path d="M20 100 H180"/>
              <path d="M100 20 Q70 60 70 100 Q70 140 100 180"/>
              <path d="M100 20 Q130 60 130 100 Q130 140 100 180"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 96, fontWeight: 800, color: 'var(--green-600)', lineHeight: 1 }}>404</div>
          <h1 style={{ fontSize: 28, marginTop: 12 }}>Sahifa topilmadi</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 16, margin: '12px 0 32px' }}>
            Siz qidirayotgan sahifa mavjud emas.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-primary btn-lg">
              <Icon name="home" size={16} /> Bosh sahifa
            </Link>
            <Link to="/courses" className="btn btn-secondary btn-lg">
              Kurslarni ko'rish <Icon name="arrowR" size={14} />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
