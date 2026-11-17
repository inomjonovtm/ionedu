import { useEffect } from 'react'
import Icon from './Icon'
import Confirm from './Confirm'

/* ─────────────────────────────────────────────────────────
   PanelKit — small extras for the admin / teacher panels
   that the Dash kit does not cover: confirm wrapper, form
   modal shell, error / loading blocks and a stat strip.
   Self-contained: styles ship with the components (pk-*).
   ───────────────────────────────────────────────────────── */

const css = `
  .pk-modal { max-width: 440px; padding: 0; overflow: hidden; display: flex; flex-direction: column; }
  .pk-modal.wide { max-width: 640px; }
  .pk-modal-head { display: flex; align-items: flex-start; gap: 14px; padding: 22px 24px 0; }
  .pk-modal-head .pk-tile {
    width: 46px; height: 46px; flex-shrink: 0; border-radius: 14px; border: 2px solid var(--line);
    display: flex; align-items: center; justify-content: center; transform: rotate(-4deg); color: #14213D;
  }
  .pk-tile.danger { background: var(--coral); color: #fff; }
  .pk-tile.sun { background: var(--sun); }
  .pk-tile.sea { background: var(--sea-soft); color: var(--blue-600); }
  .pk-tile.green { background: var(--green-200); }
  .pk-modal-txt { min-width: 0; }
  .pk-modal-head h3 { font-size: 19px; letter-spacing: -0.03em; line-height: 1.2; }
  .pk-modal-head p { font-size: 13.5px; color: var(--text-3); margin-top: 5px; line-height: 1.5; overflow-wrap: anywhere; }
  .pk-modal-head .pk-x { margin-left: auto; flex-shrink: 0; margin-top: -4px; margin-right: -6px; }
  .pk-modal-body { padding: 18px 24px 4px; overflow-y: auto; min-height: 0; }
  .pk-modal-foot {
    display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap;
    padding: 16px 24px 22px; margin-top: 14px; border-top: 1.5px dashed var(--border);
  }
  @media (max-width: 520px) {
    .pk-modal-foot { flex-direction: column-reverse; }
    .pk-modal-foot .btn { width: 100%; }
  }

  .pk-state {
    display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px;
    padding: 48px 24px; background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card);
  }
  .pk-state.bare { background: none; border: none; }
  .pk-state .pk-tile { width: 50px; height: 50px; border-radius: 16px; border: 2px solid var(--line); background: var(--coral); display: flex; align-items: center; justify-content: center; transform: rotate(-5deg); margin-bottom: 8px; color: #fff; }
  .pk-state b { font-family: var(--font-display); font-size: 17px; letter-spacing: -0.02em; color: var(--text); }
  .pk-state span { font-size: 13.5px; color: var(--text-3); max-width: 360px; line-height: 1.55; }
  .pk-state .btn { margin-top: 12px; }
  .pk-loading { color: var(--text-3); font-size: 13.5px; font-weight: 600; gap: 14px; }

  .pk-strip {
    display: grid; grid-template-columns: repeat(var(--pk-n, 4), minmax(0, 1fr));
    background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card);
    margin-bottom: 18px; overflow: hidden;
  }
  .pk-cell { display: flex; align-items: center; gap: 12px; padding: 15px 18px; min-width: 0; border-left: 1.5px dashed var(--border); text-align: left; }
  .pk-cell:first-child { border-left: none; }
  button.pk-cell { cursor: pointer; transition: background .13s ease; }
  button.pk-cell:hover { background: var(--paper); }
  .pk-cell.on, button.pk-cell.on:hover { background: var(--sun-soft); }
  .pk-cell .pk-ico { width: 36px; height: 36px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .pk-cell .pk-txt { min-width: 0; }
  .pk-cell .pk-v { display: block; font-family: var(--font-display); font-size: 24px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; color: var(--text); }
  .pk-cell .pk-l { display: block; font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.09em; color: var(--text-3); margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  @media (max-width: 860px) {
    .pk-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pk-cell { border-left: none; border-top: 1.5px dashed var(--border); }
    .pk-cell:nth-child(-n+2) { border-top: none; }
    .pk-cell:nth-child(even) { border-left: 1.5px dashed var(--border); }
    .pk-cell { padding: 13px 14px; }
    .pk-cell .pk-v { font-size: 21px; }
  }
`

export function PanelKitStyles() {
  return <style>{css}</style>
}

