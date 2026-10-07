import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import {
  GAME_COUNTRIES as COUNTRIES, CONTINENTS, shuffle, pickDistractors, flagUrl, shapeUrl,
} from '../data/countries'

/* ─────────────────────────────────────────────────────────────
   Geografiya ARCADE — viktorina emas, haqiqiy o'yin.

   O'yin mexanikasi:
     • Jonlar (3 ta) — xato yoki vaqt tugashi jon oladi, 0 → Game Over
     • Taymer — har savolga vaqt; qancha tez bo'lsa, shuncha ko'p ball
     • Kombo — ketma-ket to'g'ri javoblar ×5 gacha ko'paytiruvchi beradi
     • Juicy feedback — chaqnash, silkinish, konfetti, ovoz effektlari
     • "3-2-1-GO!" boshlanish, ball/kombo animatsiyalari, natija ekrani

   O'yin turlari (mode):
     flag · shape · clues · location · capital · nature
   ───────────────────────────────────────────────────────────── */

const ROUND = 10
const MAX_LIVES = 3
const BASE = 100        // har to'g'ri javob uchun asosiy ball
const SPEED_MAX = 60    // tezlik bonusi (vaqtga qarab)

const NATURE = [
  { q: 'Yer yuzidagi eng katta okean qaysi?', a: 'Tinch okean', opts: ['Atlantika', 'Tinch okean', 'Hind okeani', 'Shimoliy Muz okeani'] },
  { q: 'Eng katta materik qaysi?', a: 'Yevrosiyo', opts: ['Afrika', 'Yevrosiyo', 'Shimoliy Amerika', 'Antarktida'] },
  { q: 'Dunyodagi eng uzun daryolardan biri — Nil qayerda?', a: 'Afrika', opts: ['Afrika', 'Osiyo', 'Yevropa', 'Janubiy Amerika'] },
  { q: 'Eng baland togʻ choʻqqisi qaysi?', a: 'Everest', opts: ['Everest', 'Elbrus', 'Kilimanjaro', 'Mak-Kinli'] },
  { q: 'Eng katta choʻl qaysi?', a: 'Sahroi Kabir', opts: ['Qoraqum', 'Sahroi Kabir', 'Gobi', 'Atakama'] },
  { q: 'Dunyodagi eng chuqur koʻl qaysi?', a: 'Baykal', opts: ['Kaspiy', 'Baykal', 'Viktoriya', "Issiqko'l"] },
  { q: 'Eng sovuq materik qaysi?', a: 'Antarktida', opts: ['Antarktida', 'Osiyo', 'Yevropa', 'Avstraliya'] },
  { q: 'Eng kichik materik qaysi?', a: 'Avstraliya', opts: ['Avstraliya', 'Yevropa', 'Antarktida', 'Janubiy Amerika'] },
  { q: 'Amazonka daryosi qaysi materikda?', a: 'Janubiy Amerika', opts: ['Janubiy Amerika', 'Afrika', 'Osiyo', 'Shimoliy Amerika'] },
  { q: 'Eng katta yarim orol qaysi?', a: 'Arabiston', opts: ['Arabiston', 'Hindiston', 'Skandinaviya', 'Balkan'] },
  { q: 'Yer yuzidagi eng katta orol qaysi?', a: 'Grenlandiya', opts: ['Grenlandiya', 'Madagaskar', 'Yangi Gvineya', 'Borneo'] },
  { q: 'Ekvator chizigʻi qaysi materikni kesib oʻtmaydi?', a: 'Yevropa', opts: ['Yevropa', 'Afrika', 'Janubiy Amerika', 'Osiyo'] },
  { q: 'Qaysi okean eng kichik?', a: 'Shimoliy Muz okeani', opts: ['Shimoliy Muz okeani', 'Hind okeani', 'Atlantika', 'Tinch okean'] },
  { q: 'Sahroi Kabir qaysi materikda joylashgan?', a: 'Afrika', opts: ['Afrika', 'Osiyo', 'Avstraliya', 'Yevropa'] },
  { q: 'And togʻ tizmasi qaysi materikda?', a: 'Janubiy Amerika', opts: ['Janubiy Amerika', 'Shimoliy Amerika', 'Osiyo', 'Afrika'] },
  { q: 'Volga daryosi qaysi dengizga quyiladi?', a: 'Kaspiy dengizi', opts: ['Kaspiy dengizi', 'Qora dengiz', 'Boltiq dengizi', 'Oq dengiz'] },
  { q: 'Eng katta yomgʻir oʻrmoni qayerda?', a: 'Amazonka', opts: ['Amazonka', 'Kongo', 'Borneo', 'Tayga'] },
  { q: 'Maydoni boʻyicha dunyodagi eng katta koʻl qaysi?', a: 'Kaspiy dengizi', opts: ['Kaspiy dengizi', 'Baykal', 'Viktoriya', 'Yuqori koʻl'] },
  { q: 'Niagara sharsharasi qaysi materikda?', a: 'Shimoliy Amerika', opts: ['Shimoliy Amerika', 'Janubiy Amerika', 'Yevropa', 'Afrika'] },
  { q: 'Qaysi materikda doimiy aholi yashamaydi?', a: 'Antarktida', opts: ['Antarktida', 'Avstraliya', 'Afrika', 'Osiyo'] },
  { q: 'Gimolay togʻlari qaysi materikda?', a: 'Osiyo', opts: ['Osiyo', 'Yevropa', 'Afrika', 'Shimoliy Amerika'] },
  { q: 'Yevropa va Osiyoni ajratuvchi togʻlar qaysi?', a: 'Ural togʻlari', opts: ['Ural togʻlari', 'Alp togʻlari', 'Kavkaz', 'Karpat'] },
  { q: 'Eng baland sharshara — Anxel qaysi materikda?', a: 'Janubiy Amerika', opts: ['Janubiy Amerika', 'Afrika', 'Osiyo', 'Shimoliy Amerika'] },
  { q: 'Yaponiyaning ramzi boʻlgan Fudziyama nima?', a: 'Vulqon togʻ', opts: ['Vulqon togʻ', 'Daryo', 'Koʻl', 'Orol'] },
]

/* Qiyinlik darajasi yorliqlari */
const DIFF_LABEL = { easy: 'Oson', mid: "O'rta", hard: 'Qiyin' }

/* Savol turiga qarab ko'rsatma matni (aralash rejim uchun ham) */
const PROMPTS = {
  flag: "Bu qaysi davlatning bayrog'i?",
  shape: 'Bu davlat siluetini taniysizmi?',
  clues: 'Ipuchlarga qarab davlatni aniqlang.',
  location: 'Bu davlat qaysi qitʼada?',
  capital: 'Poytaxti qaysi shahar?',
  text: '',
}

