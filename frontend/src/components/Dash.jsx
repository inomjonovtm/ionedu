import { Link } from 'react-router-dom'
import Icon from './Icon'

/* ─────────────────────────────────────────────────────────
   Dash UI kit — shared building blocks for all panels.
   Styles live in ioneda.css (.page-head-row, .stat-card,
   .panel, .empty-state). Keep pages free of inline layout.
   ───────────────────────────────────────────────────────── */

/** Page header: title + subtitle on the left, actions on the right. */
export function PageHead({ title, sub, children }) {
  return (
    <div className="page-head-row">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="page-head-actions">{children}</div>}
    </div>
  )
}

/** KPI card — label top, mono value, icon chip top-right. */
export function StatCard({ icon, value, label, hint, to, tone = 'green', delay = 0 }) {
  const body = (
    <>
      <div className="sc-top">
        <span className="sc-label">{label}</span>
        <span className={`sc-ico tone-${tone}`}><Icon name={icon} size={15} /></span>
      </div>
      <div className="sc-value">{value}</div>
      {hint && <div className="sc-hint">{hint}</div>}
    </>
  )
  const cls = `stat-card fade-up-d${Math.min(delay + 1, 4)}`
  return to
    ? <Link to={to} className={`${cls} stat-card-link`}>{body}</Link>
    : <div className={cls}>{body}</div>
}

/** Panel: card with a hairline header (title + optional "see all" link). */
export function Panel({ title, count, to, toLabel = 'Hammasi', action, flush = true, children, style }) {
  return (
    <div className="panel" style={style}>
      <div className="panel-head">
        <h3>
          {title}
          {count > 0 && <span className="panel-count">{count}</span>}
        </h3>
        {action || (to && <Link to={to} className="panel-link">{toLabel} <Icon name="arrowR" size={12} /></Link>)}
      </div>
      <div className={flush ? 'panel-body-flush' : 'panel-body'}>{children}</div>
    </div>
  )
}

/** Empty state — soft icon tile, title, sub, optional CTA. */
export function EmptyState({ icon = 'file', title, sub, action, small }) {
  return (
    <div className={`empty-state ${small ? 'empty-sm' : ''}`}>
      <span className="es-ico"><Icon name={icon} size={small ? 18 : 22} /></span>
      <div className="es-title">{title}</div>
      {sub && <div className="es-sub">{sub}</div>}
      {action}
    </div>
  )
}

/** Status badge for course lifecycle. */
export function CourseStatus({ status }) {
  const map = {
    published: ['green', 'Nashrda'],
    pending: ['amber', 'Moderatsiyada'],
    rejected: ['red', 'Rad etilgan'],
    draft: ['gray', 'Qoralama'],
  }
  const [tone, label] = map[status] || map.draft
  return <span className={`badge badge-${tone}`}>{label}</span>
}

/** Star row 1..5 */
export function Stars({ value = 0, size = 12 }) {
  return (
    <span className="stars-row">
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} name={i < value ? 'starF' : 'star'} size={size} />
      ))}
    </span>
  )
}
