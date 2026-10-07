import Icon from './Icon'

/**
 * Unified filter bar — used on every list page (front + dashboards) so
 * filtering looks identical everywhere: optional segmented tabs on top,
 * then search + extra controls (children) + clear + result count.
 */
export default function FilterBar({
  search, onSearch, placeholder = 'Qidirish…',
  count = null, countLabel = 'Topildi',
  tabs = null, tab, onTab,
  onClear = null,
  children,
}) {
  return (
    <div className="fbar">
      {tabs && (
        <div className="fbar-tabs">
          <div className="seg-tabs">
            {tabs.map(t => (
              <button key={t.id} type="button" className={tab === t.id ? 'on' : ''} onClick={() => onTab(t.id)}>
                {t.label}{t.n > 0 && <span className="n">{t.n}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="fbar-row">
        {onSearch && (
          <div className="fbar-search">
            <Icon name="search" size={15} className="ic" />
            <input className="input" placeholder={placeholder} value={search}
              onChange={e => onSearch(e.target.value)} />
            {search && (
              <button type="button" className="fbar-x" onClick={() => onSearch('')} title="Tozalash">
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        )}
        {children}
        {onClear && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear} style={{ flexShrink: 0 }}>
            <Icon name="x" size={13} /> Tozalash
          </button>
        )}
        {count !== null && (
          <div className="fbar-count">{countLabel}: <strong>{count}</strong></div>
        )}
      </div>
    </div>
  )
}