const GAMES = [
  {
    id: 'flag', mode: 'flag', icon: 'globe', tone: 'flag', diff: 'mid', secs: 12,
    title: "Bayroq bo'yicha davlat",
    desc: "Bayroqni ko'ring va u qaysi davlatga tegishli ekanini toping.",
    prompt: PROMPTS.flag,
    pics: ['jp', 'br', 'ch'],
  },
  {
    id: 'shape', mode: 'shape', icon: 'map', tone: 'shape', diff: 'hard', secs: 12,
    title: "Shakli bo'yicha davlat",
    desc: 'Davlatning xaritadagi siluetiga qarab uni tanib oling.',
    prompt: PROMPTS.shape,
    pics: ['it', 'in', 'jp'],
  },
  {
    id: 'clues', mode: 'clues', icon: 'search', tone: 'clues', diff: 'easy', secs: 18,
    title: "Ma'lumot bo'yicha davlat",
    desc: 'Uchta ipucha beriladi — qaysi davlat haqida gap ketayotganini toping.',
    prompt: PROMPTS.clues,
    pics: ['gb', 'eg', 'ar'],
  },
  {
    id: 'location', mode: 'location', icon: 'mapPin', tone: 'location', diff: 'easy', secs: 12,
    title: 'Davlat qayerda?',
    desc: 'Davlat nomi chiqadi — uni qaysi qitʼada joylashganini toping.',
    prompt: PROMPTS.location,
    pics: ['us', 'au', 'za'],
  },
  {
    id: 'capital', mode: 'capital', icon: 'star', tone: 'capital', diff: 'mid', secs: 12,
    title: 'Poytaxtni top',
    desc: 'Davlat beriladi — uning poytaxtini toʻrt variantdan tanlang.',
    prompt: PROMPTS.capital,
    pics: ['fr', 'tr', 'kr'],
  },
  {
    id: 'nature', mode: 'nature', icon: 'compass', tone: 'nature', diff: 'mid', secs: 15,
    title: 'Tabiat va materiklar',
    desc: 'Okeanlar, materiklar, daryolar va togʻlar boʻyicha bilim sinovi.',
    prompt: '',
    pics: ['ca', 'nz', 'cl'],
  },
  {
    id: 'mixed', mode: 'mixed', icon: 'sparkles', tone: 'mixed', diff: 'hard', secs: 12,
    title: 'Aralash chempionat',
    desc: 'Bayroq, siluet, poytaxt, ipucha — barchasi aralash. Eng katta sinov!',
    prompt: '',
    pics: ['kr', 'de', 'eg'],
  },
]

/* Har bir o'yin nechta savoldan iborat (round) */
function roundSize(game) {
  return game.mode === 'nature' ? Math.min(ROUND, NATURE.length) : ROUND
}

/* Savol turiga qarab vaqt (ms) — o'qish ko'p bo'lsa, ko'proq vaqt */
function durationFor(kind) {
  if (kind === 'clues') return 18000
  if (kind === 'text') return 15000
  return 12000
}

/* Bitta davlat + rejim uchun bitta savol quradi */
function buildQuestion(mode, country) {
  if (mode === 'location') {
    const distract = shuffle(CONTINENTS.filter(c => c !== country.continent)).slice(0, 3)
    return {
      kind: 'location', country,
      options: shuffle([country.continent, ...distract]),
      answer: country.continent,
      info: `${country.name} — ${country.continent}. Poytaxti: ${country.capital}.`,
    }
  }
  if (mode === 'capital') {
    const ds = pickDistractors(country, COUNTRIES, 3).map(c => c.capital)
    return {
      kind: 'capital', country,
      options: shuffle([country.capital, ...ds]),
      answer: country.capital,
      info: `${country.name} poytaxti — ${country.capital}.`,
    }
  }
  // flag / shape / clues — javob davlat nomi
  const ds = pickDistractors(country, COUNTRIES, 3).map(c => c.name)
  return {
    kind: mode, country,
    options: shuffle([country.name, ...ds]),
    answer: country.name,
    info: `${country.name} · ${country.continent} · poytaxti ${country.capital}.`,
  }
}

function natureQuestion(it) {
  return { kind: 'text', q: it.q, options: shuffle(it.opts), answer: it.a, info: '', prompt: '' }
}

/* Bitta o'yin uchun savollar to'plamini quradi */
function buildRound(game) {
  const n = roundSize(game)

  if (game.mode === 'nature') {
    return shuffle(NATURE).slice(0, n).map(natureQuestion)
  }

  if (game.mode === 'mixed') {
    const visModes = ['flag', 'shape', 'clues', 'location', 'capital']
    const countries = shuffle(COUNTRIES).slice(0, n)
    const nat = shuffle(NATURE)
    let ni = 0
    return countries.map((country, i) => {
      // har 5-savolda tabiat savoli aralashtiriladi
      if (i % 5 === 4 && ni < nat.length) return natureQuestion(nat[ni++])
      const mode = visModes[Math.floor(Math.random() * visModes.length)]
      const q = buildQuestion(mode, country)
      q.prompt = PROMPTS[q.kind]
      return q
    })
  }

  return shuffle(COUNTRIES).slice(0, n).map(c => buildQuestion(game.mode, c))
}

/* ─────────────────────────────────────────────────────────────
   Ovoz effektlari (Web Audio API — fayl talab qilmaydi)
   ───────────────────────────────────────────────────────────── */
function useSound() {
  const ctxRef = useRef(null)
  const [muted, setMuted] = useState(() => localStorage.getItem('gm-muted') === '1')
  const mutedRef = useRef(muted)
  useEffect(() => {
    mutedRef.current = muted
    localStorage.setItem('gm-muted', muted ? '1' : '0')
  }, [muted])

  const ctx = () => {
    if (mutedRef.current) return null
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
      return ctxRef.current
    } catch { return null }
  }

  const tone = (freq, dur, type = 'sine', when = 0, vol = 0.18) => {
    const c = ctx(); if (!c) return
    const t = c.currentTime + when
    const osc = c.createOscillator(); const g = c.createGain()
    osc.type = type; osc.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g); g.connect(c.destination)
    osc.start(t); osc.stop(t + dur + 0.02)
  }

  return useMemo(() => ({
    get muted() { return mutedRef.current },
    toggle: () => setMuted(m => !m),
    isMuted: muted,
    click: () => tone(440, 0.06, 'sine', 0, 0.08),
    correct: () => { tone(659, 0.12, 'triangle', 0, 0.16); tone(880, 0.18, 'triangle', 0.09, 0.16) },
    wrong: () => { tone(180, 0.3, 'sawtooth', 0, 0.14); tone(110, 0.34, 'sawtooth', 0.04, 0.1) },
    tick: () => tone(1100, 0.04, 'square', 0, 0.04),
    go: () => tone(740, 0.2, 'triangle', 0, 0.16),
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.26, 'triangle', i * 0.11, 0.16)),
    over: () => [392, 311, 233, 175].forEach((f, i) => tone(f, 0.32, 'sine', i * 0.14, 0.15)),
  }), [muted]) // eslint-disable-line react-hooks/exhaustive-deps
}

/* Ball hisoblagichini silliq "o'sib boruvchi" qiladi */
function useCountUp(value, dur = 550) {
  const [disp, setDisp] = useState(value)
  const fromRef = useRef(value)
  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    let raf
    const tick = now => {
      const t = Math.min(1, (now - start) / dur)
      const e = 1 - Math.pow(1 - t, 3)
      setDisp(Math.round(from + (value - from) * e))
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, dur])
  return disp
}

