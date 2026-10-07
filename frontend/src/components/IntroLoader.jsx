import { useState, useEffect } from 'react'

/* Saytga birinchi kirilganda (har sessiyada bir marta) ko'rinadigan
   brendlangan splash-loader. So'ng silliq yo'qoladi va boshqa
   sahifalarda qayta chiqmaydi. */
const css = `
  .intro {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(62% 52% at 50% 42%, var(--green-50), var(--paper) 72%);
    animation: introIn .25s ease;
  }
  .intro.leave { animation: introOut .55s cubic-bezier(.4,0,.2,1) forwards; }
  @keyframes introIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes introOut { to { opacity: 0; visibility: hidden; } }

  .intro::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(14,131,69,.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(14,131,69,.05) 1px, transparent 1px);
    background-size: 34px 34px;
    -webkit-mask-image: radial-gradient(60% 50% at 50% 45%, #000, transparent 75%);
    mask-image: radial-gradient(60% 50% at 50% 45%, #000, transparent 75%);
  }
  .intro-globe {
    position: relative; z-index: 1;
    width: 88px; height: 88px; border-radius: 26px;
    background: linear-gradient(135deg, var(--green-600), var(--green-700));
    color: #fff; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 24px 56px -18px rgba(14,131,69,.6), inset 0 1px 0 rgba(255,255,255,.25);
    animation: introPop .6s cubic-bezier(.2,.8,.3,1.5) both;
  }
  .intro-globe svg { animation: introSpin 4s linear infinite; }
  @keyframes introSpin { to { transform: rotate(360deg); } }
  @keyframes introPop { from { opacity: 0; transform: scale(.55) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

  .intro-brand {
    position: relative; z-index: 1; margin-top: 24px;
    font-family: var(--font-display); font-weight: 800; font-size: 32px; letter-spacing: -0.045em;
    color: var(--text); opacity: 0; animation: introUp .5s ease .18s forwards;
  }
  .intro-brand .ac { color: var(--green-600); }
  .intro-tag {
    position: relative; z-index: 1; margin-top: 8px; font-size: 13.5px; color: var(--text-3);
    opacity: 0; animation: introUp .5s ease .3s forwards;
  }
  .intro-bar {
    position: relative; z-index: 1; margin-top: 28px; width: 184px; height: 4px;
    border-radius: 999px; background: var(--border-2); overflow: hidden;
  }
  .intro-bar i {
    display: block; height: 100%; width: 0;
    background: linear-gradient(90deg, var(--green-600), var(--green-300));
    border-radius: 999px; animation: introBar 1.5s cubic-bezier(.5,0,.2,1) forwards;
  }
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
    const t1 = setTimeout(() => setLeaving(true), 1650)
    const t2 = setTimeout(() => { setShow(false); document.body.style.overflow = '' }, 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); document.body.style.overflow = '' }
  }, [show])

  if (!show) return null

  return (
    <div className={`intro ${leaving ? 'leave' : ''}`} role="status" aria-label="Yuklanmoqda">
      <style>{css}</style>
      <div className="intro-globe">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>
      <div className="intro-brand">Ion<span className="ac">Edu</span></div>
      <div className="intro-tag">Geografiya olamiga xush kelibsiz</div>
      <div className="intro-bar"><i /></div>
    </div>
  )
}
