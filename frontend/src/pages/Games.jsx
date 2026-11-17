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
  .gm-page { padding-top: 44px; padding-bottom: 90px; }

  .gm-hero { display: grid; grid-template-columns: 1.2fr 1fr; gap: 44px; align-items: center; padding: 10px 0 44px; }
  .gm-hero h1 { font-size: 64px; line-height: .98; letter-spacing: -0.05em; margin-top: 18px; }
  .gm-hero p { color: var(--text-3); margin-top: 18px; max-width: 520px; font-size: 16.5px; line-height: 1.55; }

  .gm-rules { background: var(--white); border: 2px solid var(--line); border-radius: 26px; box-shadow: var(--hard-lg); padding: 8px 20px 10px; transform: rotate(1deg); }
  .gm-rules-top { display: flex; align-items: center; justify-content: space-between; padding: 10px 0 12px; border-bottom: 2px solid var(--line); }
  .gm-rules-top span { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--text-2); }
  .gm-rule { display: grid; grid-template-columns: 46px 1fr; gap: 14px; align-items: center; padding: 13px 0; border-bottom: 1.5px dashed var(--border); }
  .gm-rule:last-child { border-bottom: none; }
  .gm-rule .ic { width: 46px; height: 46px; border-radius: 14px; border: 1.5px solid var(--line); color: #14213D; display: flex; align-items: center; justify-content: center; }
  .gm-rule.r-life .ic { background: #FF9D88; transform: rotate(-5deg); }
  .gm-rule.r-time .ic { background: #8FE0B4; transform: rotate(4deg); }
  .gm-rule.r-combo .ic { background: var(--sun); transform: rotate(-3deg); }
  .gm-rule b { display: block; font-family: var(--font-display); font-size: 18px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.2; }
  .gm-rule small { display: block; font-size: 13px; color: var(--text-3); margin-top: 2px; line-height: 1.4; }

  .hud-btn {
    width: 40px; height: 40px; border-radius: 13px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
    color: var(--text); background: var(--white); border: 1.5px solid var(--line);
    transition: transform .14s ease, box-shadow .14s ease, background .14s ease;
  }
  .hud-btn:hover { background: var(--sun); color: #14213D; transform: translate(-1px, -1px); box-shadow: var(--hard-sm); }

  /* ════ O'yin tanlash — bento ═════════════════════════ */
  .gm-pick-head { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
  .gm-pick-head h2 { font-size: 32px; letter-spacing: -0.04em; }
  .gm-pick-head .rule { flex: 1; border-top: 1.5px dashed var(--border); }

  .gm-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 18px; }
  .gm-card {
    position: relative; overflow: hidden; text-align: left; cursor: pointer; padding: 0; grid-column: span 4;
    border: 2px solid var(--line); border-radius: 24px; background: var(--white); color: var(--text);
    display: flex; flex-direction: column;
    transition: transform .16s ease, box-shadow .16s ease;
  }
  .gm-card:hover { transform: translate(-3px, -3px); box-shadow: var(--hard-lg); }
  .gm-card.s5 { grid-column: span 5; }
  .gm-card.s7 { grid-column: span 7; flex-direction: row; }

  .gm-cover { height: 170px; position: relative; overflow: hidden; flex-shrink: 0; border-bottom: 2px solid var(--line); background-image: var(--topo); background-size: 420px 290px; }
  .gm-card.s7 .gm-cover { height: auto; min-height: 250px; width: 44%; border-bottom: none; border-right: 2px solid var(--line); }
  .tone-flag .gm-cover { background-color: #FF9D88; }
  .tone-shape .gm-cover { background-color: var(--ink); }
  .tone-clues .gm-cover { background-color: #C4B6FF; }
  .tone-location .gm-cover { background-color: #9DBDFF; }
  .tone-capital .gm-cover { background-color: var(--sun); }
  .tone-nature .gm-cover { background-color: #8FE0B4; }
  .tone-mixed .gm-cover { background-color: var(--sun); }
  .tone-mixed { background: var(--ink); color: #fff; }

  .gm-collage { position: absolute; inset: 0; }
  .gm-collage .pic {
    position: absolute; width: 96px; height: 66px; object-fit: cover; border-radius: 10px;
    border: 2px solid #14213D; box-shadow: 3px 3px 0 #14213D; background: #fff;
    transition: transform .25s ease;
  }
  .gm-collage .p0 { left: 9%; top: 50%; margin-top: -22px; transform: rotate(-12deg); }
  .gm-collage .p1 { left: 50%; top: 50%; margin: -52px 0 0 -48px; transform: rotate(5deg); z-index: 1; }
  .gm-collage .p2 { right: 9%; top: 50%; margin-top: -16px; transform: rotate(11deg); }
  .gm-card:hover .gm-collage .p0 { transform: rotate(-17deg) translateY(-5px); }
  .gm-card:hover .gm-collage .p1 { transform: rotate(8deg) translateY(-7px) scale(1.05); }
  .gm-card:hover .gm-collage .p2 { transform: rotate(16deg) translateY(-5px); }
  .gm-collage.silh .pic { object-fit: contain; border: none; border-radius: 0; box-shadow: none; background: none; filter: invert(1); opacity: .95; }

  .gm-no { position: absolute; left: 14px; top: 12px; z-index: 2; font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: .1em; color: #14213D; background: #fff; border: 1.5px solid #14213D; border-radius: 999px; padding: 2px 9px; }
  .gm-best { position: absolute; right: 12px; top: 12px; z-index: 2; display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: #fff; background: #14213D; border: 1.5px solid #14213D; border-radius: 999px; padding: 2px 9px; transform: rotate(3deg); }
  .gm-best svg { color: #FFC83D; }
  .tone-shape .gm-best { background: var(--sun); color: #14213D; } .tone-shape .gm-best svg { color: #14213D; }

  .gm-card-body { padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }
  .gm-card.s7 .gm-card-body { padding: 24px 26px; justify-content: center; }
  .gm-tags { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .gm-diff { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; padding: 3px 9px; border-radius: 8px; color: #14213D; }
  .gm-diff.easy { background: #8FE0B4; } .gm-diff.mid { background: #FFDD80; } .gm-diff.hard { background: #FF9D88; }
  .gm-card-title { font-family: var(--font-display); font-weight: 800; font-size: 22px; letter-spacing: -.035em; line-height: 1.12; margin-top: 4px; }
  .gm-card.s7 .gm-card-title { font-size: 32px; }
  .gm-card-desc { font-size: 13.5px; color: var(--text-3); line-height: 1.5; }
  .tone-mixed .gm-card-desc { color: #B7C0D8; }
  .gm-card-foot { margin-top: auto; padding-top: 14px; display: flex; align-items: center; gap: 12px; border-top: 1.5px dashed var(--border); }
  .tone-mixed .gm-card-foot { border-top-color: rgba(255,255,255,.2); }
  .gm-card-stats { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--text-3); }
  .tone-mixed .gm-card-stats { color: #B7C0D8; }
  .gm-card-stats span { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
  .gm-play {
    margin-left: auto; flex-shrink: 0; height: 40px; padding: 0 14px; border-radius: 13px;
    display: inline-flex; align-items: center; gap: 7px; font-weight: 700; font-size: 13.5px;
    background: var(--bg-soft); color: var(--text); border: 1.5px solid var(--line);
    transition: background .15s ease, color .15s ease;
  }
  .gm-card:hover .gm-play, .tone-mixed .gm-play { background: var(--sun); color: #14213D; border-color: #14213D; }

  /* ════ O'YIN EKRANI ══════════════════════════════════ */
  .gm-screen {
    position: relative; overflow: hidden; isolation: isolate;
    max-width: 800px; margin: 0 auto; padding: 20px 26px 28px; color: var(--text);
    border-radius: 28px; background: var(--white); border: 2px solid var(--line); box-shadow: var(--hard-lg);
    animation: gm-screen-in .4s cubic-bezier(.21,.7,.25,1) both;
  }
  @keyframes gm-screen-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  .gm-screen.shake { animation: gm-shake .42s ease; }
  @keyframes gm-shake {
    0%,100% { transform: translateX(0); }
    15% { transform: translateX(-9px) rotate(-.3deg); }
    30% { transform: translateX(8px) rotate(.3deg); }
    45% { transform: translateX(-5px); } 60% { transform: translateX(4px); } 78% { transform: translateX(-2px); }
  }

  /* HUD */
  .gm-hud { display: flex; align-items: center; gap: 12px; padding-bottom: 14px; border-bottom: 1.5px dashed var(--border); }
  .gm-hud-title { min-width: 0; flex: 1; }
  .gm-hud-title small { display: block; font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-4); }
  .gm-hud-title b { display: block; font-family: var(--font-display); font-weight: 700; font-size: 16px; letter-spacing: -0.02em; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .gm-hearts { display: flex; gap: 4px; padding: 6px 10px; border-radius: 999px; border: 1.5px solid var(--line); background: var(--white); }
  .gm-heart { color: var(--coral); transition: transform .3s, opacity .3s; display: flex; }
  .gm-heart.off { color: var(--border); transform: scale(.82); }
  .gm-heart.lost { animation: gm-heartbreak .55s ease forwards; }
  @keyframes gm-heartbreak { 0% { transform: scale(1.35); color: var(--coral); } 35% { transform: scale(.55) rotate(-14deg); } 100% { transform: scale(.82) rotate(0); color: var(--border); } }

  /* taymer — marshrut chizig'i */
  .gm-timer { display: grid; grid-template-columns: 1fr 46px; gap: 12px; align-items: center; margin-top: 16px; }
  .gm-timer-track { height: 14px; border-radius: 999px; background: var(--bg-soft); border: 1.5px solid var(--line); overflow: hidden; }
  .gm-timer-fill { height: 100%; border-radius: 999px; background: var(--green-600); transition: width .12s linear, background .3s ease; }
  .gm-timer.warn .gm-timer-fill { background: var(--sun); }
  .gm-timer.danger .gm-timer-fill { background: var(--coral); }
  .gm-timer-n { font-family: var(--font-mono); font-weight: 700; font-size: 18px; text-align: right; line-height: 1; color: var(--text); }
  .gm-timer.danger .gm-timer-n { color: var(--red-600); }
  .gm-timer-n small { font-size: 11px; color: var(--text-4); margin-left: 1px; }
  .gm-timer.danger .gm-timer-n { animation: gm-tpulse .7s ease-in-out infinite; }
  @keyframes gm-tpulse { 50% { transform: scale(1.18); } }

  /* ball + kombo qatori */
  .gm-subhud { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 16px 0 14px; min-height: 52px; }
  .gm-score { display: inline-flex; align-items: baseline; gap: 10px; padding: 8px 16px; border-radius: 16px; background: var(--sun); color: #14213D; border: 2px solid var(--line); box-shadow: var(--hard-sm); transform: rotate(-1.5deg);
    font-family: var(--font-display); font-weight: 800; font-size: 28px; line-height: 1; letter-spacing: -.04em; }
  .gm-score small { font-family: var(--font-mono); font-size: 10px; letter-spacing: .14em; font-weight: 700; }
  .gm-combo {
    display: inline-flex; align-items: center; gap: 7px; padding: 7px 13px; border-radius: 999px;
    font-weight: 700; font-size: 15px; font-family: var(--font-mono); color: #14213D;
    background: #FF9D88; border: 2px solid var(--line); transform: rotate(2deg);
    animation: gm-combo-in .3s ease;
  }
  @keyframes gm-combo-in { from { transform: scale(.6); opacity: 0; } to { transform: scale(1) rotate(2deg); opacity: 1; } }
  .gm-combo small { font-size: 10px; letter-spacing: .12em; font-weight: 700; }
  .gm-combo .fl { display: inline-flex; animation: gm-flick .5s ease-in-out infinite alternate; }
  @keyframes gm-flick { from { transform: scale(1) rotate(-5deg); } to { transform: scale(1.2) rotate(5deg); } }

  /* progres — marshrut nuqtalari */
  .gm-pips { position: relative; display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; padding: 0 2px; }
  .gm-pips::before { content: ''; position: absolute; left: 4px; right: 4px; top: 50%; border-top: 2px dashed var(--border); }
  .gm-pip { position: relative; width: 14px; height: 14px; border-radius: 999px; background: var(--white); border: 2px solid var(--border); transition: .3s; }
  .gm-pip.ok { background: var(--green-600); border-color: var(--line); }
  .gm-pip.no { background: var(--coral); border-color: var(--line); }
  .gm-pip.cur { background: var(--sun); border-color: var(--line); transform: scale(1.3); animation: gm-pip-pulse 1s ease-in-out infinite; }
  @keyframes gm-pip-pulse { 50% { transform: scale(1); } }

  /* savol bloki */
  .gm-q { animation: gm-qin .4s cubic-bezier(.21,.7,.25,1) both; }
  @keyframes gm-qin { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
  .gm-prompt { text-align: center; font-family: var(--font-display); font-size: 24px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.2; color: var(--text); margin-bottom: 16px; }

  .gm-body { display: flex; flex-direction: column; gap: 18px; }

  /* media panellari */
  .gm-media {
    border-radius: 22px; overflow: hidden; position: relative; border: 2px solid var(--line); min-height: 200px;
    background-color: var(--bg-soft); background-image: radial-gradient(var(--border) 1.2px, transparent 1.2px); background-size: 20px 20px;
  }
  .gm-flagwrap, .gm-shapewrap { padding: 26px; display: flex; align-items: center; justify-content: center; }
  .gm-flag {
    width: 100%; max-width: 270px; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; background: #fff;
    border: 2px solid var(--line); box-shadow: var(--hard); transform: rotate(-2deg);
    animation: gm-pop .38s ease;
  }
  .gm-shapewrap { background-color: #FBF6EA; background-image: radial-gradient(rgba(20,33,61,.14) 1.2px, transparent 1.2px); color: #3B4763; }
  .gm-shape { max-height: 160px; max-width: 80%; transform: rotate(-2deg); animation: gm-pop .42s ease; }
  .gm-namecard { background-color: var(--sea-soft); padding: 26px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .gm-namecard .flagchip { width: 76px; height: 52px; object-fit: cover; border-radius: 9px; margin: 0 auto 14px; display: block; border: 2px solid var(--line); box-shadow: var(--hard-sm); transform: rotate(-4deg); }
  .gm-bigname { font-family: var(--font-display); font-weight: 800; font-size: 40px; letter-spacing: -.045em; line-height: 1.05; color: var(--text); overflow-wrap: anywhere; }
  .gm-clues { background: var(--white); background-image: none; padding: 8px 20px; min-height: 0; }
  .gm-clue {
    display: flex; align-items: flex-start; gap: 12px; padding: 13px 0;
    border-bottom: 1.5px dashed var(--border); font-size: 15px; font-weight: 500; color: var(--text-2); line-height: 1.5; animation: gm-slide .4s ease both;
  }
  .gm-clue:last-child { border-bottom: 0; }
  .gm-clue:nth-child(2) { animation-delay: .12s; } .gm-clue:nth-child(3) { animation-delay: .24s; }
  .gm-clue .n {
    width: 26px; height: 26px; flex-shrink: 0; border-radius: 9px; font-family: var(--font-mono); font-size: 12px; font-weight: 700;
    background: var(--sun); color: #14213D; border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center;
  }
  .gm-textq { background-color: var(--sun-soft); padding: 28px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .gm-textq .cmp { width: 46px; height: 46px; border-radius: 14px; background: var(--sun); color: #14213D; border: 1.5px solid var(--line); transform: rotate(-6deg); display: flex; align-items: center; justify-content: center; }
  .gm-textq .qt { font-family: var(--font-display); font-size: 26px; font-weight: 700; letter-spacing: -0.03em; margin-top: 14px; color: var(--text); line-height: 1.2; }
  .gm-shapewrap .gm-media-err { color: inherit; }
  .gm-media-err { color: var(--text-3); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }

  .gm-skel { width: 100%; max-width: 270px; aspect-ratio: 4/3; border-radius: 12px;
    background: var(--white); border: 2px dashed var(--border); animation: gm-skelpulse 1.1s ease-in-out infinite alternate; }
  .gm-skel.sh { aspect-ratio: 3/2; background: rgba(20,33,61,.08); border-color: rgba(20,33,61,.2); }
  @keyframes gm-skelpulse { from { opacity: .45; } to { opacity: 1; } }

  /* javob variantlari — 2×2 stikerlar */
  .gm-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .gm-opt {
    display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; min-width: 0;
    padding: 13px 14px; border-radius: 18px; font-size: 15.5px; font-weight: 700; line-height: 1.25;
    border: 2px solid var(--line); background: var(--white); color: var(--text); cursor: pointer;
    transition: background .12s, transform .12s, box-shadow .12s; animation: gm-slide .3s ease both;
  }
  .gm-opt:nth-child(2) { animation-delay: .05s; } .gm-opt:nth-child(3) { animation-delay: .1s; } .gm-opt:nth-child(4) { animation-delay: .15s; }
  .gm-opt:hover:not(:disabled) { transform: translate(-2px, -2px); box-shadow: var(--hard); }
  .gm-opt:active:not(:disabled) { transform: translate(1px, 1px); box-shadow: none; }
  .gm-opt:disabled { cursor: default; }
  .gm-mk {
    width: 36px; height: 36px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    border: 1.5px solid var(--line); color: #14213D;
    font-family: var(--font-mono); font-size: 14px; font-weight: 700; transition: .15s;
  }
  .gm-opt:nth-child(1) .gm-mk { background: var(--sun); } .gm-opt:nth-child(2) .gm-mk { background: #9DBDFF; }
  .gm-opt:nth-child(3) .gm-mk { background: #8FE0B4; } .gm-opt:nth-child(4) .gm-mk { background: #FF9D88; }
  .gm-opt.correct { background: var(--green-100); border-color: var(--green-600); color: var(--green-800); box-shadow: 4px 4px 0 var(--green-600); animation: gm-correct .5s ease; }
  .gm-opt.correct .gm-mk { background: var(--green-600); border-color: var(--green-600); color: #fff; }
  .gm-opt.wrong { background: var(--coral-soft); border-color: var(--red-600); color: var(--red-600); animation: gm-wobble .42s ease; }
  .gm-opt.wrong .gm-mk { background: var(--red-600); border-color: var(--red-600); color: #fff; }
  .gm-opt.dim { opacity: .45; }
  @keyframes gm-correct { 0% { transform: scale(1); } 35% { transform: scale(1.035); } 100% { transform: scale(1); } }
  @keyframes gm-wobble { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }

  .gm-info {
    margin-top: 14px; padding: 12px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5; font-weight: 500;
    background: var(--sea-soft); border: 1.5px dashed var(--sea); color: var(--text);
    display: flex; gap: 10px; align-items: flex-start; animation: gm-slide .3s ease;
  }
  .gm-info svg { flex-shrink: 0; margin-top: 2px; color: var(--sea); }

  /* ball "uchib chiqadigan" popup */
  .gm-gain {
    position: absolute; top: 150px; left: 50%; z-index: 8; pointer-events: none; margin-left: -60px; width: 120px; text-align: center;
    font-family: var(--font-display); font-weight: 800; font-size: 30px; letter-spacing: -.03em; color: var(--green-600);
    animation: gm-gainup 1s ease forwards;
  }
  .gm-gain .mx { font-family: var(--font-mono); font-size: 14px; color: var(--coral); margin-left: 4px; }
  @keyframes gm-gainup { 0% { opacity: 0; transform: translateY(12px) scale(.8); } 20% { opacity: 1; transform: translateY(0) scale(1.15); } 38% { transform: scale(1); } 100% { opacity: 0; transform: translateY(-38px); } }

  /* chaqnash pardasi */
  .gm-flash { position: absolute; inset: 0; z-index: 5; pointer-events: none; opacity: 0; }
  .gm-flash.good { background: rgba(18,155,98,.16); animation: gm-flashk .55s ease; }
  .gm-flash.bad { background: rgba(255,106,77,.2); animation: gm-flashk .55s ease; }
  @keyframes gm-flashk { 0% { opacity: 0; } 22% { opacity: 1; } 100% { opacity: 0; } }

  /* "3-2-1-GO!" boshlanish */
  .gm-count {
    position: absolute; inset: 0; z-index: 20; display: flex; flex-direction: column; align-items: center; justify-content: center;
    background-color: var(--white); background-image: var(--topo); background-size: 520px 360px;
  }
  .gm-count .lbl { font-family: var(--font-mono); font-size: 12px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: var(--text-3); margin-bottom: 22px; text-align: center; padding: 0 16px; }
  .gm-count b {
    width: 168px; height: 168px; border-radius: 48px; display: flex; align-items: center; justify-content: center;
    background: var(--sun); color: #14213D; border: 2px solid var(--line); box-shadow: var(--hard-lg);
    font-family: var(--font-display); font-weight: 800; font-size: 96px; letter-spacing: -.05em; line-height: 1;
    animation: gm-countpop .72s ease;
  }
  .gm-count b.go { background: #8FE0B4; font-size: 64px; }
  @keyframes gm-countpop { 0% { opacity: 0; transform: scale(1.6) rotate(-8deg); } 30% { opacity: 1; transform: scale(1) rotate(-3deg); } 80% { opacity: 1; transform: scale(1) rotate(-3deg); } 100% { opacity: 0; transform: scale(.7) rotate(0); } }

  /* ════ NATIJA ════════════════════════════════════════ */
  .gm-confetti { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 2; }
  .gm-confetti i { position: absolute; top: -14px; width: 10px; height: 14px; border-radius: 3px; opacity: .95; animation: gm-fall linear forwards; }
  @keyframes gm-fall { to { transform: translateY(640px) rotate(620deg); opacity: 0; } }

  .gm-res { position: relative; z-index: 3; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center; padding: 14px 4px 4px; }
  .gm-res-main { min-width: 0; }
  .gm-res-badge {
    width: 72px; height: 72px; border-radius: 22px; display: inline-flex; align-items: center; justify-content: center;
    border: 2px solid var(--line); box-shadow: var(--hard); color: #14213D; margin-bottom: 20px;
    animation: gm-badgepop .5s cubic-bezier(.2,.8,.3,1.4) both;
  }
  @keyframes gm-badgepop { from { transform: scale(0) rotate(-25deg); } to { transform: scale(1) rotate(-6deg); } }
  .gm-res-badge.win { background: var(--sun); }
  .gm-res-badge.over { background: #FF9D88; }
  .gm-res-kick { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--text-3); }
  .gm-res-title { font-family: var(--font-display); font-weight: 800; font-size: 46px; letter-spacing: -.045em; line-height: 1; color: var(--text); margin-top: 8px; }
  .gm-res-msg { font-size: 15.5px; color: var(--text-3); margin-top: 12px; line-height: 1.5; }
  .gm-newrec {
    display: inline-flex; align-items: center; gap: 7px; margin-top: 16px; padding: 6px 13px; border-radius: 999px;
    font-size: 13px; font-weight: 700; color: #14213D; background: #FF9D88; border: 2px solid var(--line);
    animation: gm-flick .6s ease-in-out infinite alternate;
  }
  .gm-res-card { border: 2px solid var(--line); border-radius: 24px; overflow: hidden; background: var(--white); }
  .gm-res-score { background-color: var(--sun); background-image: var(--topo); background-size: 420px 290px; color: #14213D; padding: 22px 22px 20px; border-bottom: 2px solid var(--line); text-align: center; }
  .gm-res-score small { display: block; font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; letter-spacing: .16em; }
  .gm-res-score b { display: block; font-family: var(--font-display); font-weight: 800; font-size: 68px; letter-spacing: -.055em; line-height: 1; margin-top: 4px; }
  .gm-stats { display: grid; grid-template-columns: repeat(3, 1fr); }
  .gm-stat { padding: 16px 8px; text-align: center; border-right: 1.5px dashed var(--border); }
  .gm-stat:last-child { border-right: none; }
  .gm-stat .v { font-family: var(--font-display); font-weight: 800; font-size: 24px; letter-spacing: -.04em; color: var(--text); line-height: 1; display: inline-flex; align-items: center; gap: 3px; }
  .gm-stat .v svg { color: var(--coral); }
  .gm-stat .l { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--text-4); margin-top: 7px; }
  .gm-res-foot { grid-column: 1 / -1; }
  .gm-res-foot .gm-pips { margin-bottom: 22px; }
  .gm-res-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  @keyframes gm-pop { from { transform: scale(.9) rotate(-2deg); opacity: 0; } to { transform: scale(1) rotate(-2deg); opacity: 1; } }
  @keyframes gm-slide { from { transform: translateY(7px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  @media (max-width: 980px) {
    .gm-hero { grid-template-columns: 1fr; gap: 28px; padding-bottom: 36px; }
    .gm-hero h1 { font-size: 50px; }
    .gm-rules { transform: none; }
    .gm-card, .gm-card.s5, .gm-card.s7 { grid-column: span 6; flex-direction: column; }
    .gm-card.s7 .gm-cover { width: auto; height: 170px; min-height: 0; border-right: none; border-bottom: 2px solid var(--line); }
    .gm-card.s7 .gm-card-body { padding: 18px 20px 20px; justify-content: flex-start; }
    .gm-card.s7 .gm-card-title { font-size: 22px; }
    .gm-card:last-child:nth-child(odd) { grid-column: 1 / -1; }
  }
  @media (max-width: 768px) {
    .gm-page { padding-top: 26px; }
    .gm-hero h1 { font-size: 38px; }
    .gm-hero p { font-size: 15px; }
    .gm-rules { box-shadow: var(--hard); }
    .gm-pick-head h2 { font-size: 26px; }
    .gm-card, .gm-card.s5, .gm-card.s7 { grid-column: 1 / -1; }
    .gm-screen { padding: 16px 16px 22px; border-radius: 22px; box-shadow: var(--hard); }
    .gm-hud-title small { display: none; }
    .gm-score { font-size: 23px; padding: 7px 13px; }
    .gm-prompt { font-size: 20px; }
    .gm-bigname { font-size: 30px; }
    .gm-textq .qt { font-size: 21px; }
    .gm-media { min-height: 170px; }
    .gm-res { grid-template-columns: 1fr; gap: 22px; }
    .gm-res-title { font-size: 36px; }
    .gm-res-score b { font-size: 54px; }
    .gm-count b { width: 132px; height: 132px; border-radius: 38px; font-size: 72px; }
    .gm-count b.go { font-size: 50px; }
  }
  @media (max-width: 520px) {
    .gm-opts { grid-template-columns: 1fr; gap: 10px; }
    .gm-pip { width: 11px; height: 11px; }
    .gm-res-actions { grid-template-columns: 1fr; }
    .gm-collage .pic { width: 84px; height: 58px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .gm-screen, .gm-q, .gm-opt, .gm-combo, .gm-gain, .gm-flash, .gm-count b, .gm-res-badge { animation: none !important; }
  }
`

/* Bento joylashuvi: har bir o'yin kartasi nechta ustun egallashi (12 dan) */
const SPANS = ['s7', 's5', 's4', 's4', 's4', 's5', 's7']

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
      <div className="container gm-page">
        {!active ? (
          <>
            <header className="gm-hero">
              <div className="fade-up">
                <span className="eyebrow">Geografiya arcade</span>
                <h1>Dunyoni o'ynab <span className="mark-sun">zabt eting</span> 🌍</h1>
                <p>
                  Jonlaringizni asrang, taymer tugashidan oldin javob bering va ketma-ket
                  to'g'ri javoblar bilan komboni oshiring. Bu shunchaki test emas — bu o'yin.
                </p>
              </div>

              <div className="gm-rules fade-up-d1">
                <div className="gm-rules-top">
                  <span>O'yin qoidalari</span>
                  <button className="hud-btn"
                    onClick={sound.toggle} title={sound.isMuted ? 'Ovozni yoqish' : "Ovozni o'chirish"}>
                    <Icon name={sound.isMuted ? 'volumeOff' : 'volume'} size={17} />
                  </button>
                </div>
                <div className="gm-rule r-life">
                  <span className="ic"><Icon name="heart" size={20} fill /></span>
                  <span><b>{MAX_LIVES} ta jon</b><small>Xato javob yoki vaqt tugashi bitta jon oladi.</small></span>
                </div>
                <div className="gm-rule r-time">
                  <span className="ic"><Icon name="timer" size={20} /></span>
                  <span><b>Tezlik bonusi</b><small>Qancha tez javob bersangiz, shuncha ko'p ball.</small></span>
                </div>
                <div className="gm-rule r-combo">
                  <span className="ic"><Icon name="flame" size={20} /></span>
                  <span><b>Kombo ×5 gacha</b><small>Ketma-ket to'g'ri javoblar ballni ko'paytiradi.</small></span>
                </div>
              </div>
            </header>

            <div className="gm-pick-head">
              <h2>O'yinni tanlang</h2>
              <span className="rule" />
              <span className="coord">{GAMES.length} TA O'YIN</span>
            </div>

            <div className="gm-grid">
              {GAMES.map((g, i) => (
                <button
                  key={g.id}
                  className={`gm-card fade-up tone-${g.tone} ${SPANS[i % SPANS.length]}`}
                  style={{ animationDelay: `${i * 55}ms` }}
                  onClick={() => { sound.click(); setActive(g) }}
                >
                  <div className="gm-cover">
                    <span className="gm-no">{String(i + 1).padStart(2, '0')}</span>
                    <div className={`gm-collage${g.mode === 'shape' ? ' silh' : ''}`}>
                      {g.pics.map((code, p) => (
                        <img
                          key={code} className={`pic p${p}`} alt="" loading="lazy"
                          src={g.mode === 'shape' ? shapeUrl(code) : flagUrl(code)}
                          onError={e => { e.currentTarget.style.display = 'none' }}
                        />
                      ))}
                    </div>
                    {bests[g.id] > 0 && (
                      <span className="gm-best"><Icon name="trophy" size={11} /> {bests[g.id]}</span>
                    )}
                  </div>
                  <div className="gm-card-body">
                    <div className="gm-tags">
                      <span className={`gm-diff ${g.diff}`}><Icon name={g.icon} size={12} /> {DIFF_LABEL[g.diff]}</span>
                    </div>
                    <div className="gm-card-title">{g.title}</div>
                    <div className="gm-card-desc">{g.desc}</div>
                    <div className="gm-card-foot">
                      <div className="gm-card-stats">
                        <span><Icon name="list" size={13} /> {roundSize(g)} savol</span>
                        <span><Icon name="timer" size={13} /> {g.secs}s</span>
                        <span><Icon name="heart" size={13} fill /> {MAX_LIVES} jon</span>
                      </div>
                      <span className="gm-play"><Icon name="play" size={14} fill /> O'ynash</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <Engine game={active} sound={sound} onExit={() => setActive(null)} />
        )}
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
        <div className="gm-hud-title">
          <small>Savol {idx + 1} / {N}</small>
          <b>{game.title}</b>
        </div>
        <Hearts lives={lives} lostTick={lostTick} />
        <button className="hud-btn" onClick={sound.toggle} title={sound.isMuted ? 'Ovozni yoqish' : "Ovozni o'chirish"}>
          <Icon name={sound.isMuted ? 'volumeOff' : 'volume'} size={17} />
        </button>
      </div>

      <TimerBar frac={frac} seconds={seconds} />

      {/* ball + kombo */}
      <div className="gm-subhud">
        <div className="gm-score"><small>BALL</small>{displayScore.toLocaleString()}</div>
        {multiplier > 1 && (
          <div className="gm-combo" key={multiplier}>
            <span className="fl"><Icon name="flame" size={16} /></span> ×{multiplier} <small>KOMBO</small>
          </div>
        )}
      </div>

      {/* progres nuqtalari */}
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
                      {revealed && o === question.answer ? <Icon name="check" size={17} />
                        : revealed && o === picked ? <Icon name="x" size={17} />
                          : String.fromCharCode(65 + i)}
                    </span>
                    {o}
                  </button>
                )
              })}
            </div>

            {revealed && question.info && (
              <div className="gm-info">
                <Icon name="book" size={16} />
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
            <Icon name="heart" size={19} fill={on} />
          </span>
        )
      })}
    </div>
  )
}

/* Taymer — qisqarib boruvchi marshrut chizig'i */
function TimerBar({ frac, seconds }) {
  const f = Math.max(0, Math.min(1, frac))
  const danger = f <= 0.25
  const warn = f <= 0.5
  return (
    <div className={`gm-timer${danger ? ' danger' : warn ? ' warn' : ''}`}>
      <div className="gm-timer-track">
        <div className="gm-timer-fill" style={{ width: `${f * 100}%` }} />
      </div>
      <span className="gm-timer-n">{seconds}<small>s</small></span>
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
      <span className="cmp"><Icon name="compass" size={24} /></span>
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
        <div className="gm-media-err">
          <Icon name="globe" size={40} /><div>Bayroq yuklanmadi</div>
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
      {!loaded && !err && <div className="gm-skel sh" />}
      {err ? (
        <div className="gm-media-err">
          <Icon name="map" size={40} /><div>Siluet yuklanmadi</div>
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
  const colors = ['#FFC83D', '#FF6A4D', '#2E62F0', '#129B62', '#7C5CFF', '#9DBDFF']
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
        <div className="gm-res-main">
          <div className={`gm-res-badge ${isWin ? 'win' : 'over'}`}>
            <Icon name={isWin ? (perfect ? 'crown' : 'trophy') : 'skull'} size={36} />
          </div>
          <div className="gm-res-kick">O'yin natijasi</div>
          <div className="gm-res-title">{status === 'over' ? 'Game Over' : perfect ? 'Mukammal!' : 'Yakunlandi'}</div>
          <div className="gm-res-msg">{msg}</div>

          {newRecord && (
            <div className="gm-newrec"><Icon name="sparkles" size={14} /> Yangi rekord!</div>
          )}
        </div>

        <div className="gm-res-card">
          <div className="gm-res-score"><small>BALL</small><b>{score.toLocaleString()}</b></div>
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
              <div className="v">{bestStreak}<Icon name="flame" size={16} /></div>
              <div className="l">Seriya</div>
            </div>
          </div>
        </div>

        <div className="gm-res-foot">
          <div className="gm-pips">
            {Array.from({ length: N }).map((_, i) => (
              <span key={i} className={`gm-pip ${history[i] ? 'ok' : 'no'}`} />
            ))}
          </div>

          <div className="gm-res-actions">
            <button className="btn btn-secondary btn-lg" onClick={onExit}>
              <Icon name="arrowL" size={16} /> Boshqa o'yin
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => { sound.click(); onRestart() }}>
              <Icon name="rotate" size={16} /> Qaytadan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
