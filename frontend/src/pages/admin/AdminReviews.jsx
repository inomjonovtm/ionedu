import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, EmptyState, Stars } from '../../components/Dash'
import { ConfirmModal, ErrorState, LoadingBlock } from '../../components/PanelKit'

const PAGE_SIZE = 10

const css = `
  .arv-layout { display: grid; grid-template-columns: minmax(0, 1fr) 290px; gap: 20px; align-items: start; }
  .arv-list { display: flex; flex-direction: column; gap: 12px; min-width: 0; transition: opacity .15s ease; }
  .arv-list.dim { opacity: .55; }

  .arv-card {
    display: grid; grid-template-columns: 62px minmax(0, 1fr); gap: 16px; padding: 16px 18px;
    background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card);
  }
  .arv-score {
    width: 62px; height: 62px; border-radius: 18px; border: 1.5px solid var(--line); transform: rotate(-3deg);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; color: #14213D;
  }
  .arv-score b { font-family: var(--font-display); font-size: 26px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
  .arv-score span { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; }
  .arv-score.hi { background: var(--green-300); }
  .arv-score.mid { background: var(--sun); }
  .arv-score.lo { background: var(--coral); }
  html[data-theme="dark"] .arv-score.hi { background: #6CCF98; }

  .arv-flat { padding: 0; }
  .arv-main { min-width: 0; }
  .arv-stars { margin-top: 5px; }
  .arv-top { display: flex; align-items: flex-start; gap: 10px; }
  .arv-course { font-family: var(--font-display); font-size: 16px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: var(--text); overflow-wrap: anywhere; }
  a.arv-course:hover { text-decoration: underline; text-underline-offset: 3px; }
  .arv-top .icon-btn { margin-left: auto; flex-shrink: 0; margin-top: -4px; margin-right: -6px; }
  .arv-text { font-size: 14px; color: var(--text-2); line-height: 1.6; margin-top: 8px; white-space: pre-line; overflow-wrap: anywhere; }
  .arv-text.none { color: var(--text-4); font-style: italic; }
  .arv-by {
    display: flex; align-items: center; gap: 9px; flex-wrap: wrap; margin-top: 12px; padding-top: 11px;
    border-top: 1.5px dashed var(--border); font-size: 13px; color: var(--text-3);
  }
  .arv-by .avatar { width: 28px; height: 28px; font-size: 11px; }
  .arv-by strong { color: var(--text); font-weight: 700; }
  .arv-by .when { margin-left: auto; font-family: var(--font-mono); font-size: 11px; white-space: nowrap; }

  .arv-side { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 14px; }
  .arv-sum { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 18px; }
  .arv-sum h3 { font-size: 15px; letter-spacing: -0.02em; }
  .arv-sum .cap { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); margin-top: 4px; }
  .arv-avg { display: flex; align-items: baseline; gap: 8px; margin: 14px 0 12px; }
  .arv-avg b { font-family: var(--font-display); font-size: 40px; font-weight: 800; letter-spacing: -0.05em; line-height: 1; color: var(--text); }
  .arv-bars { display: flex; flex-direction: column; gap: 4px; }
  .arv-bar {
    display: grid; grid-template-columns: 30px 1fr 22px; align-items: center; gap: 8px; width: 100%;
    padding: 5px 6px; border-radius: 9px; font-family: var(--font-mono); font-size: 11.5px; color: var(--text-2); text-align: left;
    transition: background .12s ease;
  }
  .arv-bar:hover { background: var(--bg-soft); }
  .arv-bar.on { background: var(--sun-soft); color: var(--text); }
  .arv-bar .k { display: inline-flex; align-items: center; gap: 3px; }
  .arv-bar .k svg { color: #F5A300; }
  .arv-bar .track { height: 8px; border-radius: 999px; background: var(--bg-soft); border: 1.5px solid var(--border); overflow: hidden; }
  .arv-bar .fill { display: block; height: 100%; background: var(--line); border-radius: 999px; }
  .arv-bar .n { text-align: right; color: var(--text-3); }
  .arv-note {
    position: relative; overflow: hidden; background: var(--ink); color: #B7C0D8; border-radius: var(--r-card);
    padding: 16px 18px; font-size: 13px; line-height: 1.55;
  }
  .arv-note::before { content: ''; position: absolute; inset: 0; background-image: var(--topo); background-size: 420px 290px; filter: invert(1); opacity: .4; pointer-events: none; }
  html[data-theme="dark"] .arv-note { border: 1.5px solid var(--border); }
  html[data-theme="dark"] .arv-note::before { filter: none; }
  .arv-note > * { position: relative; }
  .arv-note b { display: block; color: #fff; font-family: var(--font-display); font-size: 15px; letter-spacing: -0.02em; margin-bottom: 4px; }

  @media (max-width: 1100px) {
    .arv-layout { grid-template-columns: 1fr; }
    .arv-side { position: static; order: -1; }
    .arv-note { display: none; }
  }
  @media (max-width: 560px) {
    .arv-card { grid-template-columns: 1fr; gap: 12px; padding: 14px; position: relative; }
    .arv-score { width: auto; height: auto; flex-direction: row; gap: 6px; padding: 5px 12px; border-radius: 999px; transform: none; justify-self: start; }
    .arv-score b { font-size: 16px; }
    .arv-top .icon-btn { position: absolute; top: 8px; right: 8px; margin: 0; }
    .arv-by .when { margin-left: 0; width: 100%; }
  }
`

