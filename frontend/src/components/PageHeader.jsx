/**
 * Unified page header used across every public page so the top of each
 * screen looks identical and professional: a small eyebrow label, a large
 * title, an optional subtitle, and optional right-aligned actions.
 *
 *   <PageHeader eyebrow="Kurslar" title="Barcha kurslar"
 *               subtitle="8 ta kurs orasidan tanlang"
 *               actions={<button className="btn btn-primary">…</button>} />
 */
export default function PageHeader({ eyebrow, title, subtitle, actions, children }) {
  return (
    <div className="pgh">
      <div className="pgh-inner">
        <div className="pgh-main">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="pgh-title">{title}</h1>
          {subtitle && <p className="pgh-sub">{subtitle}</p>}
        </div>
        {actions && <div className="pgh-actions">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
