import Icon from './Icon'

const css = `
  .fb { margin-bottom: 22px; min-width: 0; }
  .fb-tabs { display: flex; gap: 8px; overflow-x: auto; padding: 3px 3px 12px; margin: -3px -3px 0; scrollbar-width: none; }
  .fb-tabs::-webkit-scrollbar { display: none; }
  .fb-tabs .chip { flex-shrink: 0; cursor: pointer; }
  .fb-tabs .chip .n {
    font-family: var(--font-mono); font-size: 10.5px; font-weight: 600;
    background: var(--sun); color: #14213D; border-radius: 999px; padding: 0 6px; line-height: 17px;
  }

  .fb-row {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    background: var(--white); border: 2px solid var(--line); border-radius: 18px;
    padding: 7px; box-shadow: var(--hard-sm);
  }
  .fb-search { position: relative; flex: 1 1 240px; min-width: 0; display: flex; align-items: center; }
  .fb-search .ic { position: absolute; left: 12px; color: var(--text-3); pointer-events: none; }
  .fb-search input {
    width: 100%; height: 40px; padding: 0 36px 0 40px;
    border: none; outline: none; background: transparent;
    font-size: 14.5px; font-weight: 600; color: var(--text);
  }
  .fb-search input::placeholder { color: var(--text-4); font-weight: 500; }
  .fb-x {
    position: absolute; right: 6px; width: 26px; height: 26px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; color: var(--text-3);
  }
  .fb-x:hover { background: var(--bg-soft); color: var(--text); }

  .fb-row .select, .fb-row .input {
    width: auto; max-width: 210px; flex: 0 1 auto; height: 40px;
    border: 1.5px solid transparent; border-radius: 12px;
    background-color: var(--bg-soft); font-size: 13.5px; font-weight: 650;
  }
  .fb-row .select:hover, .fb-row .input:hover { border-color: var(--border); }
  .fb-row .select:focus, .fb-row .input:focus { border-color: var(--line); box-shadow: none; }
  .fb-row .checkbox { flex-shrink: 0; padding: 0 8px; font-size: 13.5px; font-weight: 600; }
  .fb-clear {
    flex-shrink: 0; height: 40px; padding: 0 12px; border-radius: 12px;
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 700; color: var(--red-600);
  }
  .fb-clear:hover { background: var(--red-50); }
  .fb-count {
    margin-left: auto; flex-shrink: 0; height: 40px; padding: 0 13px; border-radius: 12px;
    display: inline-flex; align-items: center; gap: 7px;
    background: var(--sun); color: #14213D; border: 1.5px solid #14213D;
    font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
    white-space: nowrap;
  }
  .fb-count strong { font-family: var(--font-display); font-size: 17px; font-weight: 800; letter-spacing: -.03em; }

  @media (max-width: 768px) {
    .fb-row { border-radius: 16px; }
    .fb-search { flex-basis: 100%; border-bottom: 1.5px dashed var(--border); padding-bottom: 6px; }
    .fb-row .select, .fb-row .input { flex: 1 1 130px; max-width: none; min-width: 0; }
  }
`

/**
 * Unified filter bar — used on every list page (front + dashboards) so
 * filtering looks identical everywhere: optional sticker tabs on top,
 * then one outlined toolbar: search + extra controls (children) + clear + result count.
 */
export default function FilterBar({
  search, onSearch, placeholder = 'Qidirish…',
  count = null, countLabel = 'Topildi',
  tabs = null, tab, onTab,
  onClear = null,
  children,
}) {
  return (
    <div className="fb">
      <style>{css}</style>
      {tabs && (
        <div className="fb-tabs">
          {tabs.map(t => (
            <button key={t.id} type="button" className={`chip ${tab === t.id ? 'on' : ''}`} onClick={() => onTab(t.id)}>
              {t.label}{t.n > 0 && <span className="n">{t.n}</span>}
            </button>
          ))}
        </div>
      )}
      <div className="fb-row">
        {onSearch && (
          <div className="fb-search">
            <Icon name="search" size={17} className="ic" />
            <input placeholder={placeholder} value={search} aria-label={placeholder}
              onChange={e => onSearch(e.target.value)} />
            {search && (
              <button type="button" className="fb-x" onClick={() => onSearch('')} title="Tozalash">
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        )}
        {children}
        {onClear && (
          <button type="button" className="fb-clear" onClick={onClear}>
            <Icon name="x" size={13} /> Tozalash
          </button>
        )}
        {count !== null && (
          <div className="fb-count">{countLabel} <strong>{count}</strong></div>
        )}
      </div>
    </div>
  )
}
