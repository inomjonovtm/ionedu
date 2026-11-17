import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, EmptyState } from '../../components/Dash'
import { ErrorState, LoadingBlock } from '../../components/PanelKit'

const PAGE_SIZE = 12

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('uz-UZ') : '—')

function scoreTone(p) {
  if (p >= 90) return 'hi'
  if (p >= 70) return 'mid'
  return 'low'
}

export default function AdminCertificates() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) })
  if (debounced) params.set('search', debounced)

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin-certs', params.toString()],
    queryFn: () => api.get(`/admin/certificates/?${params.toString()}`).then(r => r.data),
    placeholderData: keepPreviousData,
  })
  const list = data?.results || []
  const total = data?.count ?? list.length

  function clearSearch() { setSearch(''); setDebounced(''); setPage(1) }

  async function copyId(id) {
    try {
      await navigator.clipboard.writeText(id)
      toast.success(`ID nusxalandi: ${id}`)
    } catch {
      toast.error("Nusxalab bo'lmadi")
    }
  }

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <PageHead title="Sertifikatlar"
        sub={isLoading || isError
          ? "Kursni tugatgan o'quvchilarga berilgan sertifikatlar"
          : debounced ? `"${debounced}" bo'yicha ${total} ta sertifikat topildi` : `Jami ${total} ta sertifikat berilgan`}>
        <Link to="/verify" className="btn btn-secondary">
          <Icon name="verified" size={15} /> Tekshirish sahifasi
        </Link>
      </PageHead>

      <FilterBar search={search} onSearch={setSearch}
        placeholder="O'quvchi ismi, telefon yoki kurs nomi…"
        count={isLoading || isError ? null : total} onClear={search ? clearSearch : null} />

      {isLoading ? (
        <LoadingBlock />
      ) : isError ? (
        <ErrorState title="Sertifikatlarni yuklab bo'lmadi" onRetry={() => refetch()} />
      ) : list.length === 0 ? (
        <div className="card acf-flat">
          <EmptyState icon={debounced ? 'search' : 'award'}
            title={debounced ? 'Sertifikat topilmadi' : "Hozircha sertifikatlar yo'q"}
            sub={debounced ? "Qidiruv so'zini o'zgartirib ko'ring." : "O'quvchi kursni 100% tugatganda sertifikat avtomatik beriladi."}
            action={debounced ? <button className="btn btn-secondary btn-sm" onClick={clearSearch}>Qidiruvni tozalash</button> : undefined} />
        </div>
      ) : (
        <div className={`acf-list ${isFetching ? 'busy' : ''}`}>
          {list.map(c => {
            const pct = Math.round(Number(c.score_percent) || 0)
            return (
              <article key={c.id} className="acf-ticket">
                <div className="acf-stub">
                  <span className={`acf-stamp ${scoreTone(pct)}`}>
                    <b>{pct}%</b>
                    <small>ball</small>
                  </span>
                </div>

                <div className="acf-body">
                  <div className="acf-who">
                    <span className="avatar avatar-blue acf-av">
                      {c.student?.avatar ? <img src={absUrl(c.student.avatar)} alt="" /> : c.student?.initials}
                    </span>
                    <span className="acf-who-txt">
                      {c.student?.id
                        ? <Link to={`/admin-panel/users/${c.student.id}`} className="acf-name">{c.student.display_name}</Link>
                        : <span className="acf-name">Noma'lum o'quvchi</span>}
                      <small>{c.student?.phone || c.student?.email || '—'}</small>
                    </span>
                  </div>
                  <div className="acf-course">
                    <Icon name="book" size={14} />
                    {c.course_slug
                      ? <Link to={`/courses/${c.course_slug}`}>{c.course_title}</Link>
                      : <span>{c.course_title}</span>}
                  </div>
                  {c.teacher_name && <div className="acf-teacher">O'qituvchi: {c.teacher_name}</div>}
                </div>

                <div className="acf-end">
                  <div className="acf-date">
                    <span className="acf-mono">Berilgan</span>
                    <b>{fmtDate(c.issued_at)}</b>
                  </div>
                  <button type="button" className="acf-id" onClick={() => copyId(c.short_id)} title="ID ni nusxalash">
                    {c.short_id} <Icon name="link" size={12} />
                  </button>
                  <div className="acf-actions">
                    <Link to={`/certificate/${c.unique_id}`} className="btn btn-secondary btn-sm">
                      <Icon name="eye" size={14} /> Ko'rish
                    </Link>
                    {c.pdf_file && (
                      <a href={absUrl(c.pdf_file)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" title="PDF yuklab olish">
                        <Icon name="download" size={14} /> PDF
                      </a>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {!isError && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />}
    </DashLayout>
  )
}

const css = `
  .acf-flat { padding: 0; }
  .acf-mono { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); }

  .acf-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; transition: opacity .15s ease; }
  .acf-list.busy { opacity: .6; }

  .acf-ticket {
    display: grid; grid-template-columns: 96px minmax(0, 1fr); background: var(--white);
    border: 1.5px solid var(--border); border-radius: var(--r-card); overflow: hidden;
    transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
  }
  .acf-ticket:hover { border-color: var(--line); box-shadow: var(--hard-sm); transform: translate(-1px, -1px); }

  .acf-stub {
    grid-row: 1 / span 2; display: flex; align-items: center; justify-content: center;
    background-color: var(--paper); background-image: var(--topo); background-size: 300px 210px;
    border-right: 1.5px dashed var(--border);
  }
  .acf-stamp {
    width: 64px; height: 64px; border-radius: 999px; display: flex; flex-direction: column; align-items: center; justify-content: center;
    border: 2px solid var(--line); transform: rotate(-8deg); color: #14213D; line-height: 1;
  }
  .acf-stamp b { font-family: var(--font-display); font-size: 18px; font-weight: 800; letter-spacing: -0.04em; }
  .acf-stamp small { font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 3px; }
  .acf-stamp.hi { background: var(--green-200); }
  .acf-stamp.mid { background: var(--sun); }
  .acf-stamp.low { background: var(--coral-soft); }
  html[data-theme="dark"] .acf-stamp.hi, html[data-theme="dark"] .acf-stamp.low { color: var(--text); }

  .acf-body { padding: 16px 18px 12px; min-width: 0; display: flex; flex-direction: column; gap: 9px; }
  .acf-who { display: flex; align-items: center; gap: 11px; min-width: 0; }
  .acf-who .acf-av { width: 40px; height: 40px; border-radius: 13px; font-size: 13px; }
  .acf-who-txt { min-width: 0; display: flex; flex-direction: column; }
  .acf-name { font-family: var(--font-display); font-size: 16.5px; font-weight: 700; letter-spacing: -0.025em; line-height: 1.2; color: var(--text); overflow-wrap: anywhere; }
  a.acf-name:hover { text-decoration: underline; text-underline-offset: 3px; }
  .acf-who-txt small { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .acf-course { display: flex; align-items: flex-start; gap: 7px; font-size: 13.5px; font-weight: 650; color: var(--text-2); line-height: 1.4; overflow-wrap: anywhere; }
  .acf-course svg { color: var(--text-4); flex-shrink: 0; margin-top: 3px; }
  .acf-course a:hover { color: var(--text); text-decoration: underline; text-underline-offset: 3px; }
  .acf-teacher { font-size: 12.5px; color: var(--text-3); }

  .acf-end {
    grid-column: 2; display: flex; align-items: center; gap: 10px 14px; flex-wrap: wrap;
    padding: 11px 18px 14px; border-top: 1.5px dashed var(--border);
  }
  .acf-date { display: flex; flex-direction: column; gap: 2px; }
  .acf-date b { font-family: var(--font-mono); font-size: 12.5px; font-weight: 600; color: var(--text); }
  .acf-id {
    display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 9px; border-radius: 9px;
    font-family: var(--font-mono); font-size: 11.5px; font-weight: 600; color: var(--text-2);
    background: var(--bg-soft); border: 1.5px solid var(--border); transition: border-color .13s ease, color .13s ease;
  }
  .acf-id:hover { border-color: var(--line); color: var(--text); }
  .acf-actions { display: flex; gap: 6px; margin-left: auto; }

  @media (max-width: 1240px) {
    .acf-list { grid-template-columns: minmax(0, 1fr); }
  }
  @media (max-width: 520px) {
    .acf-ticket { grid-template-columns: 70px minmax(0, 1fr); }
    .acf-stamp { width: 52px; height: 52px; }
    .acf-stamp b { font-size: 15px; }
    .acf-body { padding: 14px 14px 10px; }
    .acf-end { padding: 10px 14px 13px; }
    .acf-actions { margin-left: 0; width: 100%; }
    .acf-actions .btn { flex: 1; }
  }
`
