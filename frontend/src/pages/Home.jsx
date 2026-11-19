import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import CourseCard from '../components/CourseCard'
import Icon from '../components/Icon'

const css = `
  .hm { overflow-x: clip; }

  /* ── Hero: headline + map board ── */
  .hm-hero { padding: 56px 0 40px; }
  .hm-hero-grid { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr); gap: 56px; align-items: center; }
  .hm-kicker { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 26px; }
  .hm-hero h1 {
    font-family: var(--font-display); font-weight: 800;
    font-size: clamp(40px, 6.1vw, 80px); line-height: .98; letter-spacing: -0.045em;
  }
  .hm-hero h1 small {
    display: block; font-size: .5em; line-height: 1.15; letter-spacing: -0.035em;
    color: var(--text-3); font-weight: 700; margin-top: .45em;
  }
  .hm-lead { font-size: 17.5px; line-height: 1.65; color: var(--text-2); max-width: 520px; margin-top: 26px; font-weight: 500; }
  .hm-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 34px; }
  .hm-trust {
    display: inline-flex; align-items: center; gap: 12px; margin-top: 30px;
    font-size: 14px; color: var(--text-3); font-weight: 600;
  }
  .hm-trust strong { color: var(--text); font-weight: 800; }
  .hm-faces { display: flex; }
  .hm-faces span {
    width: 34px; height: 34px; border-radius: 11px; margin-left: -8px;
    border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center;
    font-size: 17px; color: #14213D;
  }
  .hm-faces span:first-child { margin-left: 0; }

  .hm-board {
    position: relative; aspect-ratio: 1 / 1; width: 100%; max-width: 520px; margin-left: auto;
    background-color: var(--white); background-image: var(--topo); background-size: 520px 360px;
    border: 2px solid var(--line); border-radius: 32px; box-shadow: var(--hard-lg);
  }
  .hm-board svg.route { position: absolute; inset: 0; width: 100%; height: 100%; color: var(--line); }
  .hm-board .lat {
    position: absolute; left: 0; right: 0; border-top: 1.5px dashed var(--border);
  }
  .hm-board .lon { position: absolute; top: 0; bottom: 0; border-left: 1.5px dashed var(--border); }
  .hm-tile {
    position: absolute; display: flex; align-items: center; justify-content: center;
    border: 2px solid var(--line); border-radius: 22%; box-shadow: var(--hard);
    transform: rotate(var(--r, 0deg)); line-height: 1;
    animation: hmBob 6s ease-in-out infinite;
  }
  @keyframes hmBob {
    0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
    50% { transform: translateY(-8px) rotate(var(--r, 0deg)); }
  }
  .hm-tile.t1 { --r: -5deg; width: 38%; height: 38%; left: 31%; top: 29%; background: var(--sun); font-size: clamp(64px, 9vw, 108px); }
  .hm-tile.t2 { --r: 7deg; width: 21%; height: 21%; left: 8%; top: 9%; background: #8FE0B4; font-size: clamp(30px, 4.4vw, 52px); animation-delay: -2s; }
  .hm-tile.t3 { --r: -8deg; width: 19%; height: 19%; right: 8%; top: 13%; background: #9DBDFF; font-size: clamp(28px, 4vw, 46px); animation-delay: -3.5s; }
  .hm-tile.t4 { --r: 6deg; width: 20%; height: 20%; left: 9%; bottom: 10%; background: #FF9D88; font-size: clamp(28px, 4vw, 48px); animation-delay: -1s; }
  .hm-note {
    position: absolute; display: flex; align-items: center; gap: 10px;
    background: var(--white); border: 2px solid var(--line); border-radius: 14px;
    padding: 9px 13px 9px 9px; box-shadow: var(--hard-sm); white-space: nowrap;
  }
  .hm-note .ic {
    width: 32px; height: 32px; border-radius: 10px; border: 1.5px solid var(--line);
    display: flex; align-items: center; justify-content: center; color: #14213D; flex-shrink: 0;
  }
  .hm-note b { display: block; font-size: 13px; font-weight: 800; line-height: 1.2; }
  .hm-note i { display: block; font-style: normal; font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .08em; color: var(--text-3); margin-top: 2px; }
  .hm-note.n1 { right: -18px; bottom: 16%; transform: rotate(3deg); }
  .hm-note.n2 { left: -18px; top: 44%; transform: rotate(-4deg); }
  .hm-pin { position: absolute; display: flex; align-items: center; gap: 6px; }
  .hm-pin .dot {
    width: 14px; height: 14px; border-radius: 999px 999px 999px 0; transform: rotate(-45deg);
    background: var(--coral); border: 2px solid var(--line); flex-shrink: 0;
  }
  .hm-pin.p1 { right: 10%; top: 40%; }
  .hm-pin.p2 { left: 36%; bottom: 8%; }
  .hm-board .corner { position: absolute; }
  .hm-board .corner.c1 { left: 16px; top: 12px; }
  .hm-board .corner.c2 { right: 16px; bottom: 12px; }

  /* ── Live stats bar ── */
  .hm-stats {
    display: grid; grid-template-columns: auto repeat(4, 1fr);
    background: var(--white); border: 2px solid var(--line); border-radius: 22px; overflow: hidden;
    margin-top: 64px;
  }
  .hm-stats .live {
    background: var(--ink); color: #fff; padding: 20px 22px;
    display: flex; flex-direction: column; justify-content: center; gap: 6px;
    font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase;
  }
  .hm-stats .live span { display: inline-flex; align-items: center; gap: 8px; color: #B7C0D8; }
  .hm-stats .live span::before {
    content: ''; width: 8px; height: 8px; border-radius: 999px; background: var(--sun);
    animation: hmPulse 1.6s ease-in-out infinite;
  }
  @keyframes hmPulse { 50% { opacity: .25; } }
  .hm-stats .live b { font-family: var(--font-display); font-size: 17px; letter-spacing: -.02em; text-transform: none; font-weight: 700; }
  .hm-stat { padding: 20px 22px; border-left: 1.5px dashed var(--border); display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .hm-stat .v { font-family: var(--font-display); font-weight: 800; font-size: 38px; letter-spacing: -0.045em; line-height: 1; }
  .hm-stat .v em { font-style: normal; color: var(--coral); }
  .hm-stat .l { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); font-weight: 600; }

  /* ── Section scaffolding ── */
  .hm-sec { padding: 96px 0 0; }
  .hm-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 36px; }
  .hm-head .section-title { margin-top: 16px; max-width: 640px; }

  /* ── Bento ── */
  .hm-bento { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
  .hm-b {
    position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end;
    padding: 24px; min-height: 200px; border-radius: var(--r-card); border: 2px solid var(--line);
    transition: transform .16s ease, box-shadow .16s ease;
  }
  .hm-b:hover { transform: translate(-2px, -2px); box-shadow: var(--hard); }
  .hm-b .em { position: absolute; right: 18px; top: 14px; font-size: 54px; line-height: 1; transform: rotate(8deg); transition: transform .2s ease; }
  .hm-b:hover .em { transform: rotate(-4deg) scale(1.08); }
  .hm-b .tag { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; font-weight: 600; opacity: .75; margin-bottom: 8px; }
  .hm-b h3 { font-family: var(--font-display); font-size: 25px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.1; }
  .hm-b p { font-size: 14px; line-height: 1.5; margin-top: 8px; font-weight: 500; opacity: .82; max-width: 380px; }
  .hm-b .go {
    position: absolute; left: 24px; top: 22px; width: 38px; height: 38px; border-radius: 12px;
    border: 2px solid currentColor; display: flex; align-items: center; justify-content: center;
  }
  .hm-b.courses { grid-column: span 2; grid-row: span 2; background: var(--sun); color: #14213D; padding: 30px; }
  .hm-b.courses h3 { font-size: clamp(34px, 4vw, 48px); }
  .hm-b.courses p { font-size: 16px; }
  .hm-b.courses .em { font-size: clamp(110px, 14vw, 170px); right: 22px; top: 18px; }
  .hm-b.courses .go { left: 30px; top: 28px; background: #14213D; color: var(--sun); border-color: #14213D; }
  .hm-b.tests { background: var(--white); color: var(--text); }
  .hm-b.games { background: #FF9D88; color: #14213D; }
  .hm-b.world { grid-column: span 2; background: var(--ink); color: #fff; }
  .hm-b.world svg.lines { position: absolute; inset: 0; width: 100%; height: 100%; }
  .hm-b.world > * { position: relative; }
  .hm-b.world .em { position: absolute; }
  .hm-b.world .go { position: absolute; color: var(--sun); }
  .hm-b.ratings { grid-column: span 2; background: #C4B6FF; color: #14213D; }
  .hm-b.cert { grid-column: span 2; background: #8FE0B4; color: #14213D; }
  .hm-b.ratings, .hm-b.cert { min-height: 0; grid-row: auto; flex-direction: row; align-items: center; justify-content: flex-start; gap: 18px; padding: 22px 24px; }
  .hm-b.ratings .em, .hm-b.cert .em { position: static; font-size: 44px; transform: rotate(-6deg); }
  .hm-b.ratings h3, .hm-b.cert h3 { font-size: 21px; }
  .hm-b.ratings p, .hm-b.cert p { margin-top: 3px; }
  .hm-b .end { margin-left: auto; flex-shrink: 0; }

  /* ── Courses: sticky intro + staggered columns ── */
  .hm-courses { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: 48px; align-items: start; }
  .hm-cintro { position: sticky; top: 104px; }
  .hm-cintro .section-title { margin-top: 16px; }
  .hm-cintro p { color: var(--text-3); font-size: 16px; line-height: 1.65; margin: 16px 0 26px; font-weight: 500; }
  .hm-cstamp {
    display: inline-flex; flex-direction: column; gap: 2px; margin-top: 34px; padding: 12px 16px;
    border: 2px dashed var(--line); border-radius: 14px; transform: rotate(-3deg);
    font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-2); font-weight: 600;
  }
  .hm-cstamp b { font-family: var(--font-display); font-size: 22px; letter-spacing: -.03em; color: var(--text); text-transform: none; }
  .hm-cgrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; align-items: start; }
  .hm-cgrid > :nth-child(even) { margin-top: 44px; }
  .hm-empty {
    border: 2px dashed var(--border); border-radius: var(--r-card); padding: 48px 28px; text-align: center;
    color: var(--text-3); font-weight: 500; line-height: 1.65;
  }
  .hm-empty .e { font-size: 44px; display: block; margin-bottom: 12px; }
  .hm-empty a { color: var(--text); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }

  /* ── Route (how it works) ── */
  .hm-route-wrap { margin-top: 96px; padding: 80px 0 88px; background: var(--white); border-top: 2px solid var(--line); border-bottom: 2px solid var(--line); }
  .hm-route { position: relative; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; padding-top: 12px; }
  .hm-route svg.path { position: absolute; left: 0; top: 0; width: 100%; height: 150px; color: var(--line); pointer-events: none; }
  .hm-step { position: relative; }
  .hm-step:nth-child(3) { margin-top: 64px; }
  .hm-step .num {
    width: 62px; height: 62px; border-radius: 20px; border: 2px solid var(--line); box-shadow: var(--hard-sm);
    display: flex; align-items: center; justify-content: center; color: #14213D;
    font-family: var(--font-display); font-weight: 800; font-size: 26px; letter-spacing: -.04em;
    transform: rotate(-4deg); margin-bottom: 22px;
  }
  .hm-step h3 { font-family: var(--font-display); font-size: 24px; font-weight: 800; letter-spacing: -0.035em; margin: 8px 0 8px; }
  .hm-step p { color: var(--text-3); font-size: 15px; line-height: 1.65; max-width: 300px; font-weight: 500; }

  /* ── Teachers: portrait gallery ── */
  .hm-thead { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 34px; }
  .hm-thead .section-title { margin-top: 16px; }
  .hm-thead p { color: var(--text-3); font-size: 16px; line-height: 1.6; margin-top: 12px; max-width: 520px; font-weight: 500; }
  .hm-tgrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
  .hm-tcard {
    display: flex; flex-direction: column; background: var(--white); color: var(--text);
    border: 2px solid var(--line); border-radius: 26px; overflow: hidden;
    transition: transform .16s ease, box-shadow .16s ease;
  }
  .hm-tcard:hover { transform: translate(-4px, -4px); box-shadow: var(--hard-lg); }
  .hm-tcard:nth-child(even) { margin-top: 28px; }
  .hm-tphoto { position: relative; aspect-ratio: 4 / 5; overflow: hidden; border-bottom: 2px solid var(--line); }
  .hm-tphoto img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .35s ease; }
  .hm-tcard:hover .hm-tphoto img { transform: scale(1.05); }
  .hm-tphoto .ini {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    background-image: var(--topo); background-size: 360px 250px; color: #14213D;
    font-family: var(--font-display); font-weight: 800; font-size: 84px; letter-spacing: -.05em;
  }
  .hm-tphoto .rate {
    position: absolute; top: 12px; right: 12px; display: inline-flex; align-items: center; gap: 5px;
    height: 30px; padding: 0 10px; border-radius: 10px; background: var(--sun); color: #14213D;
    border: 2px solid #14213D; font-family: var(--font-mono); font-size: 12.5px; font-weight: 700; transform: rotate(4deg);
  }
  .hm-tphoto .no {
    position: absolute; left: 12px; bottom: 12px; padding: 3px 9px; border-radius: 8px;
    background: #14213D; color: #fff; font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; letter-spacing: .08em;
  }
  .hm-tbody { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .hm-tbody b { font-family: var(--font-display); font-size: 20px; font-weight: 800; letter-spacing: -.03em; line-height: 1.15; }
  .hm-tbody .sp { font-size: 13.5px; color: var(--text-3); font-weight: 500; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .hm-tbody .ft { display: flex; align-items: center; gap: 14px; margin-top: auto; padding-top: 12px; border-top: 1.5px dashed var(--border); font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--text-3); }
  .hm-tbody .ft i { font-style: normal; font-weight: 700; color: var(--text); font-size: 13px; letter-spacing: 0; margin-right: 4px; }
  .hm-tbody .ft svg { margin-left: auto; color: var(--text); }
  @media (max-width: 1024px) {
    .hm-tgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .hm-tcard:nth-child(even) { margin-top: 0; }
  }
  @media (max-width: 560px) {
    .hm-tgrid { gap: 12px; }
    .hm-tphoto .ini { font-size: 56px; }
    .hm-tbody { padding: 12px 12px 14px; } .hm-tbody b { font-size: 16.5px; } .hm-tbody .sp { font-size: 12.5px; }
    .hm-tbody .ft { gap: 8px; font-size: 9.5px; } .hm-tbody .ft i { font-size: 12px; }
    .hm-tbody .ft svg { display: none; }
  }

  /* ── Final CTA ── */
  .hm-cta-sec { padding: 96px 0 104px; }
  .hm-cta {
    position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 32px; align-items: center;
    background: var(--ink); color: #fff; border: 2px solid var(--line); border-radius: 32px;
    box-shadow: 8px 8px 0 var(--sun); padding: 64px 56px;
  }
  .hm-cta svg.lines { position: absolute; inset: 0; width: 100%; height: 100%; }
  .hm-cta > div { position: relative; }
  .hm-cta .coord { color: #B7C0D8; }
  .hm-cta h2 { font-family: var(--font-display); font-size: clamp(32px, 4.6vw, 56px); font-weight: 800; letter-spacing: -0.045em; line-height: 1.02; color: #fff; margin-top: 14px; }
  .hm-cta h2 span { color: var(--sun); }
  .hm-cta p { color: #B7C0D8; font-size: 17px; margin: 18px 0 30px; max-width: 440px; font-weight: 500; }
  .hm-cta-acts { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
  .hm-cta-acts a.alt { color: #fff; font-weight: 700; font-size: 15px; display: inline-flex; align-items: center; gap: 7px; padding: 0 10px; height: 48px; text-decoration: underline; text-underline-offset: 4px; text-decoration-style: dashed; }
  .hm-pack { position: relative; height: 240px; }
  .hm-pack span {
    position: absolute; display: flex; align-items: center; justify-content: center; line-height: 1;
    border: 2px solid #14213D; border-radius: 24px; box-shadow: 4px 4px 0 rgba(0,0,0,.45);
  }
  .hm-pack .a { width: 150px; height: 150px; left: 22%; top: 34px; background: var(--sun); font-size: 78px; transform: rotate(-7deg); }
  .hm-pack .b { width: 96px; height: 96px; right: 6%; top: 6px; background: #9DBDFF; font-size: 46px; transform: rotate(9deg); }
  .hm-pack .c { width: 88px; height: 88px; right: 14%; bottom: 0; background: #FF9D88; font-size: 42px; transform: rotate(-4deg); }

  @media (max-width: 1080px) {
    .hm-hero-grid { gap: 36px; }
    .hm-note.n1 { right: -6px; } .hm-note.n2 { left: -6px; }
    .hm-stats { grid-template-columns: repeat(4, 1fr); }
    .hm-stats .live { grid-column: 1 / -1; flex-direction: row; align-items: center; justify-content: space-between; padding: 12px 22px; }
    .hm-stat:nth-child(2) { border-left: none; }
    .hm-courses { grid-template-columns: 1fr; gap: 32px; }
    .hm-cintro { position: static; }
    .hm-cstamp { display: none; }
  }
  @media (max-width: 900px) {
    .hm-hero { padding-top: 36px; }
    .hm-hero-grid { grid-template-columns: 1fr; gap: 44px; }
    .hm-board { margin: 0 auto; max-width: 440px; }
    .hm-bento { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .hm-b.courses { grid-row: auto; min-height: 300px; }
    .hm-route { grid-template-columns: 1fr; gap: 0; padding: 0 0 0 30px; border-left: 2px dashed var(--line); margin-left: 30px; }
    .hm-route svg.path { display: none; }
    .hm-step { padding: 0 0 40px 26px; }
    .hm-step:last-child { padding-bottom: 0; }
    .hm-step:nth-child(3) { margin-top: 0; }
    .hm-step .num { position: absolute; left: -62px; top: -4px; margin: 0; }
    .hm-step p { max-width: none; }
    .hm-cta { grid-template-columns: 1fr; padding: 48px 32px; }
    .hm-pack { display: none; }
  }
  @media (max-width: 768px) {
    .hm-sec { padding-top: 68px; }
    .hm-stats { grid-template-columns: repeat(2, 1fr); margin-top: 48px; }
    .hm-stat { padding: 16px 18px; }
    .hm-stat:nth-child(2n) { border-left: none; }
    .hm-stat:nth-child(n+4) { border-top: 1.5px dashed var(--border); }
    .hm-stat .v { font-size: 30px; }
    .hm-route-wrap { margin-top: 68px; padding: 60px 0 64px; }
    .hm-cta-sec { padding: 68px 0 76px; }
    .hm-cta { box-shadow: 5px 5px 0 var(--sun); border-radius: 26px; }
    .hm-note.n1 { right: 6px; } .hm-note.n2 { left: 6px; }
  }
  @media (max-width: 560px) {
    .hm-bento { grid-template-columns: 1fr; }
    .hm-b, .hm-b.courses, .hm-b.world, .hm-b.ratings, .hm-b.cert { grid-column: auto; }
    .hm-b.tests, .hm-b.games, .hm-b.world { min-height: 190px; }
    .hm-cgrid { grid-template-columns: 1fr; }
    .hm-cgrid > :nth-child(even) { margin-top: 0; }
    .hm-ctas .btn { flex: 1 1 100%; }
    .hm-board { border-radius: 24px; box-shadow: var(--hard); }
    .hm-note { padding: 6px 10px 6px 6px; }
    .hm-note .ic { width: 26px; height: 26px; }
    .hm-cta { padding: 40px 22px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hm-tile, .hm-stats .live span::before { animation: none; }
  }
`