const css = `
  /* ════ LOBBY ═════════════════════════════════════════ */
  .gm-wrap { position: relative; }
  .gm-aurora {
    position: absolute; inset: -40px -24px auto -24px; height: 360px; z-index: 0;
    background:
      radial-gradient(60% 80% at 18% 0%, rgba(14,131,69,.16), transparent 60%),
      radial-gradient(50% 70% at 82% 10%, rgba(37,99,235,.14), transparent 60%),
      radial-gradient(40% 60% at 55% 30%, rgba(180,83,9,.10), transparent 60%);
    filter: blur(8px); pointer-events: none;
    animation: gm-drift 14s ease-in-out infinite alternate;
  }
  @keyframes gm-drift { from { transform: translateY(-6px) scale(1); } to { transform: translateY(10px) scale(1.04); } }
  .gm-hero { position: relative; z-index: 1; padding: 10px 0 22px; }
  .gm-hero-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .gm-kicker {
    display: inline-flex; align-items: center; gap: 8px; color: var(--green-700);
    font-weight: 600; font-size: 12.5px; font-family: var(--font-mono);
    text-transform: uppercase; letter-spacing: .1em;
    background: var(--green-50); padding: 5px 11px; border-radius: 999px;
    box-shadow: inset 0 0 0 1px var(--green-100);
  }
  .gm-globe { display: inline-flex; animation: gm-spin 9s linear infinite; }
  @keyframes gm-spin { to { transform: rotate(360deg); } }

  .gm-rules { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; position: relative; z-index: 1; }
  .gm-rule {
    display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 550;
    padding: 6px 12px; border-radius: 999px; background: var(--white);
    border: 1px solid var(--border); color: var(--text-2);
  }
  .gm-rule .ic { display: inline-flex; }
  .gm-rule.r-life .ic { color: #ef4444; }
  .gm-rule.r-time .ic { color: var(--green-600); }
  .gm-rule.r-combo .ic { color: var(--amber-600); }

  /* ════ O'yin poster kartalari ════════════════════════ */
  .gm-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; position: relative; z-index: 1; margin-top: 24px; }
  @media (max-width: 900px) { .gm-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .gm-grid { grid-template-columns: 1fr; } }
  .gm-card {
    position: relative; overflow: hidden; text-align: left; cursor: pointer; padding: 0; min-height: 388px;
    border: 1px solid var(--border); border-radius: 20px; background: var(--white);
    display: flex; flex-direction: column;
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  }
  .gm-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-hover); border-color: var(--green-300); }

  /* poster muqovasi */
  .gm-cover { height: 184px; position: relative; overflow: hidden; flex-shrink: 0; }
  .gm-collage { position: absolute; inset: 0; z-index: 0; display: flex; align-items: center; justify-content: center; }
  .gm-collage .pic {
    position: absolute; width: 104px; height: 70px; object-fit: cover; border-radius: 10px;
    box-shadow: 0 12px 26px -8px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.18);
    transition: transform .3s ease;
  }
  .gm-collage .p0 { left: 7%;  top: 46px; transform: rotate(-13deg); }
  .gm-collage .p1 { left: 50%; top: 22px; transform: translateX(-50%) rotate(5deg); z-index: 1; }
  .gm-collage .p2 { right: 7%; top: 52px; transform: rotate(12deg); }
  .gm-card:hover .gm-collage .p0 { transform: rotate(-17deg) translateY(-4px) scale(1.05); }
  .gm-card:hover .gm-collage .p1 { transform: translateX(-50%) rotate(7deg) translateY(-5px) scale(1.06); }
  .gm-card:hover .gm-collage .p2 { transform: rotate(16deg) translateY(-4px) scale(1.05); }
  .gm-collage.silh .pic {
    width: 92px; height: 66px; object-fit: contain; border-radius: 0; box-shadow: none;
    filter: invert(1) drop-shadow(0 4px 10px rgba(0,0,0,.45)); opacity: .92;
  }
  .gm-cover::before { content: ''; position: absolute; inset: 0; z-index: 2; background: var(--veil); opacity: .66; }
  .gm-cover::after {
    content: ''; position: absolute; inset: 0; z-index: 2;
    background:
      radial-gradient(120% 120% at 50% -20%, rgba(255,255,255,.3), transparent 50%),
      linear-gradient(180deg, transparent 45%, rgba(8,12,10,.5));
  }
  .gm-card:hover .gm-cover::after { background:
      radial-gradient(120% 120% at 50% -20%, rgba(255,255,255,.4), transparent 55%),
      linear-gradient(180deg, transparent 42%, rgba(8,12,10,.5)); }

  .gm-card-ico {
    position: absolute; z-index: 3; left: 16px; bottom: 14px;
    width: 56px; height: 56px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,.22); color: #fff;
    backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.45), 0 10px 22px -8px rgba(0,0,0,.55);
    transition: transform .25s ease;
  }
  .gm-card:hover .gm-card-ico { animation: gm-wob .6s ease; }
  @keyframes gm-wob { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-8deg) scale(1.08); } 75% { transform: rotate(8deg) scale(1.08); } }

  /* qiyinlik chipi + rekord */
  .gm-diff {
    position: absolute; top: 12px; left: 12px; z-index: 3;
    display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700;
    padding: 4px 10px; border-radius: 999px; color: #fff;
    background: rgba(0,0,0,.34); backdrop-filter: blur(5px);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.28);
  }
  .gm-diff .dot { width: 7px; height: 7px; border-radius: 999px; }
  .gm-diff.easy .dot { background: #4ade80; }
  .gm-diff.mid  .dot { background: #fbbf24; }
  .gm-diff.hard .dot { background: #f87171; }
  .gm-best {
    position: absolute; top: 12px; right: 12px; z-index: 3;
    display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700;
    font-family: var(--font-mono); color: #fff; padding: 4px 9px; border-radius: 999px;
    background: rgba(0,0,0,.34); backdrop-filter: blur(5px);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.28);
  }
  .gm-best svg { color: #fcd34d; }

  /* poster tanasi */
  .gm-card-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .gm-card-title { font-family: var(--font-display); font-weight: 720; font-size: 18px; letter-spacing: -.015em; }
  .gm-card-desc { font-size: 13px; color: var(--text-3); line-height: 1.5; }
  .gm-card-stats { display: flex; align-items: center; gap: 16px; margin-top: 2px; font-size: 12.5px; color: var(--text-3); }
  .gm-card-stats span { display: inline-flex; align-items: center; gap: 5px; }
  .gm-play-btn {
    margin-top: auto; height: 46px; border-radius: 13px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-weight: 680; font-size: 14.5px; color: var(--text);
    background: var(--bg-soft); border: 1px solid var(--border);
    transition: background .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease;
  }
  .gm-card:hover .gm-play-btn {
    background: linear-gradient(135deg, var(--green-600), var(--green-700)); color: #fff;
    border-color: transparent; box-shadow: 0 14px 28px -14px rgba(14,131,69,.65);
  }

  .top-flag     { --veil: linear-gradient(135deg, rgba(14,131,69,.92), rgba(11,105,55,.78)); background: linear-gradient(135deg, #0e8345, #0b6937); }
  .top-shape    { --veil: linear-gradient(135deg, rgba(22,50,77,.82), rgba(15,118,110,.62)); background: linear-gradient(135deg, #16324d, #0b1f30); }
  .top-clues    { --veil: linear-gradient(135deg, rgba(109,40,217,.9), rgba(147,51,234,.78)); background: linear-gradient(135deg, #6d28d9, #9333ea); }
  .top-location { --veil: linear-gradient(135deg, rgba(37,99,235,.9), rgba(14,165,233,.78)); background: linear-gradient(135deg, #2563eb, #0ea5e9); }
  .top-capital  { --veil: linear-gradient(135deg, rgba(180,83,9,.9), rgba(217,119,6,.78)); background: linear-gradient(135deg, #b45309, #d97706); }
  .top-nature   { --veil: linear-gradient(135deg, rgba(14,131,69,.9), rgba(21,128,61,.78)); background: linear-gradient(135deg, #0e8345, #15803d); }
  .top-mixed    { --veil: linear-gradient(120deg, rgba(14,131,69,.85), rgba(37,99,235,.78) 50%, rgba(147,51,234,.82)); background: linear-gradient(120deg, #0e8345, #2563eb 50%, #9333ea); }

  /* ════ GAME SCREEN (yorug', keng) ════════════════════ */
  .gm-screen {
    position: relative; overflow: hidden; isolation: isolate;
    max-width: 880px; margin: 0 auto; padding: 20px 26px 24px; color: var(--text);
    border-radius: 24px; background: var(--white);
    background-image:
      radial-gradient(110% 70% at 50% -10%, var(--green-50), transparent 60%),
      radial-gradient(80% 50% at 100% 0%, rgba(37,99,235,.06), transparent 60%);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-pop);
    animation: gm-screen-in .45s cubic-bezier(.21,.7,.25,1) both;
  }
  @keyframes gm-screen-in { from { opacity: 0; transform: translateY(18px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  .gm-screen::before {
    content: ''; position: absolute; inset: 0; z-index: -1; opacity: .6;
    background-image:
      linear-gradient(rgba(12,17,14,.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(12,17,14,.028) 1px, transparent 1px);
    background-size: 30px 30px;
    -webkit-mask-image: radial-gradient(120% 80% at 50% 0%, #000 25%, transparent 78%);
    mask-image: radial-gradient(120% 80% at 50% 0%, #000 25%, transparent 78%);
  }
  .gm-screen.shake { animation: gm-shake .42s ease; }
  @keyframes gm-shake {
    0%,100% { transform: translateX(0); }
    15% { transform: translateX(-9px) rotate(-.3deg); }
    30% { transform: translateX(8px) rotate(.3deg); }
    45% { transform: translateX(-5px); } 60% { transform: translateX(4px); } 78% { transform: translateX(-2px); }
  }

  /* HUD */
  .gm-hud { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .gm-hud-side { display: flex; align-items: center; gap: 8px; }
  .hud-btn {
    width: 36px; height: 36px; border-radius: 11px; display: inline-flex; align-items: center; justify-content: center;
    color: var(--text-3); background: var(--bg-soft); border: 1px solid var(--border); transition: .15s;
  }
  .hud-btn:hover { background: var(--white); color: var(--text); border-color: #CFD3CE; }
  .gm-hearts { display: flex; gap: 5px; }
  .gm-heart { color: #ef4444; filter: drop-shadow(0 2px 5px rgba(239,68,68,.3)); transition: transform .3s, opacity .3s, filter .3s; }
  .gm-heart.off { color: var(--border); filter: none; transform: scale(.82); opacity: .85; }
  .gm-heart.lost { animation: gm-heartbreak .55s ease forwards; }
  @keyframes gm-heartbreak { 0% { transform: scale(1.35); color: #ef4444; } 35% { transform: scale(.55) rotate(-14deg); } 100% { transform: scale(.82) rotate(0); color: var(--border); } }

  /* taymer ring */
  .gm-timer { position: relative; width: 50px; height: 50px; display: inline-flex; align-items: center; justify-content: center; }
  .gm-timer.danger { animation: gm-tpulse .7s ease-in-out infinite; }
  @keyframes gm-tpulse { 50% { transform: scale(1.1); } }
  .gm-timer-n { position: absolute; font-family: var(--font-mono); font-weight: 700; font-size: 16px; }

  /* ball + kombo qatori */
  .gm-subhud { display: flex; align-items: flex-end; justify-content: space-between; margin: 14px 2px 12px; }
  .gm-score { font-family: var(--font-mono); font-weight: 800; font-size: 30px; line-height: 1; letter-spacing: -.04em; color: var(--text); }
  .gm-score small { display: block; font-size: 9.5px; letter-spacing: .2em; color: var(--text-4); font-weight: 600; margin-bottom: 3px; }
  .gm-combo {
    display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px;
    font-weight: 800; font-size: 14px; font-family: var(--font-mono); color: var(--amber-600);
    background: var(--amber-50); border: 1px solid #F2E0C4; box-shadow: 0 4px 14px -6px rgba(180,83,9,.3);
    animation: gm-combo-in .3s ease;
  }
  @keyframes gm-combo-in { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .gm-combo small { font-size: 9.5px; letter-spacing: .12em; color: #C98A3A; font-weight: 600; }
  .gm-combo .fl { display: inline-flex; animation: gm-flick .5s ease-in-out infinite alternate; }
  @keyframes gm-flick { from { transform: scale(1) rotate(-5deg); } to { transform: scale(1.2) rotate(5deg); } }

  /* progres pipslari */
  .gm-pips { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; margin-bottom: 14px; }
  .gm-pip { width: 16px; height: 5px; border-radius: 999px; background: var(--border-2); transition: .3s; box-shadow: inset 0 0 0 1px var(--border); }
  .gm-pip.ok { background: linear-gradient(90deg, var(--green-300), var(--green-600)); box-shadow: 0 0 8px rgba(14,131,69,.3); }
  .gm-pip.no { background: linear-gradient(90deg, #f87171, var(--red-600)); box-shadow: 0 0 8px rgba(197,48,48,.25); }
  .gm-pip.cur { background: var(--text-4); animation: gm-pip-pulse 1s ease-in-out infinite; }
  @keyframes gm-pip-pulse { 50% { opacity: .35; } }

  /* savol bloki — har savolda sirpanib kiradi */
  .gm-q { animation: gm-qin .42s cubic-bezier(.21,.7,.25,1) both; }
  @keyframes gm-qin { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
  .gm-prompt { text-align: center; font-size: 15px; color: var(--text-2); font-weight: 500; margin-bottom: 14px; }

  /* o'yin tanasi: media (chap) + javoblar (o'ng) — keng ekranda yonma-yon */
  .gm-body { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
  @media (max-width: 680px) { .gm-body { grid-template-columns: 1fr; gap: 14px; } }

  /* media panellari */
  .gm-media { border-radius: 16px; overflow: hidden; position: relative; }
  .gm-flagwrap {
    background: var(--bg-soft); border: 1px solid var(--border); padding: 20px;
    display: flex; align-items: center; justify-content: center; min-height: 180px;
  }
  .gm-flag {
    width: 100%; max-width: 280px; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; background: #fff;
    box-shadow: 0 16px 34px -16px rgba(12,17,14,.4), 0 0 0 1px rgba(12,17,14,.08);
    animation: gm-pop .38s ease;
  }
  .gm-shapewrap {
    background: var(--bg-soft); border: 1px solid var(--border);
    padding: 18px; display: flex; align-items: center; justify-content: center; min-height: 180px;
  }
  .gm-shape { max-height: 150px; max-width: 80%; filter: drop-shadow(0 8px 16px rgba(12,17,14,.22)); animation: gm-pop .42s ease; }
  .gm-namecard {
    background: linear-gradient(135deg, var(--green-50), var(--bg-soft));
    border: 1px solid var(--green-100); padding: 24px; text-align: center;
    display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 180px;
  }
  .gm-namecard .flagchip {
    width: 64px; height: 44px; object-fit: cover; border-radius: 8px; margin: 0 auto 12px; display: block;
    box-shadow: 0 8px 18px -8px rgba(12,17,14,.4), 0 0 0 1px rgba(12,17,14,.08);
  }
  .gm-bigname { font-family: var(--font-display); font-weight: 800; font-size: 28px; letter-spacing: -.02em; color: var(--text); }
  .gm-clues { background: var(--bg-soft); border: 1px solid var(--border); padding: 16px 18px; }
  .gm-clue {
    display: flex; align-items: flex-start; gap: 11px; padding: 10px 0;
    border-bottom: 1px dashed var(--border); font-size: 14.5px; color: var(--text-2); animation: gm-slide .4s ease both;
  }
  .gm-clue:last-child { border-bottom: 0; }
  .gm-clue:nth-child(2) { animation-delay: .12s; } .gm-clue:nth-child(3) { animation-delay: .24s; }
  .gm-clue .n {
    width: 23px; height: 23px; flex-shrink: 0; border-radius: 999px; font-size: 12px; font-weight: 700;
    background: var(--green-600); color: #fff; display: flex; align-items: center; justify-content: center;
  }
  .gm-textq {
    background: var(--bg-soft); border: 1px solid var(--border); border-radius: 16px;
    padding: 24px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 180px;
  }
  .gm-textq .qt { font-size: 20px; font-weight: 650; margin-top: 8px; color: var(--text); line-height: 1.35; }

  /* skeleton */
  .gm-skel { width: 100%; max-width: 280px; aspect-ratio: 4/3; border-radius: 12px;
    background: linear-gradient(90deg, var(--border-2) 25%, var(--bg-soft) 37%, var(--border-2) 63%);
    background-size: 400% 100%; animation: gm-shimmer 1.3s ease infinite; }
  @keyframes gm-shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }

  /* javob variantlari */
  .gm-opts { display: flex; flex-direction: column; gap: 10px; }
  .gm-opt {
    display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
    padding: 14px 15px; border-radius: 13px; font-size: 15px; font-weight: 550;
    border: 1px solid var(--border); background: var(--white); color: var(--text); cursor: pointer;
    transition: background .12s, border-color .12s, transform .1s, box-shadow .12s; animation: gm-slide .3s ease both;
  }
  .gm-opt:nth-child(2) { animation-delay: .05s; } .gm-opt:nth-child(3) { animation-delay: .1s; } .gm-opt:nth-child(4) { animation-delay: .15s; }
  .gm-opt:hover:not(:disabled) { background: var(--bg-soft); border-color: var(--green-300); transform: translateY(-2px); box-shadow: var(--shadow-soft); }
  .gm-opt:disabled { cursor: default; }
  .gm-mk {
    width: 30px; height: 30px; border-radius: 999px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--border); background: var(--bg-soft); color: var(--text-3);
    font-family: var(--font-mono); font-size: 13px; font-weight: 600; transition: .15s;
  }
  .gm-opt.correct {
    background: var(--green-50); border-color: var(--green-600); color: var(--green-800);
    box-shadow: 0 0 0 1px var(--green-600), 0 10px 26px -12px rgba(14,131,69,.5); animation: gm-correct .5s ease;
  }
  .gm-opt.correct .gm-mk { background: var(--green-600); border-color: var(--green-600); color: #fff; }
  .gm-opt.wrong {
    background: var(--red-50); border-color: var(--red-600); color: var(--red-600); animation: gm-wobble .42s ease;
  }
  .gm-opt.wrong .gm-mk { background: var(--red-600); border-color: var(--red-600); color: #fff; }
  .gm-opt.dim { opacity: .45; }
  @keyframes gm-correct { 0% { transform: scale(1); } 35% { transform: scale(1.035); } 100% { transform: scale(1); } }
  @keyframes gm-wobble { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }

  /* ma'lumot izohi */
  .gm-info {
    margin-top: 12px; padding: 11px 13px; border-radius: 12px; font-size: 13.5px; line-height: 1.5;
    background: var(--blue-50); border: 1px solid #DFE9F8; color: var(--text-2);
    display: flex; gap: 9px; align-items: flex-start; animation: gm-slide .3s ease;
  }

  /* keyingi tugma */
  .gm-next {
    width: 100%; margin-top: 14px; height: 50px; border-radius: 14px; font-weight: 700; font-size: 15px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: linear-gradient(135deg, var(--green-600), var(--green-700)); color: #fff;
    box-shadow: 0 14px 30px -14px rgba(14,131,69,.6); transition: filter .15s, transform .12s; animation: gm-slide .3s ease both;
  }
  .gm-next:hover { filter: brightness(1.06); transform: translateY(-2px); }
  .gm-next:active { transform: translateY(0) scale(.99); }

  /* ball "uchib chiqadigan" popup */
  .gm-gain {
    position: absolute; top: 62px; left: 26px; z-index: 8; pointer-events: none;
    font-family: var(--font-mono); font-weight: 800; font-size: 24px; color: var(--green-600);
    text-shadow: 0 2px 10px rgba(14,131,69,.25); animation: gm-gainup 1s ease forwards;
  }
  .gm-gain .mx { font-size: 14px; color: var(--amber-600); margin-left: 4px; }
  @keyframes gm-gainup { 0% { opacity: 0; transform: translateY(12px) scale(.8); } 20% { opacity: 1; transform: translateY(0) scale(1.15); } 38% { transform: scale(1); } 100% { opacity: 0; transform: translateY(-38px); } }

  /* chaqnash pardasi */
  .gm-flash { position: absolute; inset: 0; z-index: 5; pointer-events: none; border-radius: 24px; opacity: 0; }
  .gm-flash.good { background: radial-gradient(circle at 50% 55%, rgba(14,131,69,.16), transparent 65%); animation: gm-flashk .55s ease; }
  .gm-flash.bad { background: radial-gradient(circle at 50% 55%, rgba(197,48,48,.18), transparent 65%); animation: gm-flashk .55s ease; }
  @keyframes gm-flashk { 0% { opacity: 0; } 22% { opacity: 1; } 100% { opacity: 0; } }

  /* "3-2-1-GO!" boshlanish */
  .gm-count {
    position: absolute; inset: 0; z-index: 20; display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: rgba(252,252,251,.86); backdrop-filter: blur(4px); border-radius: 24px;
  }
  .gm-count .lbl { font-family: var(--font-mono); font-size: 12px; letter-spacing: .2em; text-transform: uppercase; color: var(--text-3); margin-bottom: 10px; }
  .gm-count b { font-family: var(--font-display); font-weight: 800; font-size: 88px; color: var(--text); text-shadow: 0 8px 30px rgba(14,131,69,.18); animation: gm-countpop .72s ease; }
  .gm-count b.go { color: var(--green-600); }
  @keyframes gm-countpop { 0% { opacity: 0; transform: scale(2.3); } 30% { opacity: 1; transform: scale(1); } 80% { opacity: 1; } 100% { opacity: 0; transform: scale(.7); } }

  /* natija ekrani konfetti */
  .gm-confetti { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 2; }
  .gm-confetti i { position: absolute; top: -14px; width: 9px; height: 15px; border-radius: 2px; opacity: .95; animation: gm-fall linear forwards; }
  @keyframes gm-fall { to { transform: translateY(560px) rotate(620deg); opacity: 0; } }

  /* natija ekrani ichi */
  .gm-res { position: relative; z-index: 3; text-align: center; padding: 12px 6px 4px; max-width: 460px; margin: 0 auto; }
  .gm-res-badge {
    width: 76px; height: 76px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center;
    margin-bottom: 12px; animation: gm-badgepop .5s cubic-bezier(.2,.8,.3,1.4) both;
  }
  @keyframes gm-badgepop { from { transform: scale(0) rotate(-25deg); } to { transform: scale(1) rotate(0); } }
  .gm-res-badge.win { background: var(--amber-50); color: var(--amber-600); box-shadow: inset 0 0 0 1px #F2E0C4, 0 12px 30px -12px rgba(180,83,9,.4); }
  .gm-res-badge.over { background: var(--red-50); color: var(--red-600); box-shadow: inset 0 0 0 1px #F2DDDA, 0 12px 30px -12px rgba(197,48,48,.4); }
  .gm-res-title { font-family: var(--font-display); font-weight: 800; font-size: 26px; letter-spacing: -.02em; color: var(--text); }
  .gm-res-score { font-family: var(--font-mono); font-weight: 800; font-size: 50px; letter-spacing: -.05em; color: var(--text); line-height: 1.05; margin-top: 10px; }
  .gm-res-msg { font-size: 15px; color: var(--text-3); margin-top: 8px; }
  .gm-newrec {
    display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; padding: 5px 12px; border-radius: 999px;
    font-size: 12.5px; font-weight: 700; color: var(--amber-600); background: var(--amber-50); border: 1px solid #F2E0C4;
    animation: gm-flick .6s ease-in-out infinite alternate;
  }
  .gm-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }
  .gm-stat { background: var(--bg-soft); border: 1px solid var(--border); border-radius: 14px; padding: 14px 8px; }
  .gm-stat .v { font-family: var(--font-mono); font-weight: 700; font-size: 22px; color: var(--text); line-height: 1; }
  .gm-stat .l { font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--text-4); margin-top: 6px; }
  .gm-res-actions { display: flex; gap: 10px; }
  .gm-btn-ghost {
    flex: 1; height: 48px; border-radius: 14px; font-weight: 650; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    background: var(--white); border: 1px solid var(--border); color: var(--text); transition: .15s; box-shadow: 0 1px 2px rgba(12,17,14,.04);
  }
  .gm-btn-ghost:hover { background: var(--bg-soft); border-color: #CFD3CE; }

  @keyframes gm-pop { from { transform: scale(.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes gm-slide { from { transform: translateY(7px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  @media (prefers-reduced-motion: reduce) {
    .gm-screen, .gm-aurora, .gm-globe, .gm-q, .gm-opt, .gm-next,
    .gm-combo, .gm-gain, .gm-flash, .gm-count b, .gm-res-badge { animation: none !important; }
  }
`

