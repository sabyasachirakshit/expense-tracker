import { useState, useMemo } from 'react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtAmt(amount, type) {
  const sign = type === 'expense' ? '−' : type === 'income' ? '+' : '⇄'
  return `${sign}₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function fmtDate(iso) {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const TYPE_BADGE = {
  expense:  'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  income:   'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  transfer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
}

export default function Passbook({ data }) {
  const { records = [], accounts = [], tags = [] } = data
  const now = new Date()

  const [search, setSearch]           = useState('')
  const [filterMonth, setFilterMonth] = useState(-1)
  const [filterYear, setFilterYear]   = useState(now.getFullYear())

  const years = useMemo(() => {
    const ys = new Set(records.map((r) => new Date(r.date).getFullYear()))
    ys.add(new Date().getFullYear())
    return [...ys].sort((a, b) => b - a)
  }, [records])

  const filtered = useMemo(() => {
    return records
      .filter((r) => {
        const d = new Date(r.date)
        const matchMonth = filterMonth === -1 || d.getMonth() === filterMonth
        const matchYear  = d.getFullYear() === filterYear
        const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase())
        return matchMonth && matchYear && matchSearch
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [records, filterMonth, filterYear, search])

  const getAccount = (id) => accounts.find((a) => a.id === id)
  const getTags    = (ids = []) => ids.map((id) => tags.find((t) => t.id === id)).filter(Boolean)

  const selectCls = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none'

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col overflow-x-hidden">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-4 pt-4 pb-3 shadow-sm space-y-2">
        <h1 className="text-base font-bold text-gray-800 dark:text-white">Passbook</h1>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-400 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">×</button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className={`flex-1 ${selectCls}`}
          >
            <option value={-1}>All months</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className={`w-24 ${selectCls}`}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Count */}
      {filtered.length > 0 && (
        <p className="px-4 pt-3 pb-1 text-xs text-gray-400 dark:text-gray-500">
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* List */}
      <div className="flex-1 px-4 pb-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600 gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 opacity-40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z" />
            </svg>
            <p className="text-sm">No transactions found</p>
          </div>
        ) : (
          filtered.map((record) => {
            const acc     = record.type !== 'transfer' ? getAccount(record.accountId) : null
            const fromAcc = record.type === 'transfer'  ? getAccount(record.fromAccountId) : null
            const toAcc   = record.type === 'transfer'  ? getAccount(record.toAccountId) : null
            const recTags = getTags(record.tagIds)

            return (
              <div key={record.id} className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${TYPE_BADGE[record.type]}`}>
                        {record.type}
                      </span>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{record.title}</p>
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {record.type === 'transfer'
                        ? `${fromAcc?.name ?? '?'} → ${toAcc?.name ?? '?'}`
                        : (acc?.name ?? '?')}
                    </p>

                    <p className="text-xs text-gray-400 dark:text-gray-500">{fmtDate(record.date)}</p>

                    {record.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{record.description}</p>
                    )}

                    {recTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {recTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className={`text-sm font-bold shrink-0 ${
                    record.type === 'expense'  ? 'text-red-500'   :
                    record.type === 'income'   ? 'text-green-500' : 'text-blue-500'
                  }`}>
                    {fmtAmt(record.amount, record.type)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