const STEPS = [
  ['1', 'A nuqta · start', "Ro'yxatdan o'ting", "Bepul akkaunt yarating va o'zingizga mos kurslarni toping.", 'var(--sun)'],
  ['2', "B nuqta · yo'lda", "Kurslarni o'rganing", "Video darslar, interaktiv testlar va o'qituvchidan jonli yordam.", '#9DBDFF'],
  ['3', 'Marra · finish', 'Sertifikat oling', "Kursni yakunlab, rasmiy sertifikatga ega bo'ling.", '#8FE0B4'],
]

const AV_TONES = ['var(--sun)', '#9DBDFF', '#8FE0B4', '#FF9D88']

function Contours() {
  return (
    <svg className="lines" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="1.4">
        <path d="M-20 250 C 90 190, 170 280, 290 220 S 480 160, 640 210" />
        <path d="M-20 205 C 100 145, 190 235, 310 175 S 500 115, 640 165" />
        <path d="M-20 160 C 110 100, 210 190, 330 130 S 520 70, 640 120" />
        <path d="M-20 115 C 120 55, 230 145, 350 85 S 540 25, 640 75" />
        <path d="M-20 70 C 130 10, 250 100, 370 40 S 560 -20, 640 30" />
        <ellipse cx="470" cy="215" rx="70" ry="34" />
        <ellipse cx="470" cy="215" rx="40" ry="18" />
      </g>
    </svg>
  )
}

