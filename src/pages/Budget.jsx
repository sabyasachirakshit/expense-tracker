import { useState, useMemo } from 'react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const _now = new Date()
const _currentMonth = _now.getMonth()
const _currentYear  = _now.getFullYear()

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

function fmtNum(n) {
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function getSpent(records, budget) {
  return records
    .filter((r) => {
      if (r.type !== 'expense') return false
      const d = new Date(r.date)
      if (budget.period === 'monthly') {
        if (d.getFullYear() !== budget.year || d.getMonth() !== budget.month) return false
      } else {
        if (d.getFullYear() !== budget.year) return false
      }
      if (budget.accountId && r.accountId !== budget.accountId) return false
      if (budget.tagId && (!r.tagIds || !r.tagIds.includes(budget.tagId))) return false
      return true
    })
    .reduce((s, r) => s + r.amount, 0)
}

function statusFor(pct) {
  if (pct >= 100) return { label: 'Over budget', textCls: 'text-red-600 dark:text-red-400', barCls: 'bg-red-500', bgCls: 'bg-red-50 dark:bg-red-900/20', borderCls: 'border-red-200 dark:border-red-800', dotCls: 'bg-red-500' }
  if (pct >= 85)  return { label: 'Almost full',  textCls: 'text-orange-600 dark:text-orange-400', barCls: 'bg-orange-400', bgCls: 'bg-orange-50 dark:bg-orange-900/20', borderCls: 'border-orange-200 dark:border-orange-800', dotCls: 'bg-orange-400' }
  if (pct >= 60)  return { label: 'Getting close', textCls: 'text-yellow-600 dark:text-yellow-500', barCls: 'bg-yellow-400', bgCls: 'bg-yellow-50 dark:bg-yellow-900/20', borderCls: 'border-yellow-200 dark:border-yellow-700', dotCls: 'bg-yellow-400' }
  return           { label: 'On track',     textCls: 'text-green-600 dark:text-green-400', barCls: 'bg-green-500', bgCls: 'bg-green-50 dark:bg-green-900/20', borderCls: 'border-green-200 dark:border-green-800', dotCls: 'bg-green-500' }
}

function BudgetFormModal({ initial, accounts, tags, onSave, onClose }) {
  const [label, setLabel]       = useState(initial?.label ?? '')
  const [amount, setAmount]     = useState(initial ? String(initial.amount) : '')
  const [period, setPeriod]     = useState(initial?.period ?? 'monthly')
  const [month, setMonth]       = useState(initial?.month ?? _currentMonth)
  const [year, setYear]         = useState(initial?.year ?? _currentYear)
  const [accountId, setAccountId] = useState(initial?.accountId ?? '')
  const [tagId, setTagId]       = useState(initial?.tagId ?? '')

  const isValid = label.trim().length > 0 && !!parseFloat(amount)

  const handleSave = () => {
    if (!isValid) return
    onSave({
      ...(initial ?? { id: genId() }),
      label: label.trim(),
      amount: parseFloat(amount),
      period,
      month: period === 'monthly' ? month : null,
      year,
      accountId,
      tagId,
    })
  }

  const sc = 'w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const lbl = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5'

  const years = Array.from({ length: 5 }, (_, i) => _currentYear - 1 + i)

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 pt-4 pb-4 shrink-0 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800 dark:text-white">
              {initial ? 'Edit Budget' : 'New Budget'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-lg">×</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Period toggle */}
          <div>
            <span className={lbl}>Period</span>
            <div className="flex gap-2">
              {['monthly', 'yearly'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
                    period === p
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Month + Year */}
          <div className="flex gap-2">
            {period === 'monthly' && (
              <div className="flex-1">
                <span className={lbl}>Month</span>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={sc}>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
            )}
            <div className={period === 'monthly' ? 'w-28' : 'flex-1'}>
              <span className={lbl}>Year</span>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={sc}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Label */}
          <div>
            <span className={lbl}>Budget Name</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Grocery, Entertainment…"
              className={sc}
            />
          </div>

          {/* Amount */}
          <div>
            <span className={lbl}>Budget Amount (₹)</span>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500">
              <span className="text-indigo-500 font-bold text-lg">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                inputMode="decimal"
                className="flex-1 bg-transparent text-gray-800 dark:text-white text-lg font-bold focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Account */}
          <div>
            <span className={lbl}>Account <span className="normal-case font-normal text-gray-400">(optional)</span></span>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={sc}>
              <option value="">All accounts</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Tag / Category */}
          <div>
            <span className={lbl}>Category <span className="normal-case font-normal text-gray-400">(optional)</span></span>
            <select value={tagId} onChange={(e) => setTagId(e.target.value)} className={sc}>
              <option value="">All categories</option>
              {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex-1 py-3.5 rounded-xl bg-indigo-500 text-white font-semibold text-sm disabled:opacity-40 active:bg-indigo-600 transition-colors"
          >
            {initial ? 'Save Changes' : 'Create Budget'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Budget({ data, setData }) {
  const { records = [], accounts = [], tags = [], budgets = [] } = data

  const [viewPeriod, setViewPeriod]   = useState('monthly')
  const [viewMonth, setViewMonth]     = useState(_currentMonth)
  const [viewYear, setViewYear]       = useState(_currentYear)
  const [showForm, setShowForm]       = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [deletingBudget, setDeletingBudget] = useState(null)

  const years = useMemo(() => {
    const ys = new Set(budgets.map((b) => b.year))
    ys.add(_currentYear)
    return [...ys].sort((a, b) => b - a)
  }, [budgets])

  const visibleBudgets = useMemo(() =>
    budgets.filter((b) =>
      b.period === viewPeriod &&
      b.year === viewYear &&
      (viewPeriod === 'yearly' || b.month === viewMonth)
    )
  , [budgets, viewPeriod, viewMonth, viewYear])

  const enriched = useMemo(() =>
    visibleBudgets.map((b) => {
      const spent = getSpent(records, b)
      const pct   = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0
      return { ...b, spent, pct, status: statusFor(pct) }
    })
  , [visibleBudgets, records])

  const totalBudgeted = enriched.reduce((s, b) => s + b.amount, 0)
  const totalSpent    = enriched.reduce((s, b) => s + b.spent, 0)
  const overCount     = enriched.filter((b) => b.pct >= 100).length

  const handleSave = (budgetData) => {
    setData((prev) => ({
      ...prev,
      budgets: editingBudget
        ? (prev.budgets ?? []).map((b) => b.id === budgetData.id ? budgetData : b)
        : [...(prev.budgets ?? []), budgetData],
    }))
    setShowForm(false)
    setEditingBudget(null)
  }

  const handleDelete = (b) => {
    setData((prev) => ({ ...prev, budgets: (prev.budgets ?? []).filter((x) => x.id !== b.id) }))
    setDeletingBudget(null)
  }

  const getAccount = (id) => accounts.find((a) => a.id === id)
  const getTag     = (id) => tags.find((t) => t.id === id)

  const sc = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none'

  const periodLabel = viewPeriod === 'monthly'
    ? `${MONTHS_SHORT[viewMonth]} ${viewYear}`
    : `${viewYear}`

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">

      {/* Fixed header */}
      <div className="shrink-0 bg-white dark:bg-gray-800 px-4 pt-4 pb-3 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-800 dark:text-white">Budget</h1>
          <button
            onClick={() => { setEditingBudget(null); setShowForm(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 text-white text-xs font-semibold active:bg-indigo-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Budget
          </button>
        </div>

        {/* Period toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
          {['monthly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setViewPeriod(p)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                viewPeriod === p
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Date selectors */}
        <div className="flex gap-2">
          {viewPeriod === 'monthly' && (
            <select value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))} className={`flex-1 ${sc}`}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          )}
          <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))} className={`${viewPeriod === 'monthly' ? 'w-24' : 'flex-1'} ${sc}`}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary strip */}
      {enriched.length > 0 && (
        <div className="shrink-0 px-4 pt-3 pb-1">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">Budgeted</p>
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">₹{fmtNum(totalBudgeted)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Spent</p>
              <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-0.5">₹{fmtNum(totalSpent)}</p>
            </div>
            <div className={`rounded-xl px-3 py-2.5 text-center ${overCount > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/20'}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${overCount > 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-400'}`}>
                {overCount > 0 ? 'Over limit' : 'Remaining'}
              </p>
              <p className={`text-sm font-bold mt-0.5 ${overCount > 0 ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-400'}`}>
                {overCount > 0 ? `${overCount} budget${overCount > 1 ? 's' : ''}` : `₹${fmtNum(Math.max(0, totalBudgeted - totalSpent))}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Budget list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-4">
        {enriched.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-indigo-300 dark:text-indigo-600">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No budgets for {periodLabel}</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Create one to start tracking your spending</p>
            </div>
            <button
              onClick={() => { setEditingBudget(null); setShowForm(true) }}
              className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold active:bg-indigo-600"
            >
              Create Budget
            </button>
          </div>
        ) : enriched.map((b) => {
          const acc = b.accountId ? getAccount(b.accountId) : null
          const tag = b.tagId ? getTag(b.tagId) : null
          const barW = `${Math.min(b.pct, 100)}%`
          const remaining = b.amount - b.spent

          return (
            <div key={b.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border ${b.status.borderCls} shadow-sm`}>
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{b.label}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {acc ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{acc.name}</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">All accounts</span>
                    )}
                    {tag ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">All categories</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${b.status.dotCls}`} />
                    <span className={`text-[10px] font-bold ${b.status.textCls}`}>{b.status.label}</span>
                  </div>
                  <button onClick={() => { setEditingBudget(b); setShowForm(true) }} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2.414a2 2 0 01.586-1.414z" />
                    </svg>
                  </button>
                  <button onClick={() => setDeletingBudget(b)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${b.status.barCls}`}
                  style={{ width: barW }}
                />
              </div>

              {/* Stats row */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Spent</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-base font-black ${b.status.textCls}`}>₹{fmtNum(b.spent)}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">/ ₹{fmtNum(b.amount)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 dark:text-gray-500">{b.pct >= 100 ? 'Over by' : 'Left'}</p>
                  <p className={`text-base font-black ${b.pct >= 100 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
                    ₹{fmtNum(Math.abs(remaining))}
                  </p>
                </div>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${b.status.bgCls} border-2 ${b.status.borderCls}`}>
                  <span className={`text-sm font-black ${b.status.textCls}`}>{b.pct}%</span>
                </div>
              </div>

              {/* Over budget alert */}
              {b.pct >= 100 && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-red-500 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                    Over budget by ₹{fmtNum(b.spent - b.amount)}!
                  </p>
                </div>
              )}

              {/* Warning alert */}
              {b.pct >= 85 && b.pct < 100 && (
                <div className="mt-3 flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-orange-500 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                    Only ₹{fmtNum(remaining)} remaining — running low!
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Delete confirmation */}
      {deletingBudget && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/50" onClick={() => setDeletingBudget(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-xs shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 dark:text-white mb-1">Delete Budget?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              "{deletingBudget.label}" will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingBudget(null)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold">Cancel</button>
              <button onClick={() => handleDelete(deletingBudget)} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold active:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit form modal */}
      {showForm && (
        <BudgetFormModal
          initial={editingBudget}
          accounts={accounts}
          tags={tags}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingBudget(null) }}
        />
      )}
    </div>
  )
}
