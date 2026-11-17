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

/* Atlas palette — flat sticker colours. The actual values live in CSS
   variables on .wm-page (see below) so they flip with the theme. */
const CONT_KEY = {
  'Osiyo': 'asia',
  'Yevropa': 'europe',
  'Afrika': 'africa',
  'Shimoliy Amerika': 'namerica',
  'Janubiy Amerika': 'samerica',
  'Okeaniya': 'oceania',
}
const contVar = (continent, soft) => `var(--wm-${CONT_KEY[continent] || 'other'}${soft ? '-soft' : ''})`
const CONT_COLOR = Object.fromEntries(Object.keys(CONT_KEY).map(name => [name, contVar(name)]))

const [, , VBW, VBH] = World.viewBox.split(' ').map(Number)

const css = `
  .wm-page {
    padding-bottom: 90px;
    /* map palette: sea, land without data, coastline, then continent soft / strong pairs */
    --wm-sea: #E3EDFF; --wm-grid: #C5D6FA;
    --wm-land: #F4EDDC; --wm-land-hover: #E6DDC8; --wm-edge: #14213D;
    --wm-asia: #FFC83D;     --wm-asia-soft: #FFE39A;
    --wm-europe: #6F9BFF;   --wm-europe-soft: #BCD1FF;
    --wm-africa: #FF7F63;   --wm-africa-soft: #FFC6B9;
    --wm-namerica: #4FCB8E; --wm-namerica-soft: #BFEBD0;
    --wm-samerica: #A38BFF; --wm-samerica-soft: #DAD0FF;
    --wm-oceania: #3FC7B8;  --wm-oceania-soft: #B9ECE6;
    --wm-other: #9AA6C0;    --wm-other-soft: #DDE3EE;
  }
  html[data-theme="dark"] .wm-page {
    --wm-sea: #0F1A33; --wm-grid: #1C2845;
    --wm-land: #222E4C; --wm-land-hover: #33426A; --wm-edge: #0D1424;
    --wm-asia: #FFC83D;     --wm-asia-soft: #7A621C;
    --wm-europe: #7FA6FF;   --wm-europe-soft: #2B4A94;
    --wm-africa: #FF8A73;   --wm-africa-soft: #853D2F;
    --wm-namerica: #2FC486; --wm-namerica-soft: #1D6447;
    --wm-samerica: #A592FF; --wm-samerica-soft: #473B91;
    --wm-oceania: #4FD3C4;  --wm-oceania-soft: #1A645C;
    --wm-other: #8A96B4;    --wm-other-soft: #33426A;
  }

  /* ── Header ── */
  .wm-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; flex-wrap: wrap; padding: 54px 0 32px; }
  .wm-head h1 { font-size: 56px; line-height: 1; letter-spacing: -0.045em; margin-top: 18px; }
  .wm-head p { color: var(--text-3); margin-top: 14px; font-size: 16.5px; max-width: 540px; line-height: 1.55; }
  .wm-count {
    display: flex; align-items: center; gap: 14px; padding: 14px 20px 14px 16px; transform: rotate(2deg);
    background: var(--sun); color: #14213D; border: 2px solid var(--line); border-radius: 20px; box-shadow: var(--hard);
  }
  .wm-count b { font-family: var(--font-display); font-weight: 800; font-size: 44px; letter-spacing: -0.05em; line-height: 1; }
  .wm-count span { font-size: 13px; font-weight: 700; line-height: 1.3; max-width: 120px; }

  .wm-grid { display: grid; grid-template-columns: 350px minmax(0, 1fr); gap: 26px; align-items: start; }

  /* ── Map frame: a window with a title bar ── */
  .wm-mapcol { min-width: 0; }
  .wm-frame { border: 2px solid var(--line); border-radius: 26px; overflow: hidden; background: var(--white); box-shadow: var(--hard-lg); }
  .wm-bar { display: flex; align-items: center; gap: 12px; padding: 10px 12px 10px 18px; border-bottom: 2px solid var(--line); }
  .wm-bar .hint { font-family: var(--font-mono); font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text-3); display: inline-flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wm-zoom { margin-left: auto; font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--text); background: var(--bg-soft); border-radius: 8px; padding: 4px 9px; white-space: nowrap; }
  .wm-ctrl { display: flex; gap: 6px; flex-shrink: 0; }
  .wm-ctrl button {
    width: 36px; height: 36px; border-radius: 11px; display: inline-flex; align-items: center; justify-content: center;
    background: var(--white); border: 1.5px solid var(--line); color: var(--text);
    cursor: pointer; font-size: 19px; font-weight: 700; line-height: 1;
    transition: transform .14s ease, box-shadow .14s ease, background .14s ease;
  }
  .wm-ctrl button:hover { background: var(--sun); color: #14213D; transform: translate(-1px, -1px); box-shadow: var(--hard-sm); }

  .wm-stage {
    position: relative; overflow: hidden; touch-action: none;
    background-color: var(--wm-sea);
    background-image: radial-gradient(var(--wm-grid) 1.2px, transparent 1.2px); background-size: 22px 22px;
  }
  .wm-svg { display: block; width: 100%; height: auto; cursor: grab; }
  .wm-svg.grabbing { cursor: grabbing; }
  .wm-svg path { cursor: pointer; stroke-linejoin: round; transition: fill .15s ease; }

  .wm-tip {
    position: absolute; z-index: 5; pointer-events: none;
    transform: translate(-50%, calc(-100% - 12px));
    background: var(--sun); color: #14213D; font-size: 12.5px; font-weight: 700;
    padding: 5px 11px; border-radius: 10px; white-space: nowrap; border: 1.5px solid #14213D;
    box-shadow: 2px 2px 0 #14213D; opacity: 0; transition: opacity .12s;
  }
  .wm-tip.on { opacity: 1; }
  .wm-tip:not(.has) { opacity: 0; }

  .wm-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 18px; }
  .wm-legend .ttl { font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-3); margin-right: 4px; }
  .wm-legend .lg { display: inline-flex; align-items: center; gap: 7px; height: 30px; padding: 0 12px 0 9px; border-radius: 999px; background: var(--white); border: 1.5px solid var(--border); font-size: 12.5px; color: var(--text-2); font-weight: 650; }
  .wm-legend .sw { width: 13px; height: 13px; border-radius: 5px; border: 1.5px solid var(--line); }

  /* ── Side panel ── */
  .wm-panel { position: sticky; top: 96px; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
  .wm-search { position: relative; }
  .wm-search .ico { position: absolute; left: 15px; top: 25px; transform: translateY(-50%); color: var(--text-3); pointer-events: none; }
  .wm-search input { height: 50px; padding-left: 44px; font-weight: 600; border-color: var(--line); border-width: 2px; border-radius: 16px; }
  .wm-results { margin-top: 8px; border: 2px solid var(--line); border-radius: 16px; background: var(--white); box-shadow: var(--hard); overflow: hidden; padding: 5px; }
  .wm-results button { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; padding: 9px 10px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--text-2); transition: background .12s; }
  .wm-results button:hover { background: var(--bg-soft); color: var(--text); }
  .wm-results img { width: 26px; height: 18px; object-fit: cover; border-radius: 4px; border: 1.5px solid var(--border); }

  .wm-card { border: 2px solid var(--line); border-radius: 24px; background: var(--white); overflow: hidden; box-shadow: var(--hard); }
  .wm-card-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 16px; border-bottom: 1.5px dashed var(--border); font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-3); }
  .wm-card-flag {
    min-height: 150px; display: flex; align-items: center; justify-content: center; padding: 24px;
    background-color: var(--bg-soft); background-image: radial-gradient(var(--border) 1.2px, transparent 1.2px); background-size: 18px 18px;
  }
  .wm-card-flag img { width: auto; height: auto; max-width: 72%; max-height: 104px; object-fit: contain; border-radius: 8px; border: 2px solid var(--line); box-shadow: var(--hard); transform: rotate(-3deg); }
  .wm-card-body { padding: 18px 20px 20px; border-top: 1.5px dashed var(--border); }
  .wm-cont { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; padding: 3px 11px 3px 8px; border-radius: 999px; border: 1.5px solid var(--line); color: var(--text); }
  .wm-cont i { width: 11px; height: 11px; border-radius: 999px; border: 1.5px solid var(--line); }
  .wm-soon { font-size: 13.5px; color: var(--text-3); margin-top: 12px; line-height: 1.6; }
  .wm-name { font-family: var(--font-display); font-weight: 800; font-size: 32px; letter-spacing: -0.04em; line-height: 1.05; margin-top: 12px; overflow-wrap: anywhere; }
  .wm-cap { margin-top: 14px; display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px; background: var(--sun-soft); font-size: 14px; color: var(--text-2); }
  .wm-cap .ic { width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--sun); color: #14213D; border: 1.5px solid var(--line); }
  .wm-cap small { display: block; font-family: var(--font-mono); font-size: 9.5px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-3); line-height: 1.3; }
  .wm-cap b { color: var(--text); font-weight: 700; font-size: 15.5px; }
  .wm-clues { margin-top: 14px; }
  .wm-clue { display: flex; gap: 11px; align-items: flex-start; font-size: 13.5px; color: var(--text-2); padding: 10px 0; border-top: 1.5px dashed var(--border); line-height: 1.5; }
  .wm-clue .n { width: 22px; height: 22px; flex-shrink: 0; border-radius: 7px; background: var(--ink); color: #fff; font-family: var(--font-mono); font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .wm-card .btn { margin-top: 14px; }

  .wm-empty { border: 2px dashed var(--border); border-radius: 24px; padding: 38px 24px; text-align: center; }
  .wm-empty .eic { width: 60px; height: 60px; border-radius: 18px; background: var(--coral); color: #14213D; border: 2px solid var(--line); box-shadow: var(--hard-sm); transform: rotate(-6deg); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
  .wm-empty h3 { font-size: 21px; letter-spacing: -0.03em; }
  .wm-empty p { font-size: 13.5px; color: var(--text-3); margin-top: 8px; line-height: 1.55; }

  @media (max-width: 980px) {
    .wm-grid { grid-template-columns: 1fr; }
    .wm-mapcol { order: -1; }
    .wm-panel { position: static; }
  }
  @media (max-width: 768px) {
    .wm-head { padding: 30px 0 22px; }
    .wm-head h1 { font-size: 36px; }
    .wm-head p { font-size: 14.5px; }
    .wm-count { transform: none; padding: 10px 16px 10px 14px; box-shadow: var(--hard-sm); }
    .wm-count b { font-size: 30px; }
    .wm-frame { border-radius: 20px; box-shadow: var(--hard); }
    .wm-bar { padding: 8px 8px 8px 12px; gap: 8px; }
    .wm-bar .hint span { display: none; }
  }
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
      return { fill: contVar(c?.continent), stroke: 'var(--line)', strokeWidth: 1.1 }
    }
    if (c) {
      return { fill: contVar(c.continent, !isHov), stroke: 'var(--wm-edge)', strokeWidth: 0.4 }
    }
    return { fill: isHov ? 'var(--wm-land-hover)' : 'var(--wm-land)', stroke: 'var(--wm-edge)', strokeWidth: 0.3 }
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
      <div className="container wm-page">
        <header className="wm-head">
          <div className="fade-up">
            <span className="eyebrow">Interaktiv atlas</span>
            <h1>Dunyo <span className="mark-sun">xaritasi</span></h1>
            <p>
              Istalgan davlat ustiga bosing — bayrog'i, poytaxti va qiziqarli
              faktlari chiqadi. G'ildirak bilan kattalashtiring, ushlab suring.
            </p>
          </div>
          <div className="wm-count fade-up-d1">
            <b>{COUNTRIES.length}</b>
            <span>ta davlat to'liq ma'lumotga ega</span>
          </div>
        </header>

        <div className="wm-grid">
          {/* Panel */}
          <aside className="wm-panel">
            <div className="wm-search">
              <Icon name="search" size={17} className="ico" />
              <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Davlatni qidiring…" />
              {results.length > 0 && (
                <div className="wm-results">
                  {results.map(c => (
                    <button type="button" key={c.code} onClick={() => { setSelected(c.code); setQuery('') }}>
                      <img src={flagUrl(c.code)} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selName ? (
              <div className="wm-card" key={selected}>
                <div className="wm-card-top">
                  <span>Davlat kartasi</span>
                  <span>{selected.toUpperCase()}</span>
                </div>
                <div className="wm-card-flag">
                  <img src={flagUrl(selected)} alt={selName}
                    onError={e => { e.currentTarget.style.display = 'none' }} />
                </div>
                <div className="wm-card-body">
                  {sel && (
                    <span className="wm-cont">
                      <i style={{ background: contVar(sel.continent) }} /> {sel.continent}
                    </span>
                  )}
                  <div className="wm-name">{selName}</div>

                  {sel ? (
                    <>
                      <div className="wm-cap">
                        <span className="ic"><Icon name="star" size={16} /></span>
                        <span><small>Poytaxti</small><b>{sel.capital}</b></span>
                      </div>
                      {sel.clues?.length >= 3 && (
                        <div className="wm-clues">
                          {sel.clues.map((c, i) => (
                            <div className="wm-clue" key={i}><span className="n">{i + 1}</span><span>{c}</span></div>
                          ))}
                        </div>
                      )}
                      <Link to="/games" className="btn btn-primary btn-block"><Icon name="gamepad" size={16} /> O'yinlarda sinab ko'ring</Link>
                    </>
                  ) : (
                    <p className="wm-soon">
                      Bu hudud haqida batafsil ma'lumot tez orada qo'shiladi.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="wm-empty">
                <div className="eic"><Icon name="mapPin" size={28} /></div>
                <h3>Davlatni tanlang</h3>
                <p>Xaritadan istalgan davlat ustiga bosing yoki yuqoridan qidiring — bu yerda ma'lumot chiqadi.</p>
              </div>
            )}
          </aside>

          {/* Xarita */}
          <div className="wm-mapcol">
            <div className="wm-frame">
              <div className="wm-bar">
                <span className="hint"><Icon name="compass" size={15} /> <span>Bosing · suring · zoom</span></span>
                <span className="wm-zoom">×{view.k.toFixed(1)}</span>
                <div className="wm-ctrl">
                  <button type="button" onClick={() => zoomAt(VBW / 2, VBH / 2, 1.4)} aria-label="Kattalashtirish">+</button>
                  <button type="button" onClick={() => zoomAt(VBW / 2, VBH / 2, 1 / 1.4)} aria-label="Kichiklashtirish">−</button>
                  <button type="button" onClick={() => setView({ k: 1, x: 0, y: 0 })} aria-label="Boshlang'ich holat">
                    <Icon name="rotate" size={16} />
                  </button>
                </div>
              </div>

              <div className="wm-stage" ref={stageRef} onMouseMove={onStageMove}>
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
                        style={styleFor(loc.id)}
                        onMouseEnter={() => { setHovered(loc.id); tipRef.current?.classList.add('on') }}
                        onClick={() => pickCountry(loc.id)}
                      />
                    ))}
                  </g>
                </svg>

                <div className={`wm-tip ${hovName ? 'has' : ''}`} ref={tipRef}>{hovName || ''}</div>
              </div>
            </div>

            <div className="wm-legend">
              <span className="ttl">Qit'alar</span>
              {Object.entries(CONT_COLOR).map(([name, col]) => (
                <span key={name} className="lg"><span className="sw" style={{ background: col }} /> {name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
