import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import PhoneInput from '../components/PhoneInput'
import Pagination from '../components/Pagination'
import FileInput from '../components/FileInput'
import Confirm from '../components/Confirm'
import { useAuth } from '../store/auth'

const styles = `
  .pp-page { padding-top: 34px; padding-bottom: 90px; }
  .pp-layout { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 36px; align-items: start; }
  .pp-side { position: sticky; top: 96px; display: flex; flex-direction: column; gap: 18px; min-width: 0; }

  /* Passport */
  .pp-pass { background: var(--white); border: 2px solid var(--line); border-radius: var(--r-card); box-shadow: var(--hard); overflow: hidden; }
  .pp-pass-top { background-color: var(--ink); background-image: var(--topo); background-size: 520px 360px; color: #fff; padding: 14px 18px 46px; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
  .pp-pass-top .t { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #B7C0D8; line-height: 1.5; }
  .pp-pass-top .t b { display: block; color: #fff; font-size: 12px; }
  .pp-pass-top .g { width: 34px; height: 34px; border-radius: 11px; transform: rotate(6deg); background: var(--sun); color: #14213D; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .pp-pass-body { padding: 0 18px 18px; }
  .pp-id { display: flex; align-items: flex-end; gap: 14px; margin-top: -34px; }
  .pp-av-wrap { position: relative; flex-shrink: 0; transform: rotate(-3deg); }
  .pp-av { width: 96px; height: 108px; border-radius: 16px; background: var(--sun); color: #14213D; border: 2px solid var(--line); box-shadow: var(--hard-sm); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 800; font-size: 34px; overflow: hidden; }
  .pp-av img { width: 100%; height: 100%; object-fit: cover; }
  .pp-av-btn { position: absolute; right: -10px; bottom: -10px; width: 34px; height: 34px; border-radius: 12px; background: var(--white); color: var(--text); border: 2px solid var(--line); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .14s ease, box-shadow .14s ease; }
  .pp-av-btn:hover { transform: translate(-2px, -2px); box-shadow: var(--hard-sm); }
  .pp-role { display: inline-block; margin-bottom: 8px; padding: 5px 10px; border: 2px dashed var(--coral); color: var(--coral); border-radius: 10px; font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; transform: rotate(4deg); }
  .pp-name { font-family: var(--font-display); font-size: 27px; font-weight: 800; letter-spacing: -.035em; line-height: 1.1; margin-top: 16px; overflow-wrap: anywhere; }
  .pp-rows { margin-top: 14px; }
  .pp-row { display: flex; gap: 12px; padding: 9px 0; border-top: 1.5px dashed var(--border); align-items: baseline; }
  .pp-row .k { width: 92px; flex-shrink: 0; font-family: var(--font-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-4); display: inline-flex; align-items: center; gap: 6px; }
  .pp-row .v { flex: 1; min-width: 0; font-size: 13.5px; font-weight: 600; color: var(--text); overflow-wrap: anywhere; }
  .pp-mrz { margin: 6px -18px -18px; padding: 10px 18px; background: var(--bg-soft); border-top: 1.5px dashed var(--border); font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; color: var(--text-4); white-space: nowrap; overflow: hidden; }
  .pp-panel-links { display: flex; flex-direction: column; gap: 8px; margin: 14px 0 12px; }

  /* Index nav */
  .pp-nav { display: flex; flex-direction: column; gap: 4px; }
  .pp-nav button { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 12px; border-radius: 14px; border: 1.5px solid transparent; font-size: 14.5px; font-weight: 650; color: var(--text-2); text-align: left; white-space: nowrap; transition: background .14s ease, color .14s ease, transform .14s ease; }
  .pp-nav button .n { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-4); width: 18px; }
  .pp-nav button .a { margin-left: auto; opacity: 0; }
  .pp-nav button:hover { background: var(--bg-soft); color: var(--text); }
  .pp-nav button.on { background: var(--sun); color: #14213D; border-color: var(--line); box-shadow: var(--hard-sm); transform: translate(-1px, -1px); }
  .pp-nav button.on .n { color: #14213D; }
  .pp-nav button.on .a { opacity: 1; }

  /* Main column */
  .pp-main { min-width: 0; }
  .pp-h { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; }
  .pp-h h2 { font-family: var(--font-display); font-size: 40px; font-weight: 800; letter-spacing: -.04em; line-height: 1.05; }
  .pp-h p { font-size: 14.5px; color: var(--text-3); margin-top: 8px; max-width: 520px; line-height: 1.55; }
  .pp-sub { display: flex; align-items: center; gap: 12px; margin: 36px 0 16px; font-family: var(--font-display); font-size: 21px; font-weight: 800; letter-spacing: -.03em; }
  .pp-sub::after { content: ''; flex: 1; border-top: 1.5px dashed var(--border); }

  /* Stat bento */
  .pp-bento { display: grid; grid-template-columns: 1.35fr 1fr 1fr; gap: 14px; }
  .pp-stat { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 18px 20px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; min-width: 0; }
  .pp-stat .l { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); }
  .pp-stat .v { font-family: var(--font-display); font-weight: 800; font-size: 40px; letter-spacing: -.04em; line-height: 1; color: var(--text); }
  .pp-stat.big { grid-row: span 2; background: var(--sun); border: 2px solid var(--line); box-shadow: var(--hard); padding: 22px 24px; }
  .pp-stat.big .l, .pp-stat.big .v { color: #14213D; }
  .pp-stat.big .v { font-size: 92px; }
  .pp-stat.big .tp { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
  .pp-stat.big .e { font-size: 34px; line-height: 1; }
  .pp-stat.wide { grid-column: span 2; flex-direction: row; align-items: center; }

  /* Routes (courses) */
  .pp-routes { display: flex; flex-direction: column; gap: 12px; }
  .pp-route { display: grid; grid-template-columns: 58px minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 16px 18px; background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease; }
  .pp-route:hover { transform: translate(-2px, -2px); border-color: var(--line); box-shadow: var(--hard); }
  .pp-route .em { width: 58px; height: 58px; border-radius: 16px; background: var(--sea-soft); border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center; font-size: 28px; }
  .pp-route.done .em { background: var(--green-100); }
  .pp-route .tt { font-family: var(--font-display); font-weight: 700; font-size: 17px; letter-spacing: -.02em; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pp-route .mt { font-size: 12.5px; color: var(--text-3); margin-top: 2px; }
  .pp-line { position: relative; height: 18px; margin: 10px 8px 0 0; }
  .pp-line::before { content: ''; position: absolute; left: 0; right: 0; top: 8px; border-top: 2px dashed var(--border); }
  .pp-line .f { position: absolute; left: 0; top: 7px; height: 4px; border-radius: 4px; background: var(--green-600); }
  .pp-line .p { position: absolute; top: 2px; width: 14px; height: 14px; margin-left: -7px; border-radius: 999px; background: var(--sun); border: 2px solid var(--line); }
  .pp-line .z { position: absolute; right: -8px; top: 3px; width: 12px; height: 12px; border-radius: 999px; background: var(--white); border: 2px solid var(--border); }
  .pp-route.done .pp-line .z { display: none; }
  .pp-route .pc { font-family: var(--font-mono); font-size: 15px; font-weight: 700; color: var(--text); text-align: right; }
  .pp-route .pc small { display: block; font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-4); font-weight: 600; margin-top: 2px; }

  /* Stamps */
  .pp-stamps { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
  .pp-stamp { aspect-ratio: 1; border-radius: 999px; border: 2px dashed var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-align: center; padding: 6px; color: var(--text-4); min-width: 0; }
  .pp-stamp .e { font-size: 26px; line-height: 1; filter: grayscale(1); opacity: .45; }
  .pp-stamp .s { font-family: var(--font-mono); font-size: 9px; letter-spacing: .06em; text-transform: uppercase; font-weight: 700; line-height: 1.2; }
  .pp-stamp.on { border: 2px solid var(--line); color: #14213D; box-shadow: var(--hard-sm); }
  .pp-stamp.on .e { filter: none; opacity: 1; }
  .pp-stamp.on:nth-child(3n+1) { background: var(--sun); transform: rotate(-5deg); }
  .pp-stamp.on:nth-child(3n+2) { background: #8FE0B4; transform: rotate(4deg); }
  .pp-stamp.on:nth-child(3n) { background: #FF9D88; transform: rotate(-2deg); }

  /* Tickets (certificates, credentials) */
  .pp-tickets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .pp-ticket { display: grid; grid-template-columns: 92px minmax(0, 1fr); background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); overflow: hidden; transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease; }
  .pp-ticket:hover { transform: translate(-2px, -2px); border-color: var(--line); box-shadow: var(--hard); }
  .pp-ticket .stub { background: var(--sun); color: #14213D; border-right: 2px dashed #14213D; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 14px 8px; text-align: center; }
  .pp-ticket.violet .stub { background: #C4B6FF; }
  .pp-ticket .stub b { font-family: var(--font-mono); font-size: 16px; font-weight: 700; }
  .pp-ticket .stub small { font-family: var(--font-mono); font-size: 9px; letter-spacing: .1em; text-transform: uppercase; font-weight: 700; }
  .pp-ticket .bd { padding: 16px 18px; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .pp-ticket .bd h4 { font-family: var(--font-display); font-size: 16.5px; font-weight: 700; letter-spacing: -.02em; line-height: 1.25; overflow-wrap: anywhere; }
  .pp-ticket .bd .m { font-family: var(--font-mono); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--text-3); }
  .pp-ticket .bd .nt { font-size: 12.5px; color: var(--text-3); line-height: 1.5; }
  .pp-ticket .ac { display: flex; gap: 8px; margin-top: auto; padding-top: 12px; flex-wrap: wrap; }

  /* Test log */
  .pp-log { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 4px 18px; }
  .pp-try { display: grid; grid-template-columns: 62px minmax(0, 1fr) auto 34px; gap: 16px; align-items: center; padding: 14px 0; border-top: 1.5px dashed var(--border); }
  .pp-try:first-child { border-top: none; }
  .pp-try .sc { width: 62px; height: 46px; border-radius: 13px; border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-weight: 700; font-size: 14px; color: #14213D; background: #8FE0B4; }
  .pp-try.fail .sc { background: #FF9D88; }
  .pp-try .tt { font-weight: 700; font-size: 14.5px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pp-try .mt { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); margin-top: 3px; letter-spacing: .03em; }

  /* Forms */
  .pp-form { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 6px 26px 26px; }
  .pp-sec { display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 28px; padding: 26px 0; border-bottom: 1.5px dashed var(--border); }
  .pp-sec .sh .n { font-family: var(--font-mono); font-size: 11px; letter-spacing: .12em; color: var(--text-4); }
  .pp-sec .sh h3 { font-family: var(--font-display); font-size: 19px; font-weight: 800; letter-spacing: -.03em; margin-top: 6px; line-height: 1.2; }
  .pp-sec .sh p { font-size: 12.5px; color: var(--text-3); margin-top: 6px; line-height: 1.5; }
  .pp-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
  .pp-g2 .full { grid-column: 1 / -1; }
  .pp-g21 { display: grid; grid-template-columns: 2fr 1fr; gap: 0 12px; }
  .pp-foot { display: flex; justify-content: flex-end; gap: 8px; padding-top: 22px; }
  .pp-opt { color: var(--text-3); font-weight: 500; }

  .pp-split { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 20px; align-items: start; }
  .pp-pwd { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 26px; }
  .pp-tips { background-color: var(--ink); background-image: var(--topo); background-size: 520px 360px; color: #fff; border-radius: var(--r-card); padding: 24px; }
  .pp-tips .lk { width: 52px; height: 52px; border-radius: 16px; background: var(--sun); color: #14213D; display: flex; align-items: center; justify-content: center; transform: rotate(-5deg); margin-bottom: 18px; }
  .pp-tips h4 { font-family: var(--font-display); font-size: 20px; font-weight: 800; letter-spacing: -.03em; color: #fff; }
  .pp-tips ul { list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .pp-tips li { display: flex; gap: 10px; font-size: 13.5px; line-height: 1.5; color: #B7C0D8; }
  .pp-tips li svg { color: var(--sun); flex-shrink: 0; margin-top: 2px; }

  .pp-new { background: var(--white); border: 2px solid var(--line); border-radius: var(--r-card); box-shadow: var(--hard); padding: 22px 24px; margin-bottom: 22px; }
  .pp-new-h { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-family: var(--font-display); font-size: 18px; font-weight: 800; letter-spacing: -.02em; }
  .pp-empty { background: var(--white); border: 1.5px dashed var(--border); border-radius: var(--r-card); }
  .pp-min { min-width: 0; }
  .pp-more { align-self: flex-start; }
  .pp-pwd .field-hint { margin: 0 0 14px; }
  .pp-new .pp-foot { padding-top: 4px; }

  /* Danger zone */
  .pp-danger { margin-top: 22px; border: 1.5px dashed var(--red-600); background: var(--red-50); border-radius: var(--r-card); padding: 18px 20px; }
  .pp-danger-row { display: flex; gap: 16px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
  .pp-danger-txt { min-width: 0; flex: 1 1 320px; }
  .pp-danger-txt h4 { font-size: 17px; color: var(--red-600); }
  .pp-danger-txt p { font-size: 13px; color: var(--text-2); margin-top: 4px; line-height: 1.55; }
  .pp-danger-form { margin-top: 14px; padding-top: 14px; border-top: 1.5px dashed var(--coral-soft); display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
  .pp-danger-form .f { flex: 1 1 260px; min-width: 0; }

  @media (max-width: 1024px) {
    .pp-layout { grid-template-columns: 300px minmax(0, 1fr); gap: 24px; }
    .pp-stamps { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .pp-tickets, .pp-split { grid-template-columns: minmax(0, 1fr); }
    .pp-sec { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  }
  @media (max-width: 768px) {
    .pp-page { padding-top: 20px; padding-bottom: 64px; }
    .pp-layout { grid-template-columns: minmax(0, 1fr); }
    .pp-side { position: static; }
    .pp-nav { flex-direction: row; overflow-x: auto; gap: 8px; padding: 2px 2px 6px; scrollbar-width: none; }
    .pp-nav::-webkit-scrollbar { display: none; }
    .pp-nav button { width: auto; flex-shrink: 0; padding: 9px 13px; border-color: var(--border); background: var(--white); }
    .pp-nav button.on { background: var(--sun); border-color: var(--line); }
    .pp-nav button .n, .pp-nav button .a { display: none; }
    .pp-h h2 { font-size: 30px; }
    .pp-bento { grid-template-columns: 1fr 1fr; }
    .pp-stat.big { grid-column: span 2; grid-row: auto; }
    .pp-stat.big .v { font-size: 64px; }
    .pp-stat .v { font-size: 32px; }
    .pp-route { grid-template-columns: 46px minmax(0, 1fr); gap: 12px; padding: 14px; }
    .pp-route .em { width: 46px; height: 46px; font-size: 22px; border-radius: 13px; }
    .pp-route .pc { grid-column: 2; text-align: left; }
    .pp-route .pc small { display: inline; margin-left: 6px; }
    .pp-try { grid-template-columns: 54px minmax(0, 1fr) 34px; gap: 12px; }
    .pp-try .sc { width: 54px; }
    .pp-try .st { display: none; }
    .pp-form { padding: 2px 16px 18px; }
    .pp-pwd { padding: 18px 16px; }
    .pp-g2, .pp-g21 { grid-template-columns: minmax(0, 1fr); }
    .pp-ticket { grid-template-columns: 74px minmax(0, 1fr); }
  }
`

