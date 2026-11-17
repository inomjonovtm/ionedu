import Icon from './Icon'

/**
 * Small confirmation dialog — replaces window.confirm everywhere.
 *   <Confirm title="…" text="…" danger confirmLabel="O'chirish"
 *            busy={m.isPending} onConfirm={…} onClose={…} />
 */
export default function Confirm({
  title, text, children, confirmLabel = 'Tasdiqlash', cancelLabel = 'Bekor qilish',
  danger = false, icon, busy = false, onConfirm, onClose,
}) {
  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <div className="modal" style={{ maxWidth: 430 }} role="alertdialog" aria-modal="true">
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0, transform: 'rotate(-5deg)',
            background: danger ? 'var(--coral)' : 'var(--sun)', color: danger ? '#fff' : '#14213D',
            border: '2px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name={icon || (danger ? 'trash' : 'alert')} size={19} /></span>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 19, lineHeight: 1.2 }}>{title}</h3>
            {text && <p className="text-sm text-muted" style={{ marginTop: 6, lineHeight: 1.55 }}>{text}</p>}
          </div>
        </div>
        {children && <div style={{ marginTop: 16 }}>{children}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>{cancelLabel}</button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? 'Bajarilmoqda…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
