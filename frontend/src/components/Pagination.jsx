import Icon from './Icon'

const css = `
  .pg { display: flex; justify-content: center; align-items: center; gap: 14px 18px; margin: 36px 0 0; flex-wrap: wrap; }
  .pg.compact { margin: 14px 0 0; gap: 10px; }
  .pg-track { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: center; }
  .pg-btn {
    min-width: 40px; height: 40px; padding: 0 6px;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    background: var(--white); color: var(--text-2);
    border: 1.5px solid var(--border); border-radius: 13px;
    font-family: var(--font-mono); font-weight: 600; font-size: 13px;
    transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease, background .14s ease;
  }
  .pg-btn:hover:not(:disabled):not(.on) { border-color: var(--line); color: var(--text); transform: translate(-1px, -1px); box-shadow: var(--hard-sm); }
  .pg-btn.on { background: var(--sun); color: #14213D; border-color: var(--line); box-shadow: var(--hard-sm); transform: rotate(-3deg); cursor: default; }
  .pg-btn:disabled { opacity: .4; cursor: not-allowed; }
  .pg-btn.nav { padding: 0 13px; font-family: var(--font-body); font-weight: 700; font-size: 13px; }
  .pg-gap { width: 18px; border-top: 2px dashed var(--border); }
  .pg-range { font-family: var(--font-mono); font-size: 11px; letter-spacing: .06em; color: var(--text-3); white-space: nowrap; }
  .pg.compact .pg-btn { min-width: 32px; height: 32px; border-radius: 10px; font-size: 12px; }
  .pg.compact .pg-btn.nav { padding: 0 7px; }
  .pg.compact .pg-btn.nav span { display: none; }
  @media (max-width: 560px) {
    .pg-btn { min-width: 36px; height: 36px; border-radius: 11px; }
    .pg-btn.nav { padding: 0 9px; }
    .pg-btn.nav span { display: none; }
  }
`

/**
 * Reusable pagination control.
 *
 * Props:
 *   page          current page (1-based)
 *   pageSize      items per page (default 12)
 *   total         total item count
 *   onChange(p)   called with new page
 *   compact       smaller variant
 */
export default function Pagination({ page = 1, pageSize = 12, total = 0, onChange, compact = false }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null

  const cur = Math.min(Math.max(1, page), pages)
  const set = (n) => onChange?.(Math.min(Math.max(1, n), pages))

  // build visible numbers — 1 … cur-1, cur, cur+1 … last
  const nums = []
  const push = (n) => { if (!nums.includes(n) && n >= 1 && n <= pages) nums.push(n) }
  push(1); push(cur - 1); push(cur); push(cur + 1); push(pages)
  nums.sort((a, b) => a - b)
  const items = []
  let prev = 0
  nums.forEach(n => {
    if (n - prev > 1) items.push('…')
    items.push(n); prev = n
  })

  return (
    <nav className={`pg ${compact ? 'compact' : ''}`} aria-label="Sahifalar">
      <style>{css}</style>
      <div className="pg-track">
        <button type="button" className="pg-btn nav" onClick={() => set(cur - 1)} disabled={cur === 1} aria-label="Oldingi sahifa">
          <Icon name="chevL" size={15} /><span>Oldingi</span>
        </button>
        {items.map((it, i) => it === '…' ? (
          <span key={`dot-${i}`} className="pg-gap" aria-hidden="true" />
        ) : (
          <button type="button" key={it} onClick={() => set(it)}
            className={`pg-btn ${it === cur ? 'on' : ''}`} aria-current={it === cur ? 'page' : undefined}>
            {it}
          </button>
        ))}
        <button type="button" className="pg-btn nav" onClick={() => set(cur + 1)} disabled={cur === pages} aria-label="Keyingi sahifa">
          <span>Keyingi</span><Icon name="chevR" size={15} />
        </button>
      </div>
      {!compact && (
        <span className="pg-range">
          {(cur - 1) * pageSize + 1}–{Math.min(cur * pageSize, total)} / {total}
        </span>
      )}
    </nav>
  )
}
