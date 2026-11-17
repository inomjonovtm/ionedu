import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Icon from '../components/Icon'

const css = `
  .nf { overflow-x: clip; padding: 56px 0 104px; }
  .nf-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 56px; align-items: center; }

  /* ── The lost map ── */
  .nf-map {
    position: relative; aspect-ratio: 5 / 4; width: 100%;
    background-color: var(--white); background-image: var(--topo); background-size: 520px 360px;
    border: 2px solid var(--line); border-radius: 32px; box-shadow: var(--hard-lg);
    transform: rotate(-2deg);
  }
  .nf-map .fold { position: absolute; top: 0; bottom: 0; border-left: 1.5px dashed var(--border); }
  .nf-map svg { position: absolute; inset: 0; width: 100%; height: 100%; color: var(--line); }
  .nf-code {
    position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-54%);
    display: flex; align-items: center; justify-content: center; gap: .04em;
    font-family: var(--font-display); font-weight: 800; font-size: clamp(88px, 15vw, 190px);
    letter-spacing: -0.06em; line-height: 1; color: var(--text);
  }
  .nf-globe {
    width: .86em; height: .86em; border-radius: 999px; background: var(--sun);
    border: 3px solid var(--line); box-shadow: var(--hard); margin: 0 .05em;
    display: flex; align-items: center; justify-content: center;
    animation: nfSpin 9s ease-in-out infinite;
  }
  .nf-globe span { font-size: .52em; line-height: 1; letter-spacing: 0; }
  @keyframes nfSpin { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(12deg); } }
  .nf-pin { position: absolute; display: flex; align-items: center; gap: 7px; }
  .nf-pin .dot {
    width: 16px; height: 16px; border-radius: 999px 999px 999px 0; transform: rotate(-45deg);
    background: var(--coral); border: 2px solid var(--line); flex-shrink: 0;
  }
  .nf-pin.a { left: 9%; bottom: 13%; }
  .nf-pin.b { right: 8%; top: 12%; }
  .nf-q {
    position: absolute; right: 7%; bottom: 10%; width: 54px; height: 54px; border-radius: 17px;
    background: #FF9D88; color: #14213D; border: 2px solid var(--line); box-shadow: var(--hard-sm);
    display: flex; align-items: center; justify-content: center; transform: rotate(9deg);
    font-family: var(--font-display); font-weight: 800; font-size: 30px;
  }
  .nf-compass {
    position: absolute; left: 6%; top: 8%; width: 58px; height: 58px; border-radius: 999px;
    background: #9DBDFF; color: #14213D; border: 2px solid var(--line); box-shadow: var(--hard-sm);
    display: flex; align-items: center; justify-content: center;
    animation: nfWobble 2.6s ease-in-out infinite;
  }
  @keyframes nfWobble { 0%, 100% { transform: rotate(-38deg); } 30% { transform: rotate(52deg); } 60% { transform: rotate(-14deg); } }

  /* ── Copy ── */
  .nf-kick { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 22px; }
  .nf h1 { font-family: var(--font-display); font-weight: 800; font-size: clamp(36px, 5vw, 62px); line-height: 1; letter-spacing: -0.045em; }
  .nf-lead { color: var(--text-2); font-size: 17px; line-height: 1.7; max-width: 440px; margin-top: 22px; font-weight: 500; }
  .nf-acts { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 30px; }
  .nf-more { margin-top: 36px; padding-top: 24px; border-top: 1.5px dashed var(--border); }
  .nf-more .coord { display: block; margin-bottom: 12px; }
  .nf-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .nf-chip {
    display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 15px; border-radius: 999px;
    background: var(--white); border: 1.5px solid var(--line); font-size: 14px; font-weight: 700; color: var(--text);
    transition: transform .14s ease, box-shadow .14s ease, background .14s ease, color .14s ease;
  }
  .nf-chip:hover { transform: translate(-1px, -1px); box-shadow: var(--hard-sm); background: var(--sun); color: #14213D; }

  @media (max-width: 900px) {
    .nf { padding: 36px 0 76px; }
    .nf-grid { grid-template-columns: 1fr; gap: 44px; }
    .nf-map { max-width: 520px; margin: 0 auto; transform: rotate(-1deg); }
  }
  @media (max-width: 520px) {
    .nf-map { border-radius: 24px; box-shadow: var(--hard); }
    .nf-compass, .nf-q { width: 42px; height: 42px; border-radius: 14px; font-size: 22px; }
    .nf-compass { border-radius: 999px; }
    .nf-pin.b { display: none; }
    .nf-acts .btn { flex: 1 1 100%; }
  }
  @media (prefers-reduced-motion: reduce) {
    .nf-globe, .nf-compass { animation: none; }
  }
`

const PLACES = [
  ['/tests', 'fileText', 'Testlar'],
  ['/games', 'gamepad', "O'yinlar"],
  ['/world', 'map', 'Dunyo xaritasi'],
  ['/ratings', 'trophy', 'Reyting'],
]

export default function NotFound() {
  return (
    <Layout>
      <style>{css}</style>
      <div className="nf">
        <div className="container">
          <div className="nf-grid">
            <div className="nf-map fade-up" aria-hidden="true">
              <span className="fold" style={{ left: '33.3%' }} />
              <span className="fold" style={{ left: '66.6%' }} />
              <svg viewBox="0 0 500 400" fill="none">
                <path d="M66 330 C 120 250, 60 190, 130 150 S 250 60, 300 110 S 330 250, 400 230 S 450 300, 440 322"
                  stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 10" strokeLinecap="round" />
              </svg>
              <div className="nf-code">
                4<span className="nf-globe"><span>🌍</span></span>4
              </div>
              <span className="nf-compass"><Icon name="compass" size={26} /></span>
              <span className="nf-pin a"><span className="dot" /><span className="coord">SIZ SHU YERDASIZ</span></span>
              <span className="nf-pin b"><span className="coord">TERRA INCOGNITA</span></span>
              <span className="nf-q">?</span>
            </div>

            <div className="fade-up-d1">
              <div className="nf-kick">
                <span className="eyebrow">Xato 404</span>
                <span className="coord">??.??°N · ??.??°E</span>
              </div>
              <h1>Bu joy <span className="mark-coral">xaritada</span> yo'q</h1>
              <p className="nf-lead">
                Sahifa topilmadi — siz qidirayotgan sahifa mavjud emas yoki boshqa manzilga ko'chgan.
                Kompasni to'g'rilab, tanish hududga qaytamiz.
              </p>
              <div className="nf-acts">
                <Link to="/" className="btn btn-primary btn-lg">
                  <Icon name="home" size={16} /> Bosh sahifa
                </Link>
                <Link to="/courses" className="btn btn-secondary btn-lg">
                  Kurslarni ko'rish <Icon name="arrowR" size={14} />
                </Link>
              </div>
              <div className="nf-more">
                <span className="coord">YOKI YAQIN ATROFDAGI MANZILLAR</span>
                <div className="nf-chips">
                  {PLACES.map(([to, icon, label]) => (
                    <Link key={to} to={to} className="nf-chip"><Icon name={icon} size={16} /> {label}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
