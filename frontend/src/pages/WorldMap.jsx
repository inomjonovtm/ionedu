import { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import World from '@svg-maps/world'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import { COUNTRIES, flagUrl } from '../data/countries'

/* Bizning bazadagi davlatlar — ISO kod bo'yicha */
const BY_CODE = Object.fromEntries(COUNTRIES.map(c => [c.code, c]))
/* Xaritadagi har bir hudud nomi (inglizcha) — kod bo'yicha */
const NAME_BY_ID = Object.fromEntries(World.locations.map(l => [l.id, l.name]))

const CONT_COLOR = {
  'Osiyo': '#0E8345',
  'Yevropa': '#2563EB',
  'Afrika': '#B45309',
  'Shimoliy Amerika': '#0EA5E9',
  'Janubiy Amerika': '#9333EA',
  'Okeaniya': '#0D9488',
}

const [, , VBW, VBH] = World.viewBox.split(' ').map(Number)

const css = `
  .wm-head { padding: 30px 0 20px; }
  .wm-kicker {
    display: inline-flex; align-items: center; gap: 8px; color: var(--green-700);
    font-weight: 600; font-size: 12.5px; font-family: var(--font-mono);
    text-transform: uppercase; letter-spacing: .1em;
    background: var(--green-50); padding: 5px 11px; border-radius: 999px;
    box-shadow: inset 0 0 0 1px var(--green-100);
  }
  .wm-head h1 { font-size: 32px; letter-spacing: -0.025em; margin-top: 14px; }
  .wm-head p { color: var(--text-3); margin-top: 8px; font-size: 15px; max-width: 600px; }

  .wm-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; padding-bottom: 80px; }
  @media (max-width: 920px) { .wm-grid { grid-template-columns: 1fr; } }

  /* ── Xarita sahnasi ── */
  .wm-stage {
    position: relative; border-radius: 20px; overflow: hidden;
    border: 1px solid var(--border);
    background:
      radial-gradient(120% 90% at 50% -10%, #eef5fb, transparent 60%),
      linear-gradient(180deg, #e9f1f8, #e3edf5);
    box-shadow: var(--shadow-soft);
    touch-action: none;
  }
  .wm-svg { display: block; width: 100%; height: auto; cursor: grab; }
  .wm-svg.grabbing { cursor: grabbing; }
  .wm-svg path { transition: fill-opacity .15s ease, fill .15s ease; }

  .wm-tip {
    position: absolute; z-index: 5; pointer-events: none;
    transform: translate(-50%, calc(-100% - 12px));
    background: var(--ink); color: #fff; font-size: 12.5px; font-weight: 600;
    padding: 5px 10px; border-radius: 8px; white-space: nowrap;
    box-shadow: 0 8px 20px -8px rgba(0,0,0,.5); opacity: 0; transition: opacity .12s;
  }
  .wm-tip.on { opacity: 1; }
  .wm-tip.has::after {
    content: ''; position: absolute; left: 50%; top: 100%; transform: translateX(-50%);
    border: 5px solid transparent; border-top-color: var(--ink);
  }

  .wm-ctrl { position: absolute; right: 12px; bottom: 12px; z-index: 4; display: flex; flex-direction: column; gap: 6px; }
  .wm-ctrl button {
    width: 38px; height: 38px; border-radius: 11px; display: inline-flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,.92); border: 1px solid var(--border); color: var(--text-2);
    box-shadow: var(--shadow-soft); cursor: pointer; transition: .15s; font-size: 18px; font-weight: 600;
  }
  .wm-ctrl button:hover { background: #fff; color: var(--text); border-color: #CFD3CE; }

  .wm-legend {
    position: absolute; left: 12px; bottom: 12px; z-index: 4;
    display: flex; flex-wrap: wrap; gap: 5px 12px; max-width: 60%;
    background: rgba(255,255,255,.86); backdrop-filter: blur(4px);
    border: 1px solid var(--border); border-radius: 12px; padding: 9px 12px;
  }
  .wm-legend .lg { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-2); font-weight: 500; }
  .wm-legend .sw { width: 11px; height: 11px; border-radius: 3px; }
  .wm-hint { position: absolute; left: 14px; top: 12px; z-index: 4; font-size: 11.5px; color: var(--text-3);
    background: rgba(255,255,255,.82); border: 1px solid var(--border); border-radius: 999px; padding: 4px 11px; backdrop-filter: blur(4px); }

  /* ── Ma'lumot paneli ── */
  .wm-panel { position: sticky; top: 84px; display: flex; flex-direction: column; gap: 14px; }
  .wm-search { position: relative; }
  .wm-search .ico { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--text-3); pointer-events: none; }
  .wm-search input { width: 100%; height: 44px; padding: 0 14px 0 38px; border-radius: 12px; border: 1px solid var(--border); background: var(--white); font-size: 14px; outline: none; transition: border-color .15s, box-shadow .15s; }
  .wm-search input:focus { border-color: var(--green-600); box-shadow: var(--shadow-ring); }
  .wm-results { margin-top: 6px; border: 1px solid var(--border); border-radius: 12px; background: var(--white); box-shadow: var(--shadow-pop); overflow: hidden; }
  .wm-results button { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 9px 12px; background: none; border: none; cursor: pointer; font-size: 14px; color: var(--text-2); transition: background .12s; }
  .wm-results button:hover { background: var(--bg-soft); color: var(--text); }
  .wm-results img { width: 24px; height: 16px; object-fit: cover; border-radius: 3px; box-shadow: 0 0 0 1px rgba(0,0,0,.08); }

  .wm-card { border: 1px solid var(--border); border-radius: 18px; background: var(--white); overflow: hidden; box-shadow: var(--shadow-soft); }
  .wm-card-flag { min-height: 132px; position: relative; display: flex; align-items: center; justify-content: center; padding: 20px; background: var(--bg-soft); border-bottom: 1px solid var(--border); }
  .wm-card-flag img { width: auto; height: auto; max-width: 78%; max-height: 104px; object-fit: contain; border-radius: 8px; box-shadow: 0 14px 30px -14px rgba(12,17,14,.45), 0 0 0 1px rgba(12,17,14,.08); }
  .wm-card-body { padding: 18px 20px 20px; }
  .wm-cont { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; color: #fff; }
  .wm-name { font-family: var(--font-display); font-weight: 800; font-size: 23px; letter-spacing: -0.02em; margin-top: 10px; }
  .wm-rows { margin-top: 14px; display: flex; flex-direction: column; gap: 10px; }
  .wm-row { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-2); }
  .wm-row .ic { width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-soft); color: var(--text-3); }
  .wm-row b { color: var(--text); font-weight: 650; }
  .wm-clues { margin-top: 16px; }
  .wm-clue { display: flex; gap: 9px; align-items: flex-start; font-size: 13.5px; color: var(--text-2); padding: 8px 0; border-top: 1px dashed var(--border); line-height: 1.5; }
  .wm-clue .n { width: 20px; height: 20px; flex-shrink: 0; border-radius: 999px; background: var(--green-600); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .wm-cta { margin-top: 16px; display: flex; height: 44px; border-radius: 12px; align-items: center; justify-content: center; gap: 8px; font-weight: 650; font-size: 14px; background: linear-gradient(135deg, var(--green-600), var(--green-700)); color: #fff; box-shadow: 0 12px 26px -14px rgba(14,131,69,.6); transition: filter .15s, transform .12s; }
  .wm-cta:hover { filter: brightness(1.06); transform: translateY(-2px); }

  .wm-empty { border: 1px dashed var(--border); border-radius: 18px; background: var(--bg-soft); padding: 40px 24px; text-align: center; }
  .wm-empty .eic { width: 56px; height: 56px; border-radius: 16px; background: var(--white); color: var(--green-600); box-shadow: inset 0 0 0 1px var(--green-100); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
  .wm-empty h3 { font-size: 16px; }
  .wm-empty p { font-size: 13.5px; color: var(--text-3); margin-top: 6px; line-height: 1.55; }
`

export default function WorldMap() {
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [view, setView] = useState({ k: 1, x: 0, y: 0 })
  const [query, setQuery] = useState('')
  const [grabbing, setGrabbing] = useState(false)

  const svgRef = useRef(null)
  const stageRef = useRef(null)
  const tipRef = useRef(null)
  const dragRef = useRef(null)
  const pannedRef = useRef(false)

  const clamp = v => {
    const k = Math.min(8, Math.max(1, v.k))
    const minX = -(k - 1) * VBW, minY = -(k - 1) * VBH
    return { k, x: Math.min(0, Math.max(minX, v.x)), y: Math.min(0, Math.max(minY, v.y)) }
  }
  const zoomAt = (px, py, factor) => setView(v => {
    const k = Math.min(8, Math.max(1, v.k * factor))
    if (k === v.k) return v
    return clamp({ k, x: px - (px - v.x) * (k / v.k), y: py - (py - v.y) * (k / v.k) })
  })

  // Sichqoncha g'ildiragi bilan zoom (kursorga qarab)
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = e => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width * VBW
      const py = (e.clientY - r.top) / r.height * VBH
      zoomAt(px, py, e.deltaY < 0 ? 1.18 : 1 / 1.18)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  function onPointerDown(e) {
    dragRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }
    pannedRef.current = false
    setGrabbing(true)
  }
  function onPointerMove(e) {
    if (!dragRef.current) return
    const r = svgRef.current.getBoundingClientRect()
    const dxPx = e.clientX - dragRef.current.x
    const dyPx = e.clientY - dragRef.current.y
    if (Math.abs(dxPx) + Math.abs(dyPx) > 4) pannedRef.current = true
    setView(clamp({
      k: view.k,
      x: dragRef.current.vx + dxPx / r.width * VBW,
      y: dragRef.current.vy + dyPx / r.height * VBH,
    }))
  }
  function onPointerUp() { dragRef.current = null; setGrabbing(false) }

  function onStageMove(e) {
    const tip = tipRef.current, stage = stageRef.current
    if (!tip || !stage) return
    const r = stage.getBoundingClientRect()
    tip.style.left = (e.clientX - r.left) + 'px'
    tip.style.top = (e.clientY - r.top) + 'px'
  }

  function pickCountry(id) {
    if (pannedRef.current) { pannedRef.current = false; return }
    setSelected(id)
  }

  function styleFor(id) {
    const isSel = id === selected
    const isHov = id === hovered
    const c = BY_CODE[id]
    if (isSel) {
      const col = c ? (CONT_COLOR[c.continent] || '#0E8345') : '#0E8345'
      return { fill: col, fillOpacity: 1, stroke: '#fff', strokeWidth: 0.6 }
    }
    if (c) {
      const col = CONT_COLOR[c.continent] || '#0E8345'
      return { fill: col, fillOpacity: isHov ? 0.75 : 0.42, stroke: '#fff', strokeWidth: 0.4 }
    }
    return { fill: isHov ? '#c5cec8' : '#dfe4e0', fillOpacity: 1, stroke: '#fff', strokeWidth: 0.35 }
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.capital.toLowerCase().includes(q)).slice(0, 6)
  }, [query])

  const sel = selected ? BY_CODE[selected] : null
  const selName = selected ? (sel?.name || NAME_BY_ID[selected] || selected.toUpperCase()) : null
  const hovName = hovered ? (BY_CODE[hovered]?.name || NAME_BY_ID[hovered]) : null

  return (
    <Layout>
      <style>{css}</style>
      <div className="container">
        <div className="wm-head">
          <span className="wm-kicker"><Icon name="globe" size={14} /> Interaktiv atlas</span>
          <h1>Dunyo xaritasi</h1>
          <p>
            Istalgan davlat ustiga bosing — bayrog'i, poytaxti va qiziqarli
            faktlari chiqadi. G'ildirak bilan kattalashtiring, ushlab suring.
          </p>
        </div>

        <div className="wm-grid">
          {/* Xarita */}
          <div className="wm-stage" ref={stageRef} onMouseMove={onStageMove}>
            <span className="wm-hint"><Icon name="search" size={11} style={{ verticalAlign: '-1px' }} /> Bosing · suring · zoom</span>
            <svg
              ref={svgRef}
              className={`wm-svg ${grabbing ? 'grabbing' : ''}`}
              viewBox={World.viewBox}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={() => { onPointerUp(); setHovered(null); tipRef.current?.classList.remove('on') }}
            >
              <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
                {World.locations.map(loc => (
                  <path
                    key={loc.id}
                    data-id={loc.id}
                    d={loc.path}
                    style={{ ...styleFor(loc.id), cursor: 'pointer' }}
                    onMouseEnter={() => { setHovered(loc.id); tipRef.current?.classList.add('on') }}
                    onClick={() => pickCountry(loc.id)}
                  />
                ))}
              </g>
            </svg>

            <div className={`wm-tip ${hovName ? 'has' : ''}`} ref={tipRef}>{hovName || ''}</div>

            <div className="wm-legend">
              {Object.entries(CONT_COLOR).map(([name, col]) => (
                <span key={name} className="lg"><span className="sw" style={{ background: col }} /> {name}</span>
              ))}
            </div>

            <div className="wm-ctrl">
              <button onClick={() => zoomAt(VBW / 2, VBH / 2, 1.4)} aria-label="Kattalashtirish">+</button>
              <button onClick={() => zoomAt(VBW / 2, VBH / 2, 1 / 1.4)} aria-label="Kichiklashtirish">−</button>
              <button onClick={() => setView({ k: 1, x: 0, y: 0 })} aria-label="Boshlang'ich holat" style={{ fontSize: 0 }}>
                <Icon name="rotate" size={16} />
              </button>
            </div>
          </div>

          {/* Panel */}
          <aside className="wm-panel">
            <div className="wm-search">
              <Icon name="search" size={16} className="ico" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Davlatni qidiring…" />
              {results.length > 0 && (
                <div className="wm-results">
                  {results.map(c => (
                    <button key={c.code} onClick={() => { setSelected(c.code); setQuery('') }}>
                      <img src={flagUrl(c.code)} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selName ? (
              <div className="wm-card">
                <div className="wm-card-flag">
                  <img src={flagUrl(selected)} alt={selName}
                    onError={e => { e.currentTarget.style.display = 'none' }} />
                </div>
                <div className="wm-card-body">
                  {sel && (
                    <span className="wm-cont" style={{ background: CONT_COLOR[sel.continent] || '#0E8345' }}>
                      <Icon name="mapPin" size={11} /> {sel.continent}
                    </span>
                  )}
                  <div className="wm-name">{selName}</div>

                  {sel ? (
                    <>
                      <div className="wm-rows">
                        <div className="wm-row">
                          <span className="ic"><Icon name="star" size={15} /></span>
                          Poytaxti: <b>{sel.capital}</b>
                        </div>
                      </div>
                      {sel.clues?.length >= 3 && (
                        <div className="wm-clues">
                          {sel.clues.map((c, i) => (
                            <div className="wm-clue" key={i}><span className="n">{i + 1}</span><span>{c}</span></div>
                          ))}
                        </div>
                      )}
                      <Link to="/games" className="wm-cta"><Icon name="gamepad" size={15} /> O'yinlarda sinab ko'ring</Link>
                    </>
                  ) : (
                    <p className="text-sm text-muted" style={{ marginTop: 12, lineHeight: 1.6 }}>
                      Bu hudud haqida batafsil ma'lumot tez orada qo'shiladi.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="wm-empty">
                <div className="eic"><Icon name="mapPin" size={26} /></div>
                <h3>Davlatni tanlang</h3>
                <p>Xaritadan istalgan davlat ustiga bosing yoki yuqoridan qidiring — bu yerda ma'lumot chiqadi.</p>
              </div>
            )}

            <div className="text-xs text-muted" style={{ textAlign: 'center' }}>
              <b style={{ color: 'var(--green-700)' }}>{COUNTRIES.length}</b> ta davlat to'liq ma'lumotga ega
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  )
}