const ROLE_LABEL = { student: "O'quvchi", teacher: "O'qituvchi", admin: 'Administrator' }

export default function Profile() {
  const { user } = useAuth()
  const [tab, setTab] = useState('overview')

  if (!user) {
    return <Layout><div className="loading-state"><span className="spinner" />Yuklanmoqda…</div></Layout>
  }

  const isStudent = user.role === 'student'
  const isTeacher = user.role === 'teacher'
  const isAdmin = user.role === 'admin'

  const tabs = [
    { id: 'overview', icon: 'layout', label: 'Umumiy' },
    ...(isStudent ? [
      { id: 'courses', icon: 'book', label: 'Kurslarim' },
      { id: 'certs', icon: 'award', label: 'Sertifikatlar' },
      { id: 'tests', icon: 'fileText', label: 'Test natijalari' },
    ] : []),
    ...((isTeacher || isAdmin) ? [{ id: 'credentials', icon: 'grad', label: 'Sertifikatlarim' }] : []),
    { id: 'edit', icon: 'edit', label: 'Tahrirlash' },
    { id: 'security', icon: 'lock', label: 'Parol' },
  ]

  const place = user.region ? `${user.region}${user.district ? ', ' + user.district : ''}` : ''
  const mrz = `P<UZB<${(user.display_name || '').toUpperCase().replace(/[^A-Z0-9]+/g, '<')}`.padEnd(44, '<')

  return (
    <Layout>
      <style>{styles}</style>
      <div className="container pp-page">
        <div className="pp-layout">
          <aside className="pp-side">
            <div className="pp-pass fade-up">
              <div className="pp-pass-top">
                <div className="t"><b>Sayohatchi pasporti</b>Ionedu · geografiya</div>
                <span className="g"><Icon name="compass" size={18} /></span>
              </div>
              <div className="pp-pass-body">
                <div className="pp-id">
                  <AvatarUpload user={user} />
                  <span className="pp-role">{ROLE_LABEL[user.role] || 'Administrator'}</span>
                </div>
                <h1 className="pp-name">{user.display_name}</h1>

                <div className="pp-rows">
                  <InfoRow icon="message" label="Email" value={user.email} />
                  {user.phone && <InfoRow icon="phone" label="Telefon" value={user.phone} />}
                  {isStudent && user.birth_year && <InfoRow icon="calendar" label="Tug'ilgan" value={user.birth_year} />}
                  {place && <InfoRow icon="mapPin" label="Manzil" value={place} />}
                  {user.school && <InfoRow icon="book" label="Maktab" value={user.school} />}
                  {!isStudent && user.city && <InfoRow icon="mapPin" label="Shahar" value={user.city} />}
                </div>

                {(isTeacher || isAdmin) && (
                  <div className="pp-panel-links">
                    {isTeacher && (
                      <Link to="/teacher" className="btn btn-secondary btn-block">
                        <Icon name="settings" size={14} /> O'qituvchi paneli
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin-panel" className="btn btn-primary btn-block">
                        <Icon name="shield" size={14} /> Admin panel
                      </Link>
                    )}
                  </div>
                )}
                <div className="pp-mrz" aria-hidden="true">{mrz}</div>
              </div>
            </div>

            <nav className="pp-nav" aria-label="Profil bo'limlari">
              {tabs.map((t, i) => (
                <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <Icon name={t.icon} size={16} /> {t.label}
                  <Icon name="arrowR" size={15} className="a" />
                </button>
              ))}
            </nav>
          </aside>

          <main className="pp-main">
            {tab === 'overview' && <OverviewTab user={user} onTab={setTab} />}
            {tab === 'courses' && <CoursesTab />}
            {tab === 'certs' && <CertsTab />}
            {tab === 'tests' && <TestsTab />}
            {tab === 'credentials' && <CredentialsTab />}
            {tab === 'edit' && <EditTab user={user} />}
            {tab === 'security' && <PasswordTab />}
          </main>
        </div>
      </div>
    </Layout>
  )
}

