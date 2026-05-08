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
  if (pct >= 100) return { label: 'Over budget',   textCls: 'text-red-600 dark:text-red-400',    barCls: 'bg-red-500',    bgCls: 'bg-red-50 dark:bg-red-900/20',    borderCls: 'border-red-200 dark:border-red-800',    dotCls: 'bg-red-500' }
  if (pct >= 85)  return { label: 'Almost full',    textCls: 'text-orange-600 dark:text-orange-400', barCls: 'bg-orange-400', bgCls: 'bg-orange-50 dark:bg-orange-900/20', borderCls: 'border-orange-200 dark:border-orange-800', dotCls: 'bg-orange-400' }
  if (pct >= 60)  return { label: 'Getting close',  textCls: 'text-yellow-600 dark:text-yellow-500', barCls: 'bg-yellow-400', bgCls: 'bg-yellow-50 dark:bg-yellow-900/20', borderCls: 'border-yellow-200 dark:border-yellow-700', dotCls: 'bg-yellow-400' }
  return           { label: 'On track',             textCls: 'text-green-600 dark:text-green-400',  barCls: 'bg-green-500',  bgCls: 'bg-green-50 dark:bg-green-900/20',  borderCls: 'border-green-200 dark:border-green-800',  dotCls: 'bg-green-500' }
}

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2.414a2 2 0 01.586-1.414z" />
  </svg>
)
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)
const WarnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
)
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
)