export default function Games() {
  const [active, setActive] = useState(null)
  const sound = useSound()

  // lobbiga qaytganda rekordlarni qayta o'qish
  const bests = useMemo(
    () => Object.fromEntries(GAMES.map(g => [g.id, Number(localStorage.getItem(`gm-best-${g.id}`) || 0)])),
    [active],
  )

  return (
    <Layout>
      <style>{css}</style>
      <div className="gm-wrap">
        <div className="gm-aurora" />
        <div className="container" style={{ padding: '32px 24px 80px' }}>
          {!active ? (
            <>
              <div className="gm-hero">
                <div className="gm-hero-top">
                  <span className="gm-kicker">
                    <span className="gm-globe"><Icon name="globe" size={14} /></span> Geografiya arcade
                  </span>
                  <button className="hud-btn"
                    onClick={sound.toggle} title={sound.isMuted ? 'Ovozni yoqish' : "Ovozni o'chirish"}>
                    <Icon name={sound.isMuted ? 'volumeOff' : 'volume'} size={17} />
                  </button>
                </div>
                <h1 style={{ fontSize: 34, marginTop: 14, letterSpacing: '-0.02em' }}>
                  Dunyoni o'ynab zabt eting 🌍
                </h1>
                <p className="text-muted" style={{ marginTop: 8, maxWidth: 580, fontSize: 15.5 }}>
                  Jonlaringizni asrang, taymer tugashidan oldin javob bering va ketma-ket
                  to'g'ri javoblar bilan komboni oshiring. Bu shunchaki test emas — bu o'yin.
                </p>

                <div className="gm-rules">
                  <span className="gm-rule r-life"><span className="ic"><Icon name="heart" size={14} fill /></span> {MAX_LIVES} ta jon</span>
                  <span className="gm-rule r-time"><span className="ic"><Icon name="timer" size={14} /></span> Tezlik bonusi</span>
                  <span className="gm-rule r-combo"><span className="ic"><Icon name="flame" size={14} /></span> Kombo ×5 gacha</span>
                </div>
              </div>

              <div className="gm-grid">
                {GAMES.map((g, i) => (
                  <button
                    key={g.id}
                    className="gm-card fade-up"
                    style={{ animationDelay: `${i * 55}ms` }}
                    onClick={() => { sound.click(); setActive(g) }}
                  >
                    <div className={`gm-cover top-${g.tone}`}>
                      <div className={`gm-collage${g.mode === 'shape' ? ' silh' : ''}`}>
                        {g.pics.map((code, p) => (
                          <img
                            key={code} className={`pic p${p}`} alt="" loading="lazy"
                            src={g.mode === 'shape' ? shapeUrl(code) : flagUrl(code)}
                            onError={e => { e.currentTarget.style.display = 'none' }}
                          />
                        ))}
                      </div>
                      <span className={`gm-diff ${g.diff}`}>
                        <span className="dot" /> {DIFF_LABEL[g.diff]}
                      </span>
                      {bests[g.id] > 0 && (
                        <span className="gm-best"><Icon name="trophy" size={11} /> {bests[g.id]}</span>
                      )}
                      <span className="gm-card-ico"><Icon name={g.icon} size={28} /></span>
                    </div>
                    <div className="gm-card-body">
                      <div className="gm-card-title">{g.title}</div>
                      <div className="gm-card-desc">{g.desc}</div>
                      <div className="gm-card-stats">
                        <span><Icon name="list" size={14} /> {roundSize(g)} savol</span>
                        <span><Icon name="timer" size={14} /> {g.secs}s</span>
                        <span><Icon name="heart" size={14} fill /> {MAX_LIVES} jon</span>
                      </div>
                      <div className="gm-play-btn"><Icon name="play" size={16} fill /> O'ynash</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Engine game={active} sound={sound} onExit={() => setActive(null)} />
          )}
        </div>
      </div>
    </Layout>
  )
}

/* ═══════════════════════════════════════════════════════════
   O'yin dvigateli — jonlar, taymer, kombo, ball, effektlar
   ═══════════════════════════════════════════════════════════ */
function Engine({ game, sound, onExit }) {
  const [questions, setQuestions] = useState(() => buildRound(game))
  const N = questions.length

  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [history, setHistory] = useState([])      // [true,false,...]
  const [status, setStatus] = useState('playing') // playing | done | over

  // boshlanish countdown
  const [count, setCount] = useState(3)
  const [started, setStarted] = useState(false)

  // effekt holatlari
  const [flash, setFlash] = useState(null)        // good | bad | null
  const [shake, setShake] = useState(false)
  const [gain, setGain] = useState(null)          // {amount, mult, id}
  const [lostTick, setLostTick] = useState(0)

  const question = questions[idx]
  const duration = durationFor(question.kind)
  const [timeLeft, setTimeLeft] = useState(duration)

  const revealedRef = useRef(false)
  const timeLeftRef = useRef(duration)
  const durRef = useRef(duration)
  const lastSecRef = useRef(null)

  const bestKey = `gm-best-${game.id}`
  const [record, setRecord] = useState(() => Number(localStorage.getItem(bestKey) || 0))

  const multiplier = Math.min(1 + Math.floor(streak / 2), 5)
  const displayScore = useCountUp(score)

  // bestStreak'ni kuzatib borish
  useEffect(() => { setBestStreak(b => Math.max(b, streak)) }, [streak])

  // javobni yakunlash (klik yoki vaqt tugashi)
  const settle = useCallback(opt => {
    if (revealedRef.current) return
    revealedRef.current = true
    setRevealed(true)
    setPicked(opt)
    const correct = opt !== null && opt === question.answer
    setHistory(h => [...h, correct])

    if (correct) {
      const frac = Math.max(0, Math.min(1, timeLeftRef.current / durRef.current))
      const speed = Math.round(frac * SPEED_MAX)
      const mult = Math.min(1 + Math.floor(streak / 2), 5)
      const gained = (BASE + speed) * mult
      setScore(s => s + gained)
      setGain({ amount: gained, mult, id: Date.now() })
      setStreak(s => s + 1)
      setFlash('good')
      sound.correct()
    } else {
      setStreak(0)
      setLives(l => l - 1)
      setLostTick(Date.now())
      setFlash('bad')
      setShake(true)
      sound.wrong()
    }
  }, [question, streak, sound])

  // boshlanish countdown: 3 → 2 → 1 → GO! → o'yin
  useEffect(() => {
    if (started) return
    if (count <= 0) {
      sound.go()
      const id = setTimeout(() => setStarted(true), 520)
      return () => clearTimeout(id)
    }
    sound.tick()
    const id = setTimeout(() => setCount(c => c - 1), 760)
    return () => clearTimeout(id)
  }, [count, started, sound])

  // taymer — har savolda ishga tushadi
  useEffect(() => {
    if (!started || revealed || status !== 'playing') return
    durRef.current = duration
    timeLeftRef.current = duration
    lastSecRef.current = null
    setTimeLeft(duration)
    const start = performance.now()
    const id = setInterval(() => {
      const remaining = Math.max(0, duration - (performance.now() - start))
      timeLeftRef.current = remaining
      setTimeLeft(remaining)
      const sec = Math.ceil(remaining / 1000)
      if (remaining <= 3500 && remaining > 0 && sec !== lastSecRef.current) {
        lastSecRef.current = sec
        sound.tick()
      }
      if (remaining <= 0) {
        clearInterval(id)
        settle(null)
      }
    }, 100)
    return () => clearInterval(id)
  }, [idx, started, revealed, status, duration, settle, sound])

  // effektlarni avtomatik tozalash
  useEffect(() => { if (!flash) return; const t = setTimeout(() => setFlash(null), 560); return () => clearTimeout(t) }, [flash])
  useEffect(() => { if (!shake) return; const t = setTimeout(() => setShake(false), 440); return () => clearTimeout(t) }, [shake])
  useEffect(() => { if (!gain) return; const t = setTimeout(() => setGain(null), 1000); return () => clearTimeout(t) }, [gain])

  // javob berilgach — natijani ko'rsatib, avtomatik keyingi savolga o'tish
  useEffect(() => {
    if (!revealed || status !== 'playing') return
    const wasCorrect = picked !== null && picked === question.answer
    const t = setTimeout(() => next(), wasCorrect ? 950 : 1650)
    return () => clearTimeout(t)
  }, [revealed]) // eslint-disable-line react-hooks/exhaustive-deps

  function finish(result) {
    setStatus(result)
    if (result === 'done') sound.win(); else sound.over()
    setScore(s => {
      if (s > record) { localStorage.setItem(bestKey, String(s)); setRecord(s) }
      return s
    })
  }

  function next() {
    setFlash(null); setShake(false)
    if (lives <= 0) { finish('over'); return }
    if (idx >= N - 1) { finish('done'); return }
    revealedRef.current = false
    setIdx(i => i + 1)
    setPicked(null)
    setRevealed(false)
  }

  function restart() {
    setQuestions(buildRound(game))
    setIdx(0); setPicked(null); setRevealed(false); revealedRef.current = false
    setScore(0); setStreak(0); setBestStreak(0); setLives(MAX_LIVES)
    setHistory([]); setStatus('playing'); setFlash(null); setShake(false); setGain(null)
    setCount(3); setStarted(false)
  }

  if (status !== 'playing') {
    return (
      <Result
        status={status} score={score} N={N} bestStreak={bestStreak} record={record}
        history={history} sound={sound} onExit={onExit} onRestart={restart}
      />
    )
  }

  const frac = timeLeft / duration
  const seconds = Math.max(0, Math.ceil(timeLeft / 1000))

  return (
    <div className={`gm-screen${shake ? ' shake' : ''}`}>
      {flash && <div className={`gm-flash ${flash}`} />}
      {gain && (
        <div className="gm-gain" key={gain.id}>
          +{gain.amount}{gain.mult > 1 && <span className="mx">×{gain.mult}</span>}
        </div>
      )}

      {/* boshlanish countdown */}
      {!started && (
        <div className="gm-count">
          <span className="lbl">{game.title}</span>
          <b className={count <= 0 ? 'go' : ''} key={count}>{count > 0 ? count : 'GO!'}</b>
        </div>
      )}

      {/* HUD */}
      <div className="gm-hud">
        <button className="hud-btn" onClick={onExit} title="Chiqish"><Icon name="arrowL" size={17} /></button>
        <Hearts lives={lives} lostTick={lostTick} />
        <div className="gm-hud-side">
          <button className="hud-btn" onClick={sound.toggle} title={sound.isMuted ? 'Ovozni yoqish' : "Ovozni o'chirish"}>
            <Icon name={sound.isMuted ? 'volumeOff' : 'volume'} size={17} />
          </button>
          <TimerRing frac={frac} seconds={seconds} />
        </div>
      </div>

      {/* ball + kombo */}
      <div className="gm-subhud">
        <div className="gm-score"><small>BALL</small>{displayScore.toLocaleString()}</div>
        {multiplier > 1 && (
          <div className="gm-combo" key={multiplier}>
            <span className="fl"><Icon name="flame" size={15} /></span> ×{multiplier} <small>KOMBO</small>
          </div>
        )}
      </div>

      {/* progres pipslari */}
      <div className="gm-pips">
        {questions.map((_, i) => {
          const h = history[i]
          const cls = i < history.length ? (h ? 'ok' : 'no') : i === idx ? 'cur' : ''
          return <span key={i} className={`gm-pip ${cls}`} />
        })}
      </div>

      {/* savol */}
      <div className="gm-q" key={idx}>
        {(question.prompt ?? game.prompt) && <div className="gm-prompt">{question.prompt ?? game.prompt}</div>}

        <div className="gm-body">
          <Media q={question} />

          <div>
            <div className="gm-opts">
              {question.options.map((o, i) => {
                let cls = 'gm-opt'
                if (revealed && o === question.answer) cls += ' correct'
                else if (revealed && o === picked) cls += ' wrong'
                else if (revealed) cls += ' dim'
                return (
                  <button key={o} className={cls} disabled={revealed} onClick={() => settle(o)}>
                    <span className="gm-mk">
                      {revealed && o === question.answer ? <Icon name="check" size={16} />
                        : revealed && o === picked ? <Icon name="x" size={16} />
                          : String.fromCharCode(65 + i)}
                    </span>
                    {o}
                  </button>
                )
              })}
            </div>

            {revealed && question.info && (
              <div className="gm-info">
                <Icon name="book" size={16} style={{ flexShrink: 0, marginTop: 1, color: 'var(--blue-600)' }} />
                <span>{question.info}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Hearts({ lives, lostTick }) {
  return (
    <div className="gm-hearts">
      {Array.from({ length: MAX_LIVES }).map((_, i) => {
        const on = i < lives
        const justLost = i === lives && lostTick
        return (
          <span
            key={justLost ? `${i}-${lostTick}` : i}
            className={`gm-heart ${on ? 'on' : 'off'} ${justLost ? 'lost' : ''}`}
          >
            <Icon name="heart" size={20} fill={on} />
          </span>
        )
      })}
    </div>
  )
}

function TimerRing({ frac, seconds }) {
  const R = 21
  const C = 2 * Math.PI * R
  const f = Math.max(0, Math.min(1, frac))
  const off = C * (1 - f)
  const danger = f <= 0.25
  const warn = f <= 0.5
  const color = danger ? '#C53030' : warn ? '#B45309' : '#0E8345'
  return (
    <div className={`gm-timer${danger ? ' danger' : ''}`}>
      <svg width="50" height="50" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r={R} fill="none" stroke="var(--border-2)" strokeWidth="5" />
        <circle
          cx="25" cy="25" r={R} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 25 25)"
          style={{ transition: 'stroke-dashoffset .12s linear, stroke .3s ease' }}
        />
      </svg>
      <span className="gm-timer-n" style={{ color }}>{seconds}</span>
    </div>
  )
}

/* Savol turiga qarab media */
function Media({ q }) {
  if (q.kind === 'flag') return <FlagMedia code={q.country.code} />
  if (q.kind === 'shape') return <ShapeMedia code={q.country.code} />
  if (q.kind === 'clues') return (
    <div className="gm-media gm-clues">
      {q.country.clues.map((c, i) => (
        <div className="gm-clue" key={i}><span className="n">{i + 1}</span><span>{c}</span></div>
      ))}
    </div>
  )
  if (q.kind === 'location' || q.kind === 'capital') return (
    <div className="gm-media gm-namecard">
      <img className="flagchip" src={flagUrl(q.country.code)} alt="" loading="lazy"
        onError={e => { e.currentTarget.style.display = 'none' }} />
      <div className="gm-bigname">{q.country.name}</div>
    </div>
  )
  // nature / text
  return (
    <div className="gm-media gm-textq">
      <Icon name="compass" size={26} style={{ color: 'var(--text-3)' }} />
      <div className="qt">{q.q}</div>
    </div>
  )
}

function FlagMedia({ code }) {
  const [loaded, setLoaded] = useState(false)
  const [err, setErr] = useState(false)
  return (
    <div className="gm-media gm-flagwrap">
      {!loaded && !err && <div className="gm-skel" />}
      {err ? (
        <div style={{ color: 'var(--text-3)', textAlign: 'center' }}>
          <Icon name="globe" size={40} /><div className="text-sm" style={{ marginTop: 6 }}>Bayroq yuklanmadi</div>
        </div>
      ) : (
        <img
          className="gm-flag" src={flagUrl(code)} alt="bayroq"
          style={{ display: loaded ? 'block' : 'none' }}
          onLoad={() => setLoaded(true)} onError={() => setErr(true)}
        />
      )}
    </div>
  )
}

function ShapeMedia({ code }) {
  const [loaded, setLoaded] = useState(false)
  const [err, setErr] = useState(false)
  return (
    <div className="gm-media gm-shapewrap">
      {!loaded && !err && <div className="gm-skel" style={{ background: 'var(--border-2)', aspectRatio: '3/2' }} />}
      {err ? (
        <div style={{ color: 'var(--text-3)', textAlign: 'center' }}>
          <Icon name="map" size={40} /><div className="text-sm" style={{ marginTop: 6 }}>Siluet yuklanmadi</div>
        </div>
      ) : (
        <img
          className="gm-shape" src={shapeUrl(code)} alt="davlat shakli"
          style={{ display: loaded ? 'block' : 'none' }}
          onLoad={() => setLoaded(true)} onError={() => setErr(true)}
        />
      )}
    </div>
  )
}

function makeConfetti(n) {
  const colors = ['#0E8345', '#2563EB', '#B45309', '#9333EA', '#0EA5E9', '#ef4444']
  return Array.from({ length: n }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 1.5 + Math.random() * 1.6,
    color: colors[Math.floor(Math.random() * colors.length)],
  }))
}

function Result({ status, score, N, bestStreak, record, history, sound, onExit, onRestart }) {
  const correct = history.filter(Boolean).length
  const pct = Math.round((correct / N) * 100)
  const isWin = status === 'done'
  const newRecord = score >= record && score > 0
  const perfect = correct === N && isWin

  const msg = status === 'over' ? 'Jonlaringiz tugadi — qaytadan urinib ko‘ring!'
    : perfect ? 'Mukammal! Siz haqiqiy geografsiz 🏆'
      : pct >= 70 ? "Zo'r natija! Yana bir oz mashq — va a'lo bo'lasiz."
        : pct >= 40 ? 'Yaxshi boshlanish. Yana o‘ynab ko‘ring!'
          : 'Mashq kerak — yana bir bor urinib ko‘ring!'

  const [confetti] = useState(() => (isWin && pct >= 60) || perfect ? makeConfetti(perfect ? 70 : 40) : [])

  return (
    <div className="gm-screen">
      {confetti.length > 0 && (
        <div className="gm-confetti">
          {confetti.map((c, i) => (
            <i key={i} style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }} />
          ))}
        </div>
      )}

      <div className="gm-res">
        <div className={`gm-res-badge ${isWin ? 'win' : 'over'}`}>
          <Icon name={isWin ? (perfect ? 'crown' : 'trophy') : 'skull'} size={36} />
        </div>
        <div className="gm-res-title">{status === 'over' ? 'Game Over' : perfect ? 'Mukammal!' : 'Yakunlandi'}</div>
        <div className="gm-res-score">{score.toLocaleString()}</div>
        <div className="gm-res-msg">{msg}</div>

        {newRecord && (
          <div className="gm-newrec"><Icon name="sparkles" size={14} /> Yangi rekord!</div>
        )}

        <div className="gm-stats">
          <div className="gm-stat">
            <div className="v">{correct}/{N}</div>
            <div className="l">To'g'ri</div>
          </div>
          <div className="gm-stat">
            <div className="v">{pct}%</div>
            <div className="l">Aniqlik</div>
          </div>
          <div className="gm-stat">
            <div className="v">{bestStreak}<Icon name="flame" size={15} style={{ display: 'inline', verticalAlign: '-2px', marginLeft: 2, color: 'var(--amber-600)' }} /></div>
            <div className="l">Seriya</div>
          </div>
        </div>

        <div className="gm-pips" style={{ marginBottom: 18 }}>
          {Array.from({ length: N }).map((_, i) => (
            <span key={i} className={`gm-pip ${history[i] ? 'ok' : 'no'}`} />
          ))}
        </div>

        <div className="gm-res-actions">
          <button className="gm-btn-ghost" onClick={onExit}>
            <Icon name="arrowL" size={15} /> Boshqa o'yin
          </button>
          <button className="gm-next" style={{ marginTop: 0, animation: 'none' }} onClick={() => { sound.click(); onRestart() }}>
            <Icon name="rotate" size={15} /> Qaytadan
          </button>
        </div>
      </div>
    </div>
  )
}
