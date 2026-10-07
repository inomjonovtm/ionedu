import Icon from './Icon'

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

  const btnH = compact ? 30 : 36
  const btnW = compact ? 30 : 36

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
      margin: compact ? '14px 0 0' : '32px 0 0',
      flexWrap: 'wrap',
    }}>
      <button onClick={() => set(cur - 1)} disabled={cur === 1}
        style={pageBtnStyle(btnW, btnH, false, cur === 1)}>
        <Icon name="chevL" size={14} />
      </button>
      {items.map((it, i) => it === '…' ? (
        <span key={`dot-${i}`} style={{ padding: '0 6px', color: 'var(--text-4)' }}>…</span>
      ) : (
        <button key={it} onClick={() => set(it)}
          style={pageBtnStyle(btnW, btnH, it === cur, false)}>
          {it}
        </button>
      ))}
      <button onClick={() => set(cur + 1)} disabled={cur === pages}
        style={pageBtnStyle(btnW, btnH, false, cur === pages)}>
        <Icon name="chevR" size={14} />
      </button>
      {!compact && (
        <span className="text-muted" style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
          {(cur - 1) * pageSize + 1}–{Math.min(cur * pageSize, total)} / {total}
        </span>
      )}
    </div>
  )
}

function pageBtnStyle(w, h, active, disabled) {
  return {
    width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: active ? '1px solid var(--ink)' : '1px solid var(--border)',
    background: active ? 'var(--ink)' : 'var(--white)',
    color: active ? 'white' : 'var(--text-2)',
    borderRadius: 999, fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 12.5,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all .12s',
  }
}