function AvatarUpload({ user }) {
  const { updateMe } = useAuth()
  const [uploading, setUploading] = useState(false)

  async function pick(file) {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      await updateMe(fd)
      toast.success('Avatar yangilandi')
    } catch { toast.error('Yuklab bo\'lmadi') }
    finally { setUploading(false) }
  }

  return (
    <div className="pp-av-wrap">
      <div className="pp-av">
        {user.avatar ? <img src={absUrl(user.avatar)} alt="" /> : user.initials}
      </div>
      <label className="pp-av-btn" title="Avatarni o'zgartirish">
        <Icon name={uploading ? 'clock' : 'upload'} size={15} />
        <input type="file" accept="image/*" hidden onChange={e => pick(e.target.files?.[0])} />
      </label>
    </div>
  )
}

function TabHead({ title, mark, sub, children }) {
  return (
    <div className="pp-h fade-up">
      <div>
        <h2>{title} {mark && <span className="mark-sun">{mark}</span>}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function Empty({ icon, title, sub, children }) {
  return (
    <div className="pp-empty">
      <div className="empty-state">
        <div className="es-ico"><Icon name={icon} size={24} /></div>
        <div className="es-title">{title}</div>
        {sub && <div className="es-sub">{sub}</div>}
        {children}
      </div>
    </div>
  )
}

function RouteRow({ e }) {
  const pct = Math.max(0, Math.min(100, Math.round(e.progress_percent || 0)))
  const done = e.completed || pct >= 100
  return (
    <Link to={`/courses/${e.course?.slug}`} className={`pp-route ${done ? 'done' : ''}`}>
      <span className="em">{e.course?.thumb_emoji || '🌍'}</span>
      <div className="pp-min">
        <div className="tt">{e.course?.title}</div>
        <div className="mt">
          {e.course?.lessons_count != null && `${e.course.lessons_count} dars`}
          {e.course?.teacher?.display_name && ` · ${e.course.teacher.display_name}`}
        </div>
        <div className="pp-line">
          <span className="f" style={{ width: `${pct}%` }} />
          <span className="p" style={{ left: `${pct}%` }} />
          <span className="z" />
        </div>
      </div>
      <div className="pc">{pct}%<small>{done ? 'Marra' : "Yo'lda"}</small></div>
    </Link>
  )
}

function OverviewTab({ user, onTab }) {
  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.get('/courses/enrolled/').then(r => r.data),
    enabled: user.role === 'student',
  })
  const { data: certs = [] } = useQuery({
    queryKey: ['my-certs'],
    queryFn: () => api.get('/certificates/mine/').then(r => r.data.results || r.data),
    enabled: user.role === 'student',
  })
  const { data: attempts = [] } = useQuery({
    queryKey: ['my-attempts'],
    queryFn: () => api.get('/attempts/mine/').then(r => r.data),
    enabled: user.role === 'student',
  })
  const { data: teaching = [] } = useQuery({
    queryKey: ['my-teaching'],
    queryFn: () => api.get('/courses/?mine=1').then(r => r.data.results || r.data),
    enabled: user.role === 'teacher' || user.role === 'admin',
  })

  const firstName = (user.full_name || user.display_name || '').split(' ')[0]
  const active = enrollments.filter(e => !e.completed).slice(0, 3)
  const doneCount = enrollments.filter(e => e.completed).length

  const stamps = [
    { e: '🧭', s: 'Birinchi qadam', on: enrollments.length >= 1 },
    { e: '🏁', s: 'Marra', on: doneCount >= 1 },
    { e: '🏅', s: 'Sertifikat', on: certs.length >= 1 },
    { e: '📝', s: 'Sinovchi', on: attempts.length >= 1 },
    { e: '⭐', s: "A'lochi", on: attempts.some(a => a.score_percent >= 90) },
    { e: '🌍', s: 'Kashfiyotchi', on: enrollments.length >= 3 },
  ]

  return (
    <>
      <TabHead title="Salom," mark={firstName ? `${firstName}!` : null}
        sub={user.role === 'student'
          ? "Bu sizning sayohat daftaringiz — bosib o'tilgan yo'llar va to'plangan muhrlar."
          : (user.bio || "Kurslaringiz va o'quvchilaringiz bo'yicha qisqa xulosa.")} />

      {user.role === 'student' && (
        <>
          <div className="pp-bento fade-up fade-up-d1">
            <div className="pp-stat big">
              <div className="tp"><div className="l">Yozilgan kurslar</div><span className="e">🗺️</span></div>
              <div className="v">{enrollments.length}</div>
            </div>
            <div className="pp-stat"><div className="l">Tugatilgan</div><div className="v">{doneCount}</div></div>
            <div className="pp-stat"><div className="l">Sertifikatlar</div><div className="v">{certs.length}</div></div>
            <div className="pp-stat wide"><div className="l">Test urinishlar</div><div className="v">{attempts.length}</div></div>
          </div>

          <div className="pp-sub">Davom etayotgan kurslar</div>
          {active.length === 0 ? (
            <Empty icon="compass" title="Hozircha kurslar yo'q" sub="Yangi yo'nalish tanlang va sayohatni boshlang.">
              <Link to="/courses" className="btn btn-primary btn-sm">Kurslarni ko'rish <Icon name="arrowR" size={14} /></Link>
            </Empty>
          ) : (
            <div className="pp-routes">
              {active.map(e => <RouteRow key={e.id} e={e} />)}
              {enrollments.length > active.length && (
                <button type="button" className="btn btn-ghost btn-sm pp-more" onClick={() => onTab('courses')}>
                  Barcha kurslarim <Icon name="arrowR" size={14} />
                </button>
              )}
            </div>
          )}

          <div className="pp-sub">Pasport muhrlari</div>
          <div className="pp-stamps">
            {stamps.map(st => (
              <div key={st.s} className={`pp-stamp ${st.on ? 'on' : ''}`} title={st.on ? "Qo'lga kiritilgan" : 'Hali ochilmagan'}>
                <span className="e">{st.e}</span>
                <span className="s">{st.s}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {(user.role === 'teacher' || user.role === 'admin') && (
        <div className="pp-bento fade-up fade-up-d1">
          <div className="pp-stat big">
            <div className="tp"><div className="l">Jami o'quvchilar</div><span className="e">🎒</span></div>
            <div className="v">{teaching.reduce((s, c) => s + (c.students_count || 0), 0)}</div>
          </div>
          <div className="pp-stat"><div className="l">Kurslarim</div><div className="v">{teaching.length}</div></div>
          <div className="pp-stat"><div className="l">Nashr etilgan</div><div className="v">{teaching.filter(c => c.status === 'published').length}</div></div>
          <div className="pp-stat wide"><div className="l">O'rtacha reyting</div><div className="v">{teaching.length ? (teaching.reduce((s, c) => s + (c.rating_avg || 0), 0) / teaching.length).toFixed(1) : '—'}</div></div>
        </div>
      )}
    </>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="pp-row">
      <span className="k"><Icon name={icon} size={12} /> {label}</span>
      <span className="v">{value || '—'}</span>
    </div>
  )
}

function CoursesTab() {
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12
  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.get('/courses/enrolled/').then(r => r.data),
  })
  if (enrollments.length === 0) return (
    <>
      <TabHead title="Mening" mark="kurslarim" />
      <Empty icon="book" title="Hozircha kurslar yo'q">
        <Link to="/courses" className="btn btn-primary btn-sm">Kurslar katalogiga o'tish <Icon name="arrowR" size={14} /></Link>
      </Empty>
    </>
  )
  const pageList = enrollments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  return (
    <>
      <TabHead title="Mening" mark="kurslarim" sub="Har bir kurs — bitta marshrut. Chiziq qayerga yetganingizni ko'rsatadi.">
        <span className="coord">{enrollments.length} ta kurs</span>
      </TabHead>
      <div className="pp-routes">
        {pageList.map(e => <RouteRow key={e.id} e={e} />)}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={enrollments.length} onChange={setPage} />
    </>
  )
}

function CertsTab() {
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12
  const { data: certs = [] } = useQuery({
    queryKey: ['my-certs'],
    queryFn: () => api.get('/certificates/mine/').then(r => r.data.results || r.data),
  })
  if (certs.length === 0) return (
    <>
      <TabHead title="Mening" mark="sertifikatlarim" />
      <Empty icon="award" title="Sertifikatlar yo'q" sub="Kursni 100% tugatib sertifikat oling." />
    </>
  )
  const pageList = certs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  return (
    <>
      <TabHead title="Mening" mark="sertifikatlarim" sub="Tugatilgan har bir kurs uchun rasmiy hujjat.">
        <span className="coord">{certs.length} ta</span>
      </TabHead>
      <div className="pp-tickets">
        {pageList.map(c => (
          <div key={c.id} className="pp-ticket">
            <div className="stub">
              <Icon name="award" size={26} />
              <b>{Math.round(c.score_percent)}%</b>
              <small>Natija</small>
            </div>
            <div className="bd">
              <div className="m">{new Date(c.issued_at).toLocaleDateString('uz-UZ')}</div>
              <h4>{c.course_title}</h4>
              <div className="ac">
                <Link to={`/certificate/${c.unique_id}`} className="btn btn-secondary btn-sm">
                  <Icon name="eye" size={14} /> Ko'rish
                </Link>
                {c.pdf_file && (
                  <a href={absUrl(c.pdf_file)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" title="PDF yuklab olish">
                    <Icon name="download" size={14} /> PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={certs.length} onChange={setPage} />
    </>
  )
}

function TestsTab() {
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const { data: attempts = [] } = useQuery({
    queryKey: ['my-attempts'],
    queryFn: () => api.get('/attempts/mine/').then(r => r.data),
  })
  if (attempts.length === 0) return (
    <>
      <TabHead title="Test" mark="natijalari" />
      <Empty icon="fileText" title="Test natijalari yo'q" />
    </>
  )
  const pageList = attempts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  return (
    <>
      <TabHead title="Test" mark="natijalari" sub="Barcha urinishlaringiz jurnali.">
        <span className="coord">{attempts.length} ta urinish</span>
      </TabHead>
      <div className="pp-log">
        {pageList.map(a => (
          <div key={a.id} className={`pp-try ${a.passed ? '' : 'fail'}`}>
            <span className="sc" title={a.passed ? "O'tdi" : "O'tmadi"}>{Math.round(a.score_percent)}%</span>
            <div className="pp-min">
              <div className="tt">{a.test?.title}</div>
              <div className="mt">
                To'g'ri {a.correct_count}/{a.correct_count + a.wrong_count} · {new Date(a.started_at).toLocaleString('uz-UZ')}
              </div>
            </div>
            <span className={`st badge badge-${a.passed ? 'green' : 'red'}`}>{a.passed ? "O'tdi" : "O'tmadi"}</span>
            <span>
              {a.finished_at && a.test?.id && (
                <Link to={`/tests/${a.test.id}/result/${a.id}`} className="icon-btn" title="Natijani ko'rish">
                  <Icon name="eye" size={15} />
                </Link>
              )}
            </span>
          </div>
        ))}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={attempts.length} onChange={setPage} />
    </>
  )
}

function EditTab({ user }) {
  const { updateMe } = useAuth()
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    bio: user.bio || '',
    city: user.city || '',
    birth_year: user.birth_year || '',
    region: user.region || '',
    district: user.district || '',
    school: user.school || '',
    phone: user.phone || '',
    specialty: user.specialty || '',
    experience_years: user.experience_years || '',
    education: user.education || '',
  })
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) fd.append(k, v) })
      await updateMe(fd)
      toast.success("Saqlandi")
    } catch {
      toast.error("Saqlashda xatolik")
    } finally { setBusy(false) }
  }

  return (
    <>
      <TabHead title="Pasportni" mark="tahrirlash" sub="Ma'lumotlaringizni yangilang — ular profilingiz va sertifikatlaringizda ko'rinadi." />
      <form onSubmit={submit} className="pp-form">
        <div className="pp-sec">
          <div className="sh">
            <div className="n">01</div>
            <h3>Shaxsiy ma'lumot</h3>
            <p>Ism, aloqa va o'zingiz haqingizda qisqacha.</p>
          </div>
          <div className="pp-g2">
            <div className="field">
              <label className="label">To'liq ism</label>
              <input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Telefon raqam <span className="pp-opt">(ixtiyoriy)</span></label>
              <PhoneInput value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
            </div>
            <div className="field full">
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="field full">
              <label className="label">Bio</label>
              <textarea className="textarea" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>
          </div>
        </div>

        {user.role === 'student' && (
          <div className="pp-sec">
            <div className="sh">
              <div className="n">02</div>
              <h3>O'quvchi ma'lumotlari</h3>
              <p>Qayerda o'qiysiz va yashaysiz.</p>
            </div>
            <div className="pp-g2">
              <div className="field">
                <label className="label">Tug'ilgan yil</label>
                <input className="input" type="number" min={1980} max={new Date().getFullYear()}
                  value={form.birth_year} onChange={e => setForm({ ...form, birth_year: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">Viloyat</label>
                <input className="input" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">Tuman / shahar</label>
                <input className="input" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">Maktab</label>
                <input className="input" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {(user.role === 'teacher' || user.role === 'admin') && (
          <div className="pp-sec">
            <div className="sh">
              <div className="n">02</div>
              <h3>O'qituvchi ma'lumotlari</h3>
              <p>Mutaxassislik, tajriba va ta'lim.</p>
            </div>
            <div>
              <div className="field">
                <label className="label">Mutaxassisligingiz</label>
                <input className="input" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}
                  placeholder="Masalan, Fizik geografiya o'qituvchisi" />
              </div>
              <div className="pp-g2">
                <div className="field">
                  <label className="label">Tajriba (yil)</label>
                  <input className="input" type="number" min={0} max={60}
                    value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} />
                </div>
                <div className="field">
                  <label className="label">Shahar</label>
                  <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label className="label">Ta'lim ma'lumoti</label>
                <textarea className="textarea" rows={2} value={form.education} onChange={e => setForm({ ...form, education: e.target.value })}
                  placeholder="Diplom, daraja, oliy ta'lim muassasasi" />
              </div>
            </div>
          </div>
        )}

        <div className="pp-foot">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      </form>
    </>
  )
}

function PasswordTab() {
  const [oldPwd, setOld] = useState('')
  const [newPwd, setNew] = useState('')
  const [confirmPwd, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const hasPassword = useAuth(s => s.user?.has_password) !== false
  const hydrate = useAuth(s => s.hydrate)

  async function submit(e) {
    e.preventDefault()
    if (newPwd !== confirmPwd) return toast.error("Yangi parollar mos kelmadi")
    if (newPwd.length < 6) return toast.error("Parol kamida 6 ta belgi")
    setBusy(true)
    try {
      await api.post('/auth/change-password/', { old_password: oldPwd, new_password: newPwd })
      toast.success("Parol o'zgartirildi")
      setOld(''); setNew(''); setConfirm('')
      if (!hasPassword) hydrate()
    } catch (e) {
      toast.error(e.response?.data?.detail || "Xatolik")
    } finally { setBusy(false) }
  }

  return (
    <>
      <TabHead title="Parolni" mark="o'zgartirish" />
      <div className="pp-split">
        <form onSubmit={submit} className="pp-pwd">
          {hasPassword ? (
            <div className="field">
              <label className="label">Joriy parol</label>
              <input className="input" type="password" value={oldPwd} onChange={e => setOld(e.target.value)} required />
            </div>
          ) : (
            <div className="field-hint">
              Siz Google orqali kirgansiz — hali parolingiz yo'q. Parol o'rnatsangiz, email va parol bilan ham kira olasiz.
            </div>
          )}
          <div className="field">
            <label className="label">Yangi parol</label>
            <input className="input" type="password" value={newPwd} onChange={e => setNew(e.target.value)} required minLength={6} />
          </div>
          <div className="field">
            <label className="label">Yangi parol (qaytadan)</label>
            <input className="input" type="password" value={confirmPwd} onChange={e => setConfirm(e.target.value)} required minLength={6} />
          </div>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saqlanmoqda…' : "O'zgartirish"}</button>
        </form>

        <div className="pp-tips">
          <div className="lk"><Icon name="lock" size={24} /></div>
          <h4>Ishonchli parol</h4>
          <ul>
            <li><Icon name="checkC" size={15} /> Kamida 6 ta belgi bo'lsin</li>
            <li><Icon name="checkC" size={15} /> Harf va raqamlarni aralashtiring</li>
            <li><Icon name="checkC" size={15} /> Boshqa saytlardagi parolni takrorlamang</li>
          </ul>
        </div>
      </div>
      <DeleteAccount />
    </>
  )
}

/* Self-service account deletion — irreversible, so it needs the password
   (or the account email for Google-only accounts). */
function DeleteAccount() {
  const user = useAuth(s => s.user)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const byPassword = user?.has_password !== false

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/auth/me/delete/', byPassword ? { password: value } : { confirm: value })
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      toast.success("Akkauntingiz o'chirildi")
      window.location.assign('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || "Akkauntni o'chirib bo'lmadi")
      setBusy(false)
    }
  }

  return (
    <div className="pp-danger">
      <div className="pp-danger-row">
        <div className="pp-danger-txt">
          <h4>Akkauntni o'chirish</h4>
          <p>
            Profilingiz, kurslardagi progress, test natijalari va sertifikatlaringiz butunlay o'chadi. Buni ortga qaytarib bo'lmaydi.
          </p>
        </div>
        {!open && <button type="button" className="btn btn-danger btn-sm" onClick={() => setOpen(true)}><Icon name="trash" size={14} /> Akkauntni o'chirish</button>}
      </div>
      {open && (
        <form onSubmit={submit} className="pp-danger-form">
          <div className="f">
            <label className="label">{byPassword ? 'Tasdiqlash uchun parolingizni kiriting' : `Tasdiqlash uchun emailingizni yozing (${user?.email})`}</label>
            <input className="input" type={byPassword ? 'password' : 'email'} value={value} onChange={e => setValue(e.target.value)}
              required autoFocus autoComplete="off" />
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => { setOpen(false); setValue('') }} disabled={busy}>Bekor qilish</button>
          <button type="submit" className="btn btn-danger" disabled={busy || !value}>{busy ? "O'chirilmoqda…" : "Butunlay o'chirish"}</button>
        </form>
      )}
    </div>
  )
}

/* ============================================================
   Teacher credentials — upload external diplomas / certificates
   ============================================================ */
function CredentialsTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', issuer: '', issued_year: '', note: '', file: null })
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['my-credentials'],
    queryFn: () => api.get('/teacher/credentials/').then(r => r.data),
  })

  const del = useMutation({
    mutationFn: (id) => api.delete(`/teacher/credentials/${id}/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-credentials'] }); toast.success("O'chirildi") },
    onError: () => toast.error("O'chirib bo'lmadi"),
    onSettled: () => setToDelete(null),
  })

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return toast.error("Sertifikat nomini kiriting")
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title.trim())
      if (form.issuer) fd.append('issuer', form.issuer)
      if (form.issued_year) fd.append('issued_year', form.issued_year)
      if (form.note) fd.append('note', form.note)
      if (form.file) fd.append('file', form.file)
      await api.post('/teacher/credentials/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      qc.invalidateQueries({ queryKey: ['my-credentials'] })
      toast.success("Sertifikat qo'shildi")
      setForm({ title: '', issuer: '', issued_year: '', note: '', file: null })
      setOpen(false)
    } catch (e) {
      const d = e.response?.data
      const msg = typeof d === 'object' && d ? Object.values(d).flat()[0] : "Xatolik"
      toast.error(String(msg))
    } finally { setBusy(false) }
  }

  return (
    <div>
      <TabHead title="Mening" mark="sertifikatlarim"
        sub="Boshqa joydan olgan diplomlar, kurs sertifikatlari va malaka guvohnomalarini yuklang — bu o'quvchilarga sizning malakangizni ko'rsatadi.">
        {!open && (
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Icon name="plus" size={14} /> Sertifikat qo'shish
          </button>
        )}
      </TabHead>

      {open && (
        <form onSubmit={submit} className="pp-new fade-up">
          <div className="pp-new-h">
            <span>Yangi sertifikat</span>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)}><Icon name="x" size={16} /></button>
          </div>
          <div className="field">
            <label className="label">Sertifikat nomi *</label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Masalan, Geografiya o'qituvchisi malaka sertifikati" required autoFocus />
          </div>
          <div className="pp-g21">
            <div className="field">
              <label className="label">Kim bergan</label>
              <input className="input" value={form.issuer} onChange={e => setForm({ ...form, issuer: e.target.value })}
                placeholder="Masalan, O'zPMI, Coursera, IELTS Centre" />
            </div>
            <div className="field">
              <label className="label">Berilgan yil</label>
              <input className="input" type="number" min={1980} max={new Date().getFullYear()}
                value={form.issued_year} onChange={e => setForm({ ...form, issued_year: e.target.value })} placeholder="2023" />
            </div>
          </div>
          <div className="field">
            <label className="label">Izoh (ixtiyoriy)</label>
            <textarea className="textarea" rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              placeholder="Qisqacha tavsif" />
          </div>
          <div className="field">
            <label className="label">Sertifikat fayli (PDF, JPG, PNG)</label>
            <FileInput accept=".pdf,image/*" icon="award" hint="PDF, JPG yoki PNG — 10MB gacha"
              onPick={f => setForm({ ...form, file: f })} />
          </div>
          <div className="pp-foot">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Bekor</button>
            <button className="btn btn-primary" disabled={busy || !form.title.trim()}>
              {busy ? 'Yuklanmoqda…' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="loading-state"><span className="spinner" />Yuklanmoqda…</div>
      ) : items.length === 0 ? (
        <Empty icon="award" title="Hozircha sertifikat yo'q"
          sub="Diplom, malaka guvohnomasi yoki boshqa sertifikatlaringizni qo'shing" />
      ) : (
        <div className="pp-tickets">
          {items.map(c => (
            <div key={c.id} className="pp-ticket violet">
              <div className="stub">
                <Icon name="award" size={26} />
                {c.issued_year && <b>{c.issued_year}</b>}
              </div>
              <div className="bd">
                {c.issuer && <div className="m">{c.issuer}</div>}
                <h4>{c.title}</h4>
                {c.note && <div className="nt">{c.note}</div>}
                <div className="ac">
                  {c.file && (
                    <a href={absUrl(c.file)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                      <Icon name="eye" size={13} /> Ko'rish
                    </a>
                  )}
                  <button type="button" className="btn btn-danger btn-sm" title="O'chirish" onClick={() => setToDelete(c)}>
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toDelete && (
        <Confirm
          danger
          title="Sertifikat o'chirilsinmi?"
          text={`"${toDelete.title}" profilingizdan olib tashlanadi. Bu amalni ortga qaytarib bo'lmaydi.`}
          confirmLabel="O'chirish"
          busy={del.isPending}
          onConfirm={() => del.mutate(toDelete.id)}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
