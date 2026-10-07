import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, Panel, EmptyState } from '../../components/Dash'

const PAGE_SIZE = 12

export default function AdminCertificates() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => { setPage(1) }, [debounced])

  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) })
  if (debounced) params.set('search', debounced)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-certs', params.toString()],
    queryFn: () => api.get(`/admin/certificates/?${params.toString()}`).then(r => r.data),
  })
  const list = data?.results || []
  const total = data?.count ?? list.length

  return (
    <DashLayout kind="admin">
      <PageHead title="Sertifikatlar" sub={`${total} ta berilgan sertifikat`} />

      <FilterBar search={search} onSearch={setSearch}
        placeholder="O'quvchi ismi, telefon yoki kurs nomi…" count={total} />

      <Panel title="Berilgan sertifikatlar" count={total}>
        {isLoading ? (
          <div className="loading-state"><span className="spinner" /></div>
        ) : list.length === 0 ? (
          <EmptyState icon="award"
            title={debounced ? 'Sertifikat topilmadi' : "Hozircha sertifikatlar yo'q"}
            sub={debounced ? "Qidiruv so'zini o'zgartirib ko'ring." : "O'quvchi kursni 100% tugatganda sertifikat avtomatik beriladi."} />
        ) : (
          <table className="table">
            <thead><tr><th>O'quvchi</th><th>Kurs</th><th>Ball</th><th>Sana</th><th>ID</th><th></th></tr></thead>
            <tbody>
              {list.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar avatar-blue">{c.student?.initials}</div>
                      <strong>{c.student?.display_name}</strong>
                    </div>
                  </td>
                  <td>{c.course_title}</td>
                  <td><strong className="font-mono" style={{ fontWeight: 560 }}>{Math.round(c.score_percent)}%</strong></td>
                  <td className="text-sm text-muted">{new Date(c.issued_at).toLocaleDateString('uz-UZ')}</td>
                  <td className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>{c.short_id}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/certificate/${c.unique_id}`} className="icon-btn" title="Ko'rish"><Icon name="eye" size={15} /></Link>
                      {c.pdf_file && (
                        <a href={absUrl(c.pdf_file)} target="_blank" rel="noreferrer" className="icon-btn" title="PDF">
                          <Icon name="download" size={15} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </DashLayout>
  )
}
