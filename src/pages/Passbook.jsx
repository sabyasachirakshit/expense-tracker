import { useState, useMemo, useRef, useEffect } from 'react'
import EditRecordModal from '../components/EditRecordModal'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const TYPE_BADGE = {
  expense:    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  income:     'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  transfer:   'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  adjustment: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
}

const TYPE_FILTERS = [
  { key: null,       label: 'All',        active: 'bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900' },
  { key: 'expense',  label: 'Expense',    active: 'bg-red-500 text-white' },
  { key: 'income',   label: 'Income',     active: 'bg-green-500 text-white' },
  { key: 'transfer', label: 'Transfer',   active: 'bg-blue-500 text-white' },
  { key: 'adjustment', label: 'Adjustment', active: 'bg-purple-500 text-white' },
]

function fmtAmt(amount, type) {
  const sign = type === 'expense' ? '−' : type === 'income' ? '+' : type === 'adjustment' ? '±' : '⇄'
  return `${sign}₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function fmtDate(iso) {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function ScrollablePills({ children, className = '' }) {
  const ref = useRef(null)
  const [canLeft, setCanLeft]   = useState(false)
  const [canRight, setCanRight] = useState(false)

  const check = () => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 2)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 140, behavior: 'smooth' })

  return (
    <div className={`relative ${className}`}>
      {canLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 flex items-center bg-gradient-to-r from-white dark:from-gray-800 to-transparent pointer-events-none">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => scroll(-1)}
            className="pointer-events-auto ml-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow text-gray-500 dark:text-gray-300 text-sm font-bold leading-none"
          >‹</button>
        </div>
      )}
      <div
        ref={ref}
        onScroll={check}
        className="flex gap-2 overflow-x-auto pb-0.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
      {canRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 flex items-center justify-end bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => scroll(1)}
            className="pointer-events-auto mr-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow text-gray-500 dark:text-gray-300 text-sm font-bold leading-none"
          >›</button>
        </div>
      )}
    </div>
  )
}

function fmtShort(n) {
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function reverseBalance(accs, r) {
  return accs.map((a) => {
    if (r.type === 'expense'  && a.id === r.accountId)     return { ...a, balance: a.balance + r.amount }
    if (r.type === 'income'   && a.id === r.accountId)     return { ...a, balance: a.balance - r.amount }
    if (r.type === 'transfer' && a.id === r.fromAccountId) return { ...a, balance: a.balance + r.amount }
    if (r.type === 'transfer' && a.id === r.toAccountId)   return { ...a, balance: a.balance - r.amount }
    return a
  })
}

function applyBalance(accs, r) {
  return accs.map((a) => {
    if (r.type === 'expense'  && a.id === r.accountId)     return { ...a, balance: a.balance - r.amount }
    if (r.type === 'income'   && a.id === r.accountId)     return { ...a, balance: a.balance + r.amount }
    if (r.type === 'transfer' && a.id === r.fromAccountId) return { ...a, balance: a.balance - r.amount }
    if (r.type === 'transfer' && a.id === r.toAccountId)   return { ...a, balance: a.balance + r.amount }
    return a
  })
}

export default function Passbook({ data, setData }) {
  const { records = [], accounts = [], tags = [] } = data
  const now = new Date()
  const pf  = data.settings?.passbookFilters ?? {}

  const [search, setSearch]               = useState('')
  const [filterAccount, setFilterAccount] = useState(pf.account ?? '')
  const [filterMonth, setFilterMonth]     = useState(pf.month  ?? -1)
  const [filterYear, setFilterYear]       = useState(pf.year   ?? now.getFullYear())
  const [filterType, setFilterType]       = useState(pf.type   ?? null)
  const [filterTags, setFilterTags]       = useState(pf.tags ?? [])

  const [editingRecord, setEditingRecord] = useState(null)
  const [deleteRecord, setDeleteRecord]   = useState(null)
  const [descRecord, setDescRecord]       = useState(null)

  const years = useMemo(() => {
    const ys = new Set(records.map((r) => new Date(r.date).getFullYear()))
    ys.add(new Date().getFullYear())
    return [...ys].sort((a, b) => b - a)
  }, [records])

  const baseFiltered = useMemo(() => records.filter((r) => {
    const d = new Date(r.date)
    if (filterAccount) {
      const inAcc = r.type !== 'transfer'
        ? r.accountId === filterAccount
        : r.fromAccountId === filterAccount || r.toAccountId === filterAccount
      if (!inAcc) return false
    }
    if (filterMonth !== -1 && d.getMonth() !== filterMonth) return false
    if (d.getFullYear() !== filterYear) return false
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTags.length > 0 && (!r.tagIds || !r.tagIds.some((tid) => filterTags.includes(tid)))) return false
    return true
  }), [records, filterAccount, filterMonth, filterYear, search, filterTags])

  const filtered = useMemo(() =>
    [...baseFiltered]
      .filter((r) => !filterType || r.type === filterType)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  , [baseFiltered, filterType])

  const totalIncome  = useMemo(() => baseFiltered.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0), [baseFiltered])
  const totalExpense = useMemo(() => baseFiltered.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0), [baseFiltered])
  const net = totalIncome - totalExpense

  const getAccount = (id) => accounts.find((a) => a.id === id)
  const getTags    = (ids = []) => ids.map((id) => tags.find((t) => t.id === id)).filter(Boolean)

  const handleDelete = (record) => {
    setData((prev) => ({
      ...prev,
      records: prev.records.filter((r) => r.id !== record.id),
      accounts: reverseBalance(prev.accounts, record),
    }))
    setDeleteRecord(null)
  }

  const handleEdit = (oldRecord, updatedRecord) => {
    setData((prev) => ({
      ...prev,
      records: prev.records.map((r) => r.id === updatedRecord.id ? updatedRecord : r),
      accounts: applyBalance(reverseBalance(prev.accounts, oldRecord), updatedRecord),
    }))
    setEditingRecord(null)
  }

  const saveFilter = (updates) =>
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        passbookFilters: { ...(prev.settings?.passbookFilters ?? {}), ...updates },
      },
    }))

  const sc = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none'

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">

      {/* Fixed header */}
      <div className="shrink-0 bg-white dark:bg-gray-800 px-4 pt-4 pb-3 shadow-sm space-y-2">
        <h1 className="text-base font-bold text-gray-800 dark:text-white">Passbook</h1>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-400 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions…" className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none" />
          {search && <button onClick={() => setSearch('')} className="text-gray-400 text-lg leading-none">×</button>}
        </div>

        {/* Account + Month + Year */}
        <div className="flex gap-2">
          <select value={filterAccount} onChange={(e) => { setFilterAccount(e.target.value); saveFilter({ account: e.target.value }) }} className={`flex-1 min-w-0 ${sc}`}>
            <option value="">All accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filterMonth} onChange={(e) => { const v = Number(e.target.value); setFilterMonth(v); saveFilter({ month: v }) }} className={`w-20 ${sc}`}>
            <option value={-1}>All</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => { const v = Number(e.target.value); setFilterYear(v); saveFilter({ year: v }) }} className={`w-20 ${sc}`}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Type filter pills */}
        <ScrollablePills>
          {TYPE_FILTERS.map((f) => (
            <button
              key={String(f.key)}
              onClick={() => { setFilterType(f.key); saveFilter({ type: f.key }) }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filterType === f.key ? f.active : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </ScrollablePills>

        {/* Tag filter pills */}
        {filterType !== 'transfer' && tags.length > 0 && (
          <ScrollablePills className="mb-2">
            <button
              onClick={() => { setFilterTags([]); saveFilter({ tags: [] }) }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filterTags.length === 0 ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              All tags
            </button>
            {tags.map((tag) => {
              const active = filterTags.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    const next = active
                      ? filterTags.filter((t) => t !== tag.id)
                      : [...filterTags, tag.id]
                    setFilterTags(next)
                    saveFilter({ tags: next })
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active ? 'text-white ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                  style={active ? { backgroundColor: tag.color, ringColor: tag.color } : {}}
                >
                  {tag.name}
                </button>
              )
            })}
          </ScrollablePills>
        )}
      </div>

      {/* Metrics */}
      <div className="shrink-0 px-4 pt-3 pb-1">
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

      {/* Count (fixed) */}
      {filtered.length > 0 && (
        <div className="px-4 pt-2 pb-1.5">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* List (scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600 gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 opacity-40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z" />
            </svg>
            <p className="text-sm">No transactions found</p>
          </div>
        ) : filtered.map((record) => {
          const acc     = record.type !== 'transfer' ? getAccount(record.accountId) : null
          const fromAcc = record.type === 'transfer'  ? getAccount(record.fromAccountId) : null
          const toAcc   = record.type === 'transfer'  ? getAccount(record.toAccountId) : null
          const recTags = getTags(record.tagIds)

          return (
            <div key={record.id} className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3.5">
              <div className="flex items-start gap-3">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${TYPE_BADGE[record.type]}`}>
                      {record.type}
                    </span>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{record.title}</p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {record.type === 'transfer' ? `${fromAcc?.name ?? '?'} → ${toAcc?.name ?? '?'}` : (acc?.name ?? '?')}
                    {' · '}{fmtDate(record.date)}
                  </p>
                  {record.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{record.description}</p>
                  )}
                  {recTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {recTags.map((tag) => (
                        <span key={tag.id} className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: amount + actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className={`text-sm font-bold ${
                    record.type === 'expense' ? 'text-red-500' :
                    record.type === 'income'  ? 'text-green-500' :
                    record.type === 'adjustment' ? 'text-purple-500' :
                    'text-blue-500'
                  }`}>
                    {fmtAmt(record.amount, record.type)}
                  </p>
                  <div className="flex items-center gap-1">
                    {record.description && (
                      <button onClick={() => setDescRecord(record)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500" title="View description">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}
                    <button onClick={() => setEditingRecord(record)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500" title="Edit">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2.414a2 2 0 01.586-1.414z" />
                      </svg>
                    </button>
                    <button onClick={() => setDeleteRecord(record)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-400" title="Delete">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        </div>
      </div>

      {/* Description popup */}
      {descRecord && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/50" onClick={() => setDescRecord(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-gray-800 dark:text-white text-sm mb-3">{descRecord.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{descRecord.description}</p>
            <button onClick={() => setDescRecord(null)} className="mt-4 w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteRecord && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/50" onClick={() => setDeleteRecord(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-xs shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 dark:text-white mb-1">Delete Record?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              "{deleteRecord.title}" will be removed and account balance reversed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteRecord(null)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold">Cancel</button>
              <button onClick={() => handleDelete(deleteRecord)} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold active:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          accounts={accounts}
          tags={tags}
          onSave={handleEdit}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  )
}