const scoreCls = (n) => (n >= 4 ? 'hi' : n === 3 ? 'mid' : 'lo')

export default function AdminReviews() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [star, setStar] = useState(0)          // 0 = all; filters the current page only
  const [toDelete, setToDelete] = useState(null)

  useEffect(() => {
    // A new search always starts from page 1 with the star filter cleared.
    const t = setTimeout(() => { setDebounced(search.trim()); setPage(1); setStar(0) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const goPage = (p) => { setPage(p); setStar(0) }

  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) })
  if (debounced) params.set('search', debounced)

  const { data, isLoading, isError, isFetching, isPlaceholderData, refetch } = useQuery({
    queryKey: ['admin-reviews', params.toString()],
    queryFn: () => api.get(`/admin/reviews/?${params.toString()}`).then(r => r.data),
    placeholderData: keepPreviousData,
  })
  const list = data?.results || []
  const total = data?.count ?? list.length

  const del = useMutation({
    mutationFn: (id) => api.delete(`/admin/reviews/${id}/`),
    onSuccess: () => {
      toast.success("Sharh o'chirildi")
      setToDelete(null)
      // The last review on a later page was removed — step back instead of showing an empty page.
      if (list.length === 1 && page > 1) goPage(page - 1)
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Sharhni o'chirib bo'lmadi"),
  })

  const dist = [5, 4, 3, 2, 1].map(n => ({ n, c: list.filter(r => r.rating === n).length }))
  const avg = list.length ? (list.reduce((s, r) => s + (r.rating || 0), 0) / list.length).toFixed(1) : '—'
  const shown = star ? list.filter(r => r.rating === star) : list

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <PageHead title="Sharhlar"
        sub={isLoading ? "Barcha kurslar bo'yicha o'quvchilar baholari" : `${total} ta sharh — barcha kurslar bo'yicha`} />

      <FilterBar search={search} onSearch={setSearch}
        placeholder="Sharh matni, kurs yoki o'quvchi bo'yicha…" count={isLoading ? null : total} />

      {isLoading ? (
        <LoadingBlock label="Sharhlar yuklanmoqda…" />
      ) : isError ? (
        <ErrorState title="Sharhlarni yuklab bo'lmadi" onRetry={refetch} />
      ) : list.length === 0 ? (
        <div className="card arv-flat">
          <EmptyState icon="star"
            title={debounced ? 'Sharhlar topilmadi' : "Hozircha sharhlar yo'q"}
            sub={debounced ? "Qidiruv so'zini o'zgartirib ko'ring." : "O'quvchilar kurslarni baholaganda shu yerda ko'rinadi."}
            action={debounced ? <button className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>Qidiruvni tozalash</button> : null} />
        </div>
      ) : (
        <div className="arv-layout">
          <div className={`arv-list ${isFetching && isPlaceholderData ? 'dim' : ''}`}>
            {shown.length === 0 && (
              <div className="card arv-flat">
                <EmptyState small icon="star" title={`Bu sahifada ${star} yulduzli sharh yo'q`}
                  action={<button className="btn btn-secondary btn-sm" onClick={() => setStar(0)}>Hammasini ko'rsatish</button>} />
              </div>
            )}
            {shown.map(r => (
              <article key={r.id} className="arv-card">
                <div className={`arv-score ${scoreCls(r.rating)}`} title={`${r.rating} / 5`}>
                  <b>{r.rating}</b><span>/ 5</span>
                </div>
                <div className="arv-main">
                  <div className="arv-top">
                    <div className="arv-main">
                      {r.course_slug
                        ? <Link to={`/courses/${r.course_slug}`} className="arv-course">{r.course_title}</Link>
                        : <span className="arv-course">{r.course_title}</span>}
                      <div className="arv-stars"><Stars value={r.rating} size={13} /></div>
                    </div>
                    <button className="icon-btn danger" title="Sharhni o'chirish" aria-label="Sharhni o'chirish"
                      onClick={() => setToDelete(r)}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                  <p className={`arv-text ${r.comment?.trim() ? '' : 'none'}`}>
                    {r.comment?.trim() || 'Izoh yozilmagan — faqat baho qo\'yilgan.'}
                  </p>
                  <div className="arv-by">
                    <span className="avatar avatar-blue">
                      {r.student?.avatar ? <img src={absUrl(r.student.avatar)} alt="" /> : (r.student?.initials || '?')}
                    </span>
                    {r.student?.id
                      ? <Link to={`/admin-panel/users/${r.student.id}`}><strong>{r.student.display_name}</strong></Link>
                      : <strong>O'chirilgan foydalanuvchi</strong>}
                    <span className="when">{new Date(r.created_at).toLocaleDateString('uz-UZ')}</span>
                  </div>
                </div>
              </article>
            ))}
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={goPage} />
          </div>

          <aside className="arv-side">
            <div className="arv-sum">
              <h3>Baholar taqsimoti</h3>
              <div className="cap">Shu sahifadagi {list.length} ta sharh</div>
              <div className="arv-avg">
                <b>{avg}</b>
                <Stars value={Math.round(Number(avg) || 0)} size={14} />
              </div>
              <div className="arv-bars">
                {dist.map(d => (
                  <button key={d.n} type="button" className={`arv-bar ${star === d.n ? 'on' : ''}`}
                    aria-pressed={star === d.n} title={`${d.n} yulduzli sharhlarni ko'rsatish`}
                    onClick={() => setStar(star === d.n ? 0 : d.n)}>
                    <span className="k">{d.n}<Icon name="starF" size={11} /></span>
                    <span className="track"><span className="fill" style={{ width: `${list.length ? (d.c / list.length) * 100 : 0}%` }} /></span>
                    <span className="n">{d.c}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="arv-note">
              <b>Moderatsiya eslatmasi</b>
              Haqoratli yoki reklama mazmunidagi sharhlarni o'chiring. O'chirilgan sharh qayta tiklanmaydi va kurs reytingi qayta hisoblanadi.
            </div>
          </aside>
        </div>
      )}

      <ConfirmModal open={!!toDelete} title="Sharhni o'chirish"
        text={toDelete ? `${toDelete.student?.display_name || "O'quvchi"}ning "${toDelete.course_title}" kursiga yozgan sharhi butunlay o'chiriladi.` : ''}
        busy={del.isPending}
        onConfirm={() => del.mutate(toDelete.id)}
        onClose={() => setToDelete(null)} />
    </DashLayout>
  )
}
