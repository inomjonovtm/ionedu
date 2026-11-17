import Icon from './Icon'

const css = `
  .ph { position: relative; padding: 46px 0 30px; margin-bottom: 26px; border-bottom: 1.5px dashed var(--border); }
  .ph::before {
    content: ''; position: absolute; top: 0; bottom: 0; right: 0; width: min(560px, 60%);
    background-image: var(--topo); background-size: 520px 360px; background-position: right center;
    -webkit-mask-image: linear-gradient(to left, #000 15%, transparent);
    mask-image: linear-gradient(to left, #000 15%, transparent);
    pointer-events: none;
  }
  .ph > * { position: relative; }
  .ph-top { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; min-height: 28px; }
  .ph-rule { flex: 1; min-width: 20px; border-top: 2px dashed var(--border); }
  .ph-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; flex-wrap: wrap; }
  .ph-main { min-width: 0; flex: 1 1 420px; }
  .ph-title { font-size: 56px; font-weight: 800; letter-spacing: -0.045em; line-height: 1; overflow-wrap: anywhere; }
  .ph-sub { font-size: 16.5px; font-weight: 500; color: var(--text-3); margin-top: 16px; max-width: 600px; line-height: 1.55; }
  .ph-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; flex-shrink: 0; padding-bottom: 4px; }
  .ph-stamp {
    width: 84px; height: 84px; border-radius: 24px; flex-shrink: 0; margin: 0 26px 2px 0;
    background: var(--sun); color: #14213D; border: 2px solid var(--line); box-shadow: var(--hard);
    display: flex; align-items: center; justify-content: center; transform: rotate(8deg);
  }
  @media (max-width: 768px) {
    .ph { padding: 28px 0 22px; margin-bottom: 20px; }
    .ph::before { width: 80%; opacity: .7; }
    .ph-top { margin-bottom: 14px; }
    .ph-title { font-size: 36px; }
    .ph-sub { font-size: 14.5px; margin-top: 12px; }
    .ph-stamp { display: none; }
    .ph-main { flex-basis: 100%; }
  }
`

// Highlights the last word of a plain-string title with the hand-drawn marker.
function markTitle(title) {
  if (typeof title !== 'string') return title
  const words = title.trim().split(/\s+/)
  if (words.length < 2) return title
  const last = words.pop()
  return <>{words.join(' ')} <span className="mark-sun">{last}</span></>
}

/**
 * Unified page header used across every public page: a map-pin eyebrow with a
 * coordinate label, a large title (last word highlighted), an optional
 * subtitle, and optional right-aligned actions (a compass stamp otherwise).
 *
 *   <PageHeader eyebrow="Kurslar" title="Barcha kurslar"
 *               subtitle="8 ta kurs orasidan tanlang"
 *               actions={<button className="btn btn-primary">…</button>} />
 */
export default function PageHeader({ eyebrow, title, subtitle, actions, children }) {
  return (
    <header className="ph">
      <style>{css}</style>
      <div className="ph-top">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <span className="ph-rule" aria-hidden="true" />
        <span className="coord">41.31°N · 69.24°E</span>
      </div>
      <div className="ph-row">
        <div className="ph-main">
          <h1 className="ph-title fade-up">{markTitle(title)}</h1>
          {subtitle && <p className="ph-sub fade-up-d1">{subtitle}</p>}
        </div>
        {actions
          ? <div className="ph-actions">{actions}</div>
          : <div className="ph-stamp" aria-hidden="true"><Icon name="compass" size={40} /></div>}
      </div>
      {children}
    </header>
  )
}