function useEscape(active, onClose) {
  useEffect(() => {
    if (!active) return undefined
    const h = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [active, onClose])
}

/**
 * Confirmation dialog for destructive / important actions — a thin wrapper around
 * the canonical `Confirm` (components/Confirm.jsx), so every dialog looks identical.
 *   <ConfirmModal open={!!target} title="Kursni o'chirish" text="…" busy={del.isPending}
 *                 onConfirm={() => del.mutate(target.id)} onClose={() => setTarget(null)} />
 * tone: 'danger' (default) | 'sun' | 'green'.  `children` render between text and buttons.
 */
export function ConfirmModal({
  open, title, text, children, icon,
  confirmLabel = "O'chirish", cancelLabel = 'Bekor qilish',
  tone = 'danger', busy = false, onConfirm, onClose,
}) {
  useEscape(open && !busy, onClose)
  if (!open) return null
  return (
    <Confirm title={title} text={text} icon={icon} danger={tone === 'danger'}
      confirmLabel={confirmLabel} cancelLabel={cancelLabel} busy={busy}
      onConfirm={onConfirm} onClose={() => onClose?.()}>
      {children}
    </Confirm>
  )
}

/**
 * Shell for form modals: sticker tile + title + close button, scrollable body, footer.
 *   <FormModal title="Yangi kategoriya" sub="…" icon="grid" onClose={…} onSubmit={…}
 *              footer={<><button type="button" …>Bekor</button><button className="btn btn-primary">Saqlash</button></>}>
 *     …fields…
 *   </FormModal>
 * Clicking the backdrop does NOT close it (protects unsaved input); Escape and ✕ do.
 */
export function FormModal({ title, sub, icon = 'edit', tone = 'sun', wide = false, onClose, onSubmit, footer, children }) {
  useEscape(true, onClose)
  return (
    <div className="modal-backdrop">
      <PanelKitStyles />
      <form className={`modal pk-modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true"
        onSubmit={e => { e.preventDefault(); onSubmit?.(e) }}>
        <div className="pk-modal-head">
          <span className={`pk-tile ${tone}`}><Icon name={icon} size={20} /></span>
          <div className="pk-modal-txt">
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
          <button type="button" className="icon-btn pk-x" onClick={onClose} aria-label="Yopish"><Icon name="x" size={17} /></button>
        </div>
        <div className="pk-modal-body">{children}</div>
        {footer && <div className="pk-modal-foot">{footer}</div>}
      </form>
    </div>
  )
}

/** Error block with retry — use when a query fails (`isError`). */
export function ErrorState({ title = "Ma'lumotni yuklab bo'lmadi", sub = "Internet aloqasini tekshirib, qayta urinib ko'ring.", onRetry, bare = false }) {
  return (
    <div className={`pk-state ${bare ? 'bare' : ''}`} role="alert">
      <PanelKitStyles />
      <span className="pk-tile"><Icon name="alert" size={22} /></span>
      <b>{title}</b>
      {sub && <span>{sub}</span>}
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          <Icon name="rotate" size={13} /> Qayta urinish
        </button>
      )}
    </div>
  )
}

/** Loading block inside a card-like frame (keeps page height stable). */
export function LoadingBlock({ label = 'Yuklanmoqda…', bare = false }) {
  return (
    <div className={`pk-state pk-loading ${bare ? 'bare' : ''}`} aria-busy="true">
      <PanelKitStyles />
      <span className="spinner" />
      {label}
    </div>
  )
}

/**
 * Stat strip — one card split into cells by dashed "fold lines".
 * items: [{ label, value, icon, tone ('green'|'blue'|'amber'|'red'|'gray'|'violet'), onClick?, active? }]
 */
export function StatStrip({ items = [] }) {
  return (
    <div className="pk-strip" style={{ '--pk-n': items.length }}>
      <PanelKitStyles />
      {items.map((it, i) => {
        const inner = (
          <>
            {it.icon && <span className={`pk-ico tone-${it.tone || 'gray'}`}><Icon name={it.icon} size={16} /></span>}
            <span className="pk-txt">
              <span className="pk-v">{it.value}</span>
              <span className="pk-l">{it.label}</span>
            </span>
          </>
        )
        return it.onClick
          ? <button type="button" key={i} className={`pk-cell ${it.active ? 'on' : ''}`} onClick={it.onClick}>{inner}</button>
          : <div key={i} className="pk-cell">{inner}</div>
      })}
    </div>
  )
}