function CopyBudgetModal({ budget, subCount, onCopy, onClose }) {
  const isMonthly = budget.period === 'monthly'
  const availableYears = Array.from({ length: 5 }, (_, i) => _currentYear - 1 + i)

  const [targetYear, setTargetYear]       = useState(budget.year)
  const [selectedMonths, setSelectedMonths] = useState(new Set())
  const [selectedYears, setSelectedYears]   = useState(new Set())

  const toggleMonth = (m) => setSelectedMonths((prev) => {
    const n = new Set(prev); n.has(m) ? n.delete(m) : n.add(m); return n
  })
  const toggleYear = (y) => setSelectedYears((prev) => {
    const n = new Set(prev); n.has(y) ? n.delete(y) : n.add(y); return n
  })

  const allMonths = Array.from({ length: 12 }, (_, i) => i)
    .filter((m) => !(m === budget.month && targetYear === budget.year))
  const allNonCurrentMonths = allMonths
  const allSelected = isMonthly
    ? allNonCurrentMonths.every((m) => selectedMonths.has(m))
    : false

  const toggleAll = () => {
    if (allSelected) setSelectedMonths(new Set())
    else setSelectedMonths(new Set(allNonCurrentMonths))
  }

  const count = isMonthly ? selectedMonths.size : selectedYears.size

  const handleConfirm = () => {
    const periods = isMonthly
      ? [...selectedMonths].map((m) => ({ month: m, year: targetYear }))
      : [...selectedYears].map((y) => ({ month: null, year: y }))
    onCopy(periods)
  }

  const sc  = 'w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const lbl = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5'

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-4 pb-4 shrink-0 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white">Copy Budget</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[220px]">"{budget.label}"</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-lg">×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isMonthly ? (
            <>
              <div>
                <span className={lbl}>Copy to year</span>
                <select value={targetYear} onChange={(e) => { setTargetYear(Number(e.target.value)); setSelectedMonths(new Set()) }} className={sc}>
                  {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={lbl.replace('mb-1.5', '')}>Select months</span>
                  <button onClick={toggleAll} className="text-[11px] font-semibold text-indigo-500 dark:text-indigo-400">
                    {allSelected ? 'Clear all' : 'Select all'}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {MONTHS_SHORT.map((m, i) => {
                    const isCurrent = i === budget.month && targetYear === budget.year
                    const isSelected = selectedMonths.has(i)
                    return (
                      <button key={i} disabled={isCurrent} onClick={() => toggleMonth(i)}
                        className={`py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                          isCurrent
                            ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : isSelected
                              ? 'bg-indigo-500 text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-600'
                        }`}
                      >{m}</button>
                    )
                  })}
                </div>
                {selectedMonths.size > 0 && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                    {selectedMonths.size} month{selectedMonths.size > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </>
          ) : (
            <div>
              <span className={lbl}>Select years to copy to</span>
              <div className="flex flex-wrap gap-2">
                {availableYears.map((y) => {
                  const isCurrent = y === budget.year
                  const isSelected = selectedYears.has(y)
                  return (
                    <button key={y} disabled={isCurrent} onClick={() => toggleYear(y)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : isSelected
                            ? 'bg-indigo-500 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >{y}</button>
                  )
                })}
              </div>
            </div>
          )}

          {subCount > 0 && (
            <div className="flex items-start gap-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
              </svg>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed">
                {subCount} sub-budget{subCount > 1 ? 's' : ''} will also be copied to each selected period.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm">Cancel</button>
          <button onClick={handleConfirm} disabled={count === 0}
            className="flex-1 py-3.5 rounded-xl bg-indigo-500 text-white font-semibold text-sm disabled:opacity-40 active:bg-indigo-600 transition-colors"
          >
            Copy to {count > 0 ? count : ''} {isMonthly ? (count === 1 ? 'month' : 'months') : (count === 1 ? 'year' : 'years')}
          </button>
        </div>
      </div>
    </div>
  )
}

function BudgetFormModal({ initial, presetParentId, allBudgets, accounts, tags, onSave, onClose }) {
  const [parentId, setParentId] = useState(initial?.parentId ?? presetParentId ?? '')
  const [label, setLabel]       = useState(initial?.label ?? '')
  const [amount, setAmount]     = useState(initial ? String(initial.amount) : '')
  const [period, setPeriod]     = useState(initial?.period ?? 'monthly')
  const [month, setMonth]       = useState(initial?.month ?? _currentMonth)
  const [year, setYear]         = useState(initial?.year ?? _currentYear)
  const [accountId, setAccountId] = useState(initial?.accountId ?? '')
  const [tagId, setTagId]       = useState(initial?.tagId ?? '')

  const parentBudget = parentId ? allBudgets.find((b) => b.id === parentId) : null

  const effectivePeriod = parentBudget?.period ?? period
  const effectiveMonth  = parentBudget?.month  ?? month
  const effectiveYear   = parentBudget?.year   ?? year

  const parentOptions = allBudgets.filter((b) =>
    !b.parentId &&
    b.id !== initial?.id &&
    b.period === effectivePeriod &&
    b.year === effectiveYear &&
    (effectivePeriod === 'yearly' || b.month === effectiveMonth)
  )

  const siblingTotal   = parentBudget
    ? allBudgets.filter((b) => b.parentId === parentId && b.id !== initial?.id).reduce((s, b) => s + b.amount, 0)
    : 0
  const parentAvailable = parentBudget ? parentBudget.amount - siblingTotal : Infinity
  const amountVal       = parseFloat(amount) || 0
  const exceedsParent   = !!parentBudget && amountVal > parentAvailable

  const isValid = label.trim().length > 0 && !!parseFloat(amount) && !exceedsParent

  const handleSave = () => {
    if (!isValid) return
    onSave({
      ...(initial ?? { id: genId() }),
      label: label.trim(),
      amount: parseFloat(amount),
      period: effectivePeriod,
      month: effectivePeriod === 'monthly' ? effectiveMonth : null,
      year: effectiveYear,
      accountId,
      tagId,
      parentId: parentId || null,
    })
  }

  const sc  = 'w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const lbl = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5'
  const years = Array.from({ length: 5 }, (_, i) => _currentYear - 1 + i)

  const isSubMode = !!parentBudget

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Handle + header */}
        <div className="px-5 pt-4 pb-4 shrink-0 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white">
                {initial ? 'Edit Budget' : isSubMode ? 'New Sub-budget' : 'New Budget'}
              </h2>
              {isSubMode && (
                <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold mt-0.5">
                  Inside: {parentBudget.label}
                </p>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-lg">×</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Parent budget selector — only when not preset */}
          {!presetParentId && (
            <div>
              <span className={lbl}>Parent Budget <span className="normal-case font-normal text-gray-400">(optional — for sub-budgets)</span></span>
              <select
                value={parentId}
                onChange={(e) => { setParentId(e.target.value) }}
                className={sc}
              >
                <option value="">None — top-level budget</option>
                {allBudgets.filter((b) => !b.parentId && b.id !== initial?.id).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label} ({b.period === 'monthly' ? `${MONTHS_SHORT[b.month]} ${b.year}` : b.year})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Period + Date — locked when sub */}
          {isSubMode ? (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-indigo-500 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Period inherited from parent</p>
                <p className="text-xs text-indigo-500 dark:text-indigo-400">
                  {effectivePeriod === 'monthly' ? `${MONTHS[effectiveMonth]} ${effectiveYear}` : effectiveYear}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <span className={lbl}>Period</span>
                <div className="flex gap-2">
                  {['monthly', 'yearly'].map((p) => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
                        period === p ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >{p}</button>
                  ))}
                </div>
              </div>
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
            </>
          )}

          {/* Label */}
          <div>
            <span className={lbl}>Budget Name</span>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Food, Transport, Entertainment…" className={sc} />
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={lbl.replace('mb-1.5', '')}>Budget Amount (₹)</span>
              {parentBudget && (
                <span className={`text-[11px] font-semibold ${
                  parentAvailable <= 0 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  Max: ₹{fmtNum(Math.max(0, parentAvailable))}
                </span>
              )}
            </div>
            <div className={`flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border rounded-xl px-3 py-2.5 focus-within:ring-2 ${
              exceedsParent
                ? 'border-red-400 dark:border-red-600 focus-within:ring-red-400'
                : 'border-gray-200 dark:border-gray-600 focus-within:ring-indigo-500'
            }`}>
              <span className={`font-bold text-lg ${exceedsParent ? 'text-red-500' : 'text-indigo-500'}`}>₹</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0" inputMode="decimal"
                className="flex-1 bg-transparent text-gray-800 dark:text-white text-lg font-bold focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600" />
            </div>
            {exceedsParent && (
              <p className="mt-1.5 text-xs text-red-500 font-semibold">
                Exceeds parent budget — reduce by ₹{fmtNum(amountVal - parentAvailable)}.
              </p>
            )}
            {parentBudget && !exceedsParent && siblingTotal > 0 && amountVal > 0 && (
              <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                ₹{fmtNum(siblingTotal)} already allocated to other sub-budgets.
              </p>
            )}
          </div>

          {/* Account */}
          <div>
            <span className={lbl}>Account <span className="normal-case font-normal text-gray-400">(optional)</span></span>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={sc}>
              <option value="">All accounts</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Category / Tag */}
          <div>
            <span className={lbl}>Category <span className="normal-case font-normal text-gray-400">(optional)</span></span>
            <select value={tagId} onChange={(e) => setTagId(e.target.value)} className={sc}>
              <option value="">All categories</option>
              {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Info note when parent is selected */}
          {parentOptions.length === 0 && !isSubMode && !parentId && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
              💡 Create a top-level budget first, then you can nest sub-budgets inside it.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!isValid}
            className="flex-1 py-3.5 rounded-xl bg-indigo-500 text-white font-semibold text-sm disabled:opacity-40 active:bg-indigo-600 transition-colors"
          >
            {initial ? 'Save Changes' : isSubMode ? 'Add Sub-budget' : 'Create Budget'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Budget({ data, setData }) {
  const { records = [], accounts = [], tags = [], budgets = [] } = data

  const [viewPeriod, setViewPeriod] = useState('monthly')
  const [viewMonth, setViewMonth]   = useState(_currentMonth)
  const [viewYear, setViewYear]     = useState(_currentYear)
  const [showForm, setShowForm]     = useState(false)
  const [editingBudget, setEditingBudget]   = useState(null)
  const [presetParentId, setPresetParentId] = useState(null)
  const [deletingBudget, setDeletingBudget] = useState(null)
  const [copyingBudget, setCopyingBudget]   = useState(null)

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

  const rootBudgets = useMemo(() => visibleBudgets.filter((b) => !b.parentId), [visibleBudgets])
  const subBudgets  = useMemo(() => visibleBudgets.filter((b) => !!b.parentId), [visibleBudgets])

  const enrichedRoot = useMemo(() =>
    rootBudgets.map((root) => {
      const spent = getSpent(records, root)
      const pct   = root.amount > 0 ? Math.round((spent / root.amount) * 100) : 0
      const subs  = subBudgets
        .filter((s) => s.parentId === root.id)
        .map((s) => {
          const ss  = getSpent(records, s)
          const sp  = s.amount > 0 ? Math.round((ss / s.amount) * 100) : 0
          return { ...s, spent: ss, pct: sp, status: statusFor(sp) }
        })
      return { ...root, spent, pct, status: statusFor(pct), subs }
    })
  , [rootBudgets, subBudgets, records])

  const totalBudgeted = enrichedRoot.reduce((s, b) => s + b.amount, 0)
  const totalSpent    = enrichedRoot.reduce((s, b) => s + b.spent, 0)
  const overCount     = enrichedRoot.filter((b) => b.pct >= 100).length

  const openNew   = ()   => { setEditingBudget(null); setPresetParentId(null);    setShowForm(true) }
  const openAddSub = (id) => { setEditingBudget(null); setPresetParentId(id);     setShowForm(true) }
  const openEdit  = (b)  => { setEditingBudget(b);    setPresetParentId(null);    setShowForm(true) }
  const closeForm = ()   => { setShowForm(false);      setEditingBudget(null);     setPresetParentId(null) }

  const handleSave = (budgetData) => {
    setData((prev) => ({
      ...prev,
      budgets: editingBudget
        ? (prev.budgets ?? []).map((b) => b.id === budgetData.id ? budgetData : b)
        : [...(prev.budgets ?? []), budgetData],
    }))
    closeForm()
  }

  const handleDelete = (b) => {
    setData((prev) => ({
      ...prev,
      budgets: (prev.budgets ?? []).filter((x) => x.id !== b.id && x.parentId !== b.id),
    }))
    setDeletingBudget(null)
  }

  const handleCopy = (periods) => {
    const rawBudget = budgets.find((b) => b.id === copyingBudget.id)
    const rawSubs   = budgets.filter((b) => b.parentId === copyingBudget.id)
    const newEntries = []
    for (const { month, year } of periods) {
      const newRootId = genId()
      newEntries.push({ ...rawBudget, id: newRootId, month, year })
      for (const sub of rawSubs) {
        newEntries.push({ ...sub, id: genId(), parentId: newRootId, month, year })
      }
    }
    setData((prev) => ({ ...prev, budgets: [...(prev.budgets ?? []), ...newEntries] }))
    setCopyingBudget(null)
  }

  const getAccount = (id) => accounts.find((a) => a.id === id)
  const getTag     = (id) => tags.find((t) => t.id === id)

  const sc = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none'
  const periodLabel = viewPeriod === 'monthly' ? `${MONTHS_SHORT[viewMonth]} ${viewYear}` : `${viewYear}`

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">

      {/* Fixed header */}
      <div className="shrink-0 bg-white dark:bg-gray-800 px-4 pt-4 pb-3 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-800 dark:text-white">Budget</h1>
          <button onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 text-white text-xs font-semibold active:bg-indigo-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Budget
          </button>
        </div>
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
          {['monthly', 'yearly'].map((p) => (
            <button key={p} onClick={() => setViewPeriod(p)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                viewPeriod === p ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}
            >{p}</button>
          ))}
        </div>
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

      {/* Summary strip — only root totals */}
      {enrichedRoot.length > 0 && (
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
        {enrichedRoot.length === 0 ? (
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
            <button onClick={openNew} className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold active:bg-indigo-600">
              Create Budget
            </button>
          </div>
        ) : enrichedRoot.map((b) => {
          const acc = b.accountId ? getAccount(b.accountId) : null
          const tag = b.tagId ? getTag(b.tagId) : null
          const remaining = b.amount - b.spent

          return (
            <div key={b.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border ${b.status.borderCls} shadow-sm`}>

              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{b.label}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      {acc ? acc.name : 'All accounts'}
                    </span>
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
                  <button onClick={() => setCopyingBudget(b)} className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-400" title="Copy to other months"><CopyIcon /></button>
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400"><PencilIcon /></button>
                  <button onClick={() => setDeletingBudget(b)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-400"><TrashIcon /></button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all duration-500 ${b.status.barCls}`} style={{ width: `${Math.min(b.pct, 100)}%` }} />
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

              {/* Alerts */}
              {b.pct >= 100 && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                  <WarnIcon />
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold">Over budget by ₹{fmtNum(b.spent - b.amount)}!</p>
                </div>
              )}
              {b.pct >= 85 && b.pct < 100 && (
                <div className="mt-3 flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3 py-2">
                  <WarnIcon />
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Only ₹{fmtNum(remaining)} remaining — running low!</p>
                </div>
              )}

              {/* ── Sub-budgets ── */}
              {b.subs.length > 0 && (
                <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2.5">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Sub-budgets ({b.subs.length})
                  </p>
                  {b.subs.map((sub) => {
                    const subTag = sub.tagId ? getTag(sub.tagId) : null
                    const subAcc = sub.accountId ? getAccount(sub.accountId) : null
                    return (
                      <div key={sub.id} className={`bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border ${sub.status.borderCls}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {subTag ? (
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: subTag.color }} />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500 shrink-0" />
                            )}
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{sub.label}</p>
                            {subTag && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-semibold shrink-0" style={{ backgroundColor: subTag.color }}>{subTag.name}</span>
                            )}
                            {subAcc && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 shrink-0">{subAcc.name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className={`text-[10px] font-black ${sub.status.textCls}`}>{sub.pct}%</span>
                            <button onClick={() => openEdit(sub)} className="p-1 rounded-lg bg-white dark:bg-gray-700 text-gray-400 shadow-sm"><PencilIcon /></button>
                            <button onClick={() => setDeletingBudget(sub)} className="p-1 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-400 shadow-sm"><TrashIcon /></button>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-1.5">
                          <div className={`h-full rounded-full transition-all duration-500 ${sub.status.barCls}`} style={{ width: `${Math.min(sub.pct, 100)}%` }} />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">₹{fmtNum(sub.spent)} spent</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {sub.pct >= 100
                              ? <span className="text-red-500 font-semibold">over by ₹{fmtNum(sub.spent - sub.amount)}</span>
                              : `₹${fmtNum(sub.amount - sub.spent)} left of ₹${fmtNum(sub.amount)}`
                            }
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add sub-budget */}
              <button
                onClick={() => openAddSub(b.id)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-400 dark:text-gray-500 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add sub-budget
              </button>
            </div>
          )
        })}
      </div>

      {/* Delete confirmation */}
      {deletingBudget && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/50" onClick={() => setDeletingBudget(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-xs shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 dark:text-white mb-1">Delete Budget?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
              "{deletingBudget.label}" will be permanently deleted.
            </p>
            {!deletingBudget.parentId && enrichedRoot.find((r) => r.id === deletingBudget.id)?.subs.length > 0 && (
              <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-4">
                ⚠️ All sub-budgets inside it will also be deleted.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setDeletingBudget(null)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold">Cancel</button>
              <button onClick={() => handleDelete(deletingBudget)} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold active:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Copy modal */}
      {copyingBudget && (
        <CopyBudgetModal
          budget={copyingBudget}
          subCount={budgets.filter((b) => b.parentId === copyingBudget.id).length}
          onCopy={handleCopy}
          onClose={() => setCopyingBudget(null)}
        />
      )}

      {/* Create / Edit form */}
      {showForm && (
        <BudgetFormModal
          initial={editingBudget}
          presetParentId={presetParentId}
          allBudgets={budgets}
          accounts={accounts}
          tags={tags}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