export default function Home() {
  const { data: courses = [] } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: () => api.get('/courses/?status=published').then(r => r.data.results || r.data),
  })
  const { data: teachers = [] } = useQuery({
    queryKey: ['featured-teachers'],
    queryFn: () => api.get('/teachers/').then(r => r.data.results || r.data),
  })
  const { data: stats = {} } = useQuery({
    queryKey: ['home-stats'],
    queryFn: () => api.get('/stats/').then(r => r.data).catch(() => ({})),
  })

  // Bosh sahifada eng yuqori reytingdagilar birinchi chiqadi
  const featured = [...(courses || [])]
    .sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0) || (b.rating_count ?? 0) - (a.rating_count ?? 0))
    .slice(0, 6)
  const topTeachers = [...(teachers || [])]
    .sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
    .slice(0, 4)

  return (
    <Layout>
      <style>{css}</style>
      <div className="hm">

        {/* ── Hero ── */}
        <section className="hm-hero">
          <div className="container">
            <div className="hm-hero-grid">
              <div className="fade-up">
                <div className="hm-kicker">
                  <span className="eyebrow">2026-yil o'quv dasturi tayyor</span>
                  <span className="coord">41.31°N · 69.24°E</span>
                </div>
                <h1>
                  Dunyoni <span className="mark-sun">kashf et.</span>
                  <small>Geografiyani professional darajada o'rgan.</small>
                </h1>
                <p className="hm-lead">
                  Video darslar, interaktiv testlar, o'yinlar va rasmiy sertifikatlar — DTM va
                  Prezident maktabiga tayyorgarlik uchun yagona platforma.
                </p>
                <div className="hm-ctas">
                  <Link to="/auth/register" className="btn btn-primary btn-lg">
                    Bepul boshlash <Icon name="arrowR" size={16} />
                  </Link>
                  <Link to="/courses" className="btn btn-secondary btn-lg">
                    <Icon name="play" size={14} /> Kurslarni ko'rish
                  </Link>
                </div>
                {stats.students > 0 && (
                  <div className="hm-trust">
                    <div className="hm-faces">
                      <span style={{ background: 'var(--sun)' }}>🧑‍🎓</span>
                      <span style={{ background: '#9DBDFF' }}>👩‍🎓</span>
                      <span style={{ background: '#8FE0B4' }}>🧭</span>
                    </div>
                    <span><strong>{stats.students}</strong> o'quvchi allaqachon o'rganmoqda</span>
                  </div>
                )}
              </div>

              <div className="hm-board fade-up-d2" aria-hidden="true">
                <span className="lat" style={{ top: '33.3%' }} />
                <span className="lat" style={{ top: '66.6%' }} />
                <span className="lon" style={{ left: '33.3%' }} />
                <span className="lon" style={{ left: '66.6%' }} />
                <svg className="route" viewBox="0 0 400 400" fill="none">
                  <path d="M74 78 C 150 60, 150 150, 200 190 S 330 120, 326 96" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 9" strokeLinecap="round" />
                  <path d="M200 200 C 190 280, 120 270, 80 318" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 9" strokeLinecap="round" />
                  <path d="M250 250 C 300 290, 330 300, 340 330" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 9" strokeLinecap="round" />
                </svg>
                <span className="coord corner c1">N 45° · W 60°</span>
                <span className="coord corner c2">MASSHTAB 1 : ∞</span>

                <span className="hm-tile t1">🌍</span>
                <span className="hm-tile t2">🏔️</span>
                <span className="hm-tile t3">🧭</span>
                <span className="hm-tile t4">🏜️</span>

                <span className="hm-pin p1"><span className="dot" /><span className="coord">TOSHKENT</span></span>
                <span className="hm-pin p2"><span className="dot" /><span className="coord">SAMARQAND</span></span>

                <div className="hm-note n1">
                  <span className="ic" style={{ background: '#8FE0B4' }}><Icon name="checkC" size={16} /></span>
                  <span><b>Test — 92%</b><i>15/16 TO'G'RI</i></span>
                </div>
                <div className="hm-note n2">
                  <span className="ic" style={{ background: 'var(--sun)' }}><Icon name="award" size={16} /></span>
                  <span><b>Sertifikat berildi</b><i>KURS YAKUNLANDI</i></span>
                </div>
              </div>
            </div>

            {/* ── Live stats ── */}
            <div className="hm-stats fade-up-d3">
              <div className="live">
                <span>Jonli</span>
                <b>Ionedu raqamlarda</b>
              </div>
              {[
                [stats.students ?? 0, "O'quvchilar"],
                [stats.courses ?? 0, 'Kurslar'],
                [stats.teachers ?? 0, "O'qituvchilar"],
                [stats.certificates ?? 0, 'Sertifikatlar'],
              ].map(([v, l]) => (
                <div key={l} className="hm-stat">
                  <span className="v">{v}<em>+</em></span>
                  <span className="l">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bento: what you can do ── */}
        <section className="hm-sec">
          <div className="container">
            <div className="hm-head">
              <div>
                <span className="eyebrow">Xaritadagi manzillar</span>
                <h2 className="section-title">Bu yerda nima <span className="mark-sea">qilsa bo'ladi?</span></h2>
              </div>
              <span className="coord">6 TA YO'NALISH · 1 TA PLATFORMA</span>
            </div>

            <div className="hm-bento">
              <Link to="/courses" className="hm-b courses">
                <span className="go"><Icon name="arrowR" size={18} /></span>
                <span className="em">📚</span>
                <span className="tag">{stats.courses ?? 0}+ kurs</span>
                <h3>Video kurslar</h3>
                <p>Maktab dasturidan DTMgacha — qadam-baqadam darslar, har biri test bilan mustahkamlanadi.</p>
              </Link>
              <Link to="/tests" className="hm-b tests">
                <span className="em">📝</span>
                <span className="tag">Bilimni sinash</span>
                <h3>Testlar</h3>
                <p>O'qituvchilar tayyorlagan mustaqil testlar, natijalar profilingizda.</p>
              </Link>
              <Link to="/games" className="hm-b games">
                <span className="em">🎮</span>
                <span className="tag">O'ynab o'rgan</span>
                <h3>O'yinlar</h3>
                <p>Bayroqlar, poytaxtlar, xarita — zerikmaysiz.</p>
              </Link>
              <Link to="/world" className="hm-b world">
                <Contours />
                <span className="go"><Icon name="map" size={18} /></span>
                <span className="em">🗺️</span>
                <span className="tag">Interaktiv</span>
                <h3>Dunyo xaritasi</h3>
                <p>Davlatlarni bosing, o'rganing va sayyorani kaftingizda aylantiring.</p>
              </Link>
              <Link to="/ratings" className="hm-b ratings">
                <span className="em">🏆</span>
                <span>
                  <h3>Reyting</h3>
                  <p>Eng faol o'quvchilar jadvali — o'rningizni toping.</p>
                </span>
                <Icon name="arrowR" size={20} className="end" />
              </Link>
              <Link to="/verify" className="hm-b cert">
                <span className="em">🎓</span>
                <span>
                  <h3>Sertifikat</h3>
                  <p>Rasmiy va tekshirish kodi bilan tasdiqlanadi.</p>
                </span>
                <Icon name="arrowR" size={20} className="end" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Featured courses ── */}
        <section className="hm-sec">
          <div className="container">
            <div className="hm-courses">
              <div className="hm-cintro">
                <span className="eyebrow">Mashhur kurslar</span>
                <h2 className="section-title">O'quvchilar <span className="mark-leaf">tanlovi</span></h2>
                <p>Eng yuqori baholangan kurslar. Birini tanlang va bugunoq birinchi darsni ko'ring.</p>
                <Link to="/courses" className="btn btn-secondary">Barcha kurslar <Icon name="arrowR" size={14} /></Link>
                <div>
                  <span className="hm-cstamp">
                    <b>TOP {featured.length || 6}</b>
                    reyting bo'yicha
                  </span>
                </div>
              </div>
              {featured.length === 0 ? (
                <div className="hm-empty">
                  <span className="e">🧭</span>
                  Hozircha kurslar yo'q. <Link to="/auth/register">O'qituvchi sifatida ro'yxatdan o'ting</Link> va birinchi kurs muallifi bo'ling.
                </div>
              ) : (
                <div className="hm-cgrid">
                  {featured.map(c => <CourseCard key={c.id} course={c} />)}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── How it works: route ── */}
        <section className="hm-route-wrap">
          <div className="container">
            <div className="hm-head" style={{ marginBottom: 48 }}>
              <div>
                <span className="eyebrow">Qanday ishlaydi</span>
                <h2 className="section-title">Marshrut: <span className="mark-sun">uch bekat</span></h2>
              </div>
              <p className="section-sub" style={{ marginTop: 0 }}>Ro'yxatdan o'tib, kurslarni tanlang va o'rganishni boshlang.</p>
            </div>
            <div className="hm-route">
              <svg className="path" viewBox="0 0 1000 150" preserveAspectRatio="none" fill="none" aria-hidden="true">
                <path d="M70 42 C 200 -10, 280 110, 400 44 S 600 -10, 735 108" stroke="currentColor" strokeWidth="2.5"
                  strokeDasharray="2 10" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>
              {STEPS.map(([n, tag, t, p, bg]) => (
                <div key={n} className="hm-step">
                  <div className="num" style={{ background: bg }}>{n}</div>
                  <span className="coord">{tag.toUpperCase()}</span>
                  <h3>{t}</h3>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Teachers ── */}
        <section className="hm-sec">
          <div className="container">
            <div className="hm-thead">
              <div>
                <span className="eyebrow">O'qituvchilarimiz</span>
                <h2 className="section-title">Yo'l boshlovchi <span className="mark-coral">ustozlar</span></h2>
                <p>Eng yaxshi mutaxassislar — har bir kurs ortida tajribali, tekshirilgan o'qituvchi turadi.</p>
              </div>
              <Link to="/teachers" className="btn btn-secondary">Barcha ustozlar <Icon name="arrowR" size={14} /></Link>
            </div>
            {topTeachers.length === 0 ? (
              <div className="hm-empty">
                <span className="e">🎒</span>
                O'qituvchilar tez orada qo'shiladi.
              </div>
            ) : (
              <div className="hm-tgrid">
                {topTeachers.map((t, i) => (
                  <Link key={t.id} to={`/teachers/${t.id}`} className="hm-tcard">
                    <span className="hm-tphoto" style={{ background: AV_TONES[i % AV_TONES.length] }}>
                      {t.avatar
                        ? <img src={absUrl(t.avatar)} alt={t.display_name} loading="lazy" />
                        : <span className="ini" aria-hidden="true">{t.initials}</span>}
                      {(t.avg_rating ?? 0) > 0 && (
                        <span className="rate"><Icon name="starF" size={12} /> {t.avg_rating.toFixed(1)}</span>
                      )}
                      <span className="no">№ {String(i + 1).padStart(2, '0')}</span>
                    </span>
                    <span className="hm-tbody">
                      <b>{t.display_name}</b>
                      <span className="sp">{t.specialty || t.bio?.slice(0, 60) || "Geografiya o'qituvchisi"}</span>
                      <span className="ft">
                        <span><i>{t.course_count ?? 0}</i>kurs</span>
                        <span><i>{t.students_count ?? 0}</i>o'quvchi</span>
                        <Icon name="arrowR" size={16} />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="hm-cta-sec">
          <div className="container">
            <div className="hm-cta">
              <Contours />
              <div>
                <span className="coord">IONEDU · 2026 · KEYINGI BEKAT — SIZ</span>
                <h2>Geografiya sayohatingizni <span>bugun</span> boshlang</h2>
                <p>Birinchi kurs — bepul. Ionedu jamoasiga qo'shiling.</p>
                <div className="hm-cta-acts">
                  <Link to="/auth/register" className="btn btn-accent btn-lg">
                    Bepul ro'yxatdan o'tish <Icon name="arrowR" size={16} />
                  </Link>
                  <Link to="/courses" className="alt">Avval kurslarni ko'raman</Link>
                </div>
              </div>
              <div className="hm-pack" aria-hidden="true">
                <span className="a">🎒</span>
                <span className="b">🧭</span>
                <span className="c">📍</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
