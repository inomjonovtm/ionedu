import { useState, useEffect } from 'react'
import { LogoMark } from './Logo'

/* Branded splash shown once per session: a compass sticker drops onto
   the map paper, then the whole sheet slides away. */
const css = `
  .intro {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background-color: var(--paper); background-image: var(--topo); background-size: 520px 360px;
  }
  .intro.leave { animation: introOut .5s cubic-bezier(.6,0,.3,1) forwards; }
  @keyframes introOut { to { transform: translateY(-100%); visibility: hidden; } }
  .intro-mark { animation: introDrop .6s cubic-bezier(.2,.9,.3,1.4) both; filter: drop-shadow(5px 5px 0 #14213D); }
  @keyframes introDrop { from { opacity: 0; transform: translateY(-40px) rotate(-18deg) scale(.7); } to { opacity: 1; transform: rotate(-6deg); } }
  .intro-brand {
    margin-top: 26px; font-family: var(--font-display); font-weight: 800; font-size: 40px;
    letter-spacing: -0.05em; color: var(--text); line-height: 1;
    opacity: 0; animation: introUp .45s ease .2s forwards;
  }
  .intro-tag {
    margin-top: 12px; font-family: var(--font-mono); font-size: 11.5px; letter-spacing: .12em;
    text-transform: uppercase; color: var(--text-3); opacity: 0; animation: introUp .45s ease .32s forwards;
  }
  .intro-bar { margin-top: 28px; width: 190px; height: 10px; border-radius: 999px; border: 2px solid var(--line); background: var(--white); overflow: hidden; }
  .intro-bar i { display: block; height: 100%; width: 0; background: var(--sun); animation: introBar 1.25s cubic-bezier(.5,0,.2,1) forwards; }
  @keyframes introBar { to { width: 100%; } }
  @keyframes introUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
`

export default function IntroLoader() {
  const [show, setShow] = useState(() => !sessionStorage.getItem('ion-intro'))
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!show) return
    sessionStorage.setItem('ion-intro', '1')
    document.body.style.overflow = 'hidden'
    const t1 = setTimeout(() => setLeaving(true), 1400)
    const t2 = setTimeout(() => { setShow(false); document.body.style.overflow = '' }, 1900)
    return () => { clearTimeout(t1); clearTimeout(t2); document.body.style.overflow = '' }
  }, [show])

  if (!show) return null

  return (
    <div className={`intro ${leaving ? 'leave' : ''}`} role="status" aria-label="Yuklanmoqda">
      <style>{css}</style>
      <div className="intro-mark"><LogoMark size={92} /></div>
      <div className="intro-brand">ionedu</div>
      <div className="intro-tag">Geografiya olamiga sayohat</div>
      <div className="intro-bar"><i /></div>
    </div>
  )
}
