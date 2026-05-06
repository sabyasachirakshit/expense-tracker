import { useState, useMemo } from 'react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtAmt(amount, type) {
  const sign = type === 'expense' ? '−' : type === 'income' ? '+' : ''
  return `${sign}₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function fmtDate(iso) {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function fmtShort(n) {
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export default function Dashboard({ data }) {
  const { records = [], accounts = [], tags = [] } = data
  const now = new Date()
  const [search, setSearch]           = useState('')
  const [filterMonth, setFilterMonth] = useState(now.getMonth())
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
        return (
          d.getMonth() === filterMonth &&
          d.getFullYear() === filterYear &&
          (!search || r.title.toLowerCase().includes(search.toLowerCase()))
        )
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [records, filterMonth, filterYear, search])

  const totalIncome  = useMemo(() => filtered.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0), [filtered])
  const totalExpense = useMemo(() => filtered.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0), [filtered])
  const net          = totalIncome - totalExpense

  const getAccount = (id) => accounts.find((a) => a.id === id)
  const getTags    = (ids = []) => ids.map((id) => tags.find((t) => t.id === id)).filter(Boolean)

  const selectCls = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none'

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Search + filters */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-4 pt-4 pb-3 shadow-sm space-y-2">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-400 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records…"
            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">×</button>
          )}
        </div>
        <div className="flex gap-2">
          <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className={`flex-1 ${selectCls}`}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className={`w-24 ${selectCls}`}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Monthly summary */}
      <div className="px-4 pt-3 pb-1">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Income</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-0.5">₹{fmtShort(totalIncome)}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Expense</p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-0.5">₹{fmtShort(totalExpense)}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">Net</p>
            <p className={`text-sm font-bold mt-0.5 ${net >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-500'}`}>
              {net < 0 ? '−' : ''}₹{fmtShort(Math.abs(net))}
            </p>
          </div>
        </div>
      </div>

      {/* Records */}
      <div className="flex-1 px-4 py-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600 gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 opacity-40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            <p className="text-sm">No records for {MONTHS[filterMonth]} {filterYear}</p>
          </div>
        ) : (
          filtered.map((record) => {
            const acc      = record.type !== 'transfer' ? getAccount(record.accountId) : null
            const fromAcc  = record.type === 'transfer' ? getAccount(record.fromAccountId) : null
            const toAcc    = record.type === 'transfer' ? getAccount(record.toAccountId) : null
            const recTags  = getTags(record.tagIds)

            return (
              <div key={record.id} className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{record.title}</p>
                      {recTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shrink-0"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {record.type === 'transfer'
                        ? `${fromAcc?.name ?? '?'} → ${toAcc?.name ?? '?'}`
                        : (acc?.name ?? '?')}
                      {' · '}{fmtDate(record.date)}
                    </p>
                    {record.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{record.description}</p>
                    )}
                  </div>
                  <p className={`text-sm font-bold shrink-0 ${
                    record.type === 'expense' ? 'text-red-500' :
                    record.type === 'income'  ? 'text-green-500' : 'text-blue-500'
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
