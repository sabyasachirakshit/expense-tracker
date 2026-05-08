import { useState, useMemo, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const COLORS = { income: '#22c55e', expense: '#ef4444' }

function fmtShort(n) {
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function budgetBarColor(pct) {
  if (pct >= 100) return { bar: 'bg-red-500',    text: 'text-red-600 dark:text-red-400' }
  if (pct >= 85)  return { bar: 'bg-orange-400',  text: 'text-orange-600 dark:text-orange-400' }
  if (pct >= 60)  return { bar: 'bg-yellow-400',  text: 'text-yellow-600 dark:text-yellow-500' }
  return           { bar: 'bg-green-500',   text: 'text-green-600 dark:text-green-400' }
}

export default function Dashboard({ data }) {
  const { records = [], accounts = [], tags = [], budgets = [] } = data
  const isDark = data.settings?.darkMode ?? false
  const tickFill = isDark ? '#9ca3af' : '#6b7280'
  const now = new Date()
  const [filterMonth, setFilterMonth]   = useState(() => {
    const v = localStorage.getItem('dash_filterMonth')
    return v !== null ? Number(v) : -1
  })
  const [filterYear, setFilterYear]     = useState(() => {
    const v = localStorage.getItem('dash_filterYear')
    return v !== null ? Number(v) : now.getFullYear()
  })
  const [filterAccount, setFilterAccount] = useState(() =>
    localStorage.getItem('dash_filterAccount') ?? ''
  )
  const [filterTags, setFilterTags]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('dash_filterTags') ?? '[]') }
    catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('dash_filterMonth',   String(filterMonth))
    localStorage.setItem('dash_filterYear',    String(filterYear))
    localStorage.setItem('dash_filterAccount', filterAccount)
    localStorage.setItem('dash_filterTags',    JSON.stringify(filterTags))
  }, [filterMonth, filterYear, filterAccount, filterTags])

  const years = useMemo(() => {
    const ys = new Set(records.map((r) => new Date(r.date).getFullYear()))
    ys.add(new Date().getFullYear())
    return [...ys].sort((a, b) => b - a)
  }, [records])

  const filteredRecords = useMemo(() => records.filter((r) => {
    const d = new Date(r.date)
    const matchYear = d.getFullYear() === filterYear
    const matchMonth = filterMonth === -1 || d.getMonth() === filterMonth
    const matchAccount = !filterAccount || (
      r.type === 'transfer'
        ? r.fromAccountId === filterAccount || r.toAccountId === filterAccount
        : r.accountId === filterAccount
    )
    const matchTags = filterTags.length === 0 || (r.tagIds && r.tagIds.some((t) => filterTags.includes(t)))
    return matchYear && matchMonth && matchAccount && matchTags
  }), [records, filterYear, filterMonth, filterAccount, filterTags])

  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: MONTHS[i],
      income: 0,
      expense: 0,
    }))
    records
      .filter((r) => new Date(r.date).getFullYear() === filterYear)
      .forEach((r) => {
        const m = new Date(r.date).getMonth()
        if (r.type === 'income') months[m].income += r.amount
        if (r.type === 'expense') months[m].expense += r.amount
      })
    return months
  }, [records, filterYear])

  const totalIncome  = useMemo(() => filteredRecords.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0), [filteredRecords])
  const totalExpense = useMemo(() => filteredRecords.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0), [filteredRecords])
  const net = totalIncome - totalExpense

  const pieData = useMemo(() => [
    { name: 'Income', value: totalIncome },
    { name: 'Expense', value: totalExpense },
  ], [totalIncome, totalExpense])

  const budgetOverview = useMemo(() => {
    const rootBudgets = budgets.filter((b) => !b.parentId)
    const relevant = filterMonth !== -1
      ? rootBudgets.filter((b) => b.period === 'monthly' && b.year === filterYear && b.month === filterMonth)
      : rootBudgets.filter((b) => b.period === 'yearly'  && b.year === filterYear)
    return relevant.map((b) => {
      const spent = records
        .filter((r) => {
          if (r.type !== 'expense') return false
          const d = new Date(r.date)
          if (b.period === 'monthly') {
            if (d.getFullYear() !== b.year || d.getMonth() !== b.month) return false
          } else {
            if (d.getFullYear() !== b.year) return false
          }
          if (b.accountId && r.accountId !== b.accountId) return false
          if (b.tagId && (!r.tagIds || !r.tagIds.includes(b.tagId))) return false
          return true
        })
        .reduce((s, r) => s + r.amount, 0)
      const pct      = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0
      const subCount = budgets.filter((s) => s.parentId === b.id).length
      return { ...b, spent, pct, subCount }
    })
  }, [budgets, records, filterMonth, filterYear])

  const bOverTotal  = budgetOverview.reduce((s, b) => s + b.amount, 0)
  const bOverSpent  = budgetOverview.reduce((s, b) => s + b.spent,  0)
  const bOverCount  = budgetOverview.filter((b) => b.pct >= 100).length

  const selectCls = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none'

  const tooltipStyle = {
    backgroundColor: isDark ? '#1f2937' : '#fff',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    borderRadius: '12px',
  }
  const tooltipLabelStyle = { color: isDark ? '#f3f4f6' : '#111827', fontWeight: 600, fontSize: 11 }
  const tooltipItemStyle  = { color: isDark ? '#d1d5db' : '#374151', fontSize: 12 }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="shrink-0 bg-white dark:bg-gray-800 px-4 pt-4 pb-3 shadow-sm space-y-2">
        <h1 className="text-base font-bold text-gray-800 dark:text-white">Dashboard</h1>
        <div className="flex gap-2">
          <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className={`flex-1 min-w-0 ${selectCls}`}>
            <option value="">All accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className={`w-20 ${selectCls}`}>
            <option value={-1}>All</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m.slice(0, 3)}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className={`w-20 ${selectCls}`}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {tags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setFilterTags([])}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filterTags.length === 0
                  ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              All tags
            </button>
            {tags.map((tag) => {
              const active = filterTags.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => setFilterTags((prev) =>
                    active ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                  )}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                  style={active ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">Income</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-0.5">₹{fmtShort(totalIncome)}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">Expense</p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-0.5">₹{fmtShort(totalExpense)}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Net</p>
            <p className={`text-sm font-bold mt-0.5 ${net >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-500'}`}>
              {net < 0 ? '−' : ''}₹{fmtShort(Math.abs(net))}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

        {/* Budget Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Budget Overview</h3>
            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              {filterMonth !== -1 ? `${MONTHS[filterMonth]} ${filterYear}` : `${filterYear} · yearly`}
            </span>
          </div>

          {filterMonth === -1 && budgetOverview.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">
              Select a month above to see monthly budget progress.
            </p>
          ) : budgetOverview.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">
              No budgets set for this period — create one in the Budget tab.
            </p>
          ) : (
            <>
              {/* Summary row */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-2.5 py-2 text-center">
                  <p className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Budgeted</p>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">₹{fmtShort(bOverTotal)}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl px-2.5 py-2 text-center">
                  <p className="text-[9px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Spent</p>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-0.5">₹{fmtShort(bOverSpent)}</p>
                </div>
                <div className={`rounded-xl px-2.5 py-2 text-center ${
                  bOverCount > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/20'
                }`}>
                  <p className={`text-[9px] font-semibold uppercase tracking-wide ${
                    bOverCount > 0 ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-400'
                  }`}>{bOverCount > 0 ? 'Over limit' : 'Left'}</p>
                  <p className={`text-xs font-bold mt-0.5 ${
                    bOverCount > 0 ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {bOverCount > 0
                      ? `${bOverCount} budget${bOverCount > 1 ? 's' : ''}`
                      : `₹${fmtShort(Math.max(0, bOverTotal - bOverSpent))}`
                    }
                  </p>
                </div>
              </div>

              {/* Per-budget rows */}
              <div className="space-y-3">
                {budgetOverview.map((b) => {
                  const c = budgetBarColor(b.pct)
                  const tag = b.tagId ? tags.find((t) => t.id === b.tagId) : null
                  const acc = b.accountId ? accounts.find((a) => a.id === b.accountId) : null
                  return (
                    <div key={b.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {tag && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />}
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{b.label}</p>
                          {acc && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 shrink-0">{acc.name}</span>}
                          {b.subCount > 0 && <span className="text-[9px] text-gray-400 dark:text-gray-500 shrink-0">+{b.subCount} sub</span>}
                        </div>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <span className={`text-[10px] font-bold ${c.text}`}>{b.pct}%</span>
                          {b.pct >= 100 && (
                            <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">Over!</span>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${c.bar}`} style={{ width: `${Math.min(b.pct, 100)}%` }} />
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">₹{fmtShort(b.spent)} spent</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">of ₹{fmtShort(b.amount)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Donut chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Income vs Expense</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                <Cell fill={COLORS.income} />
                <Cell fill={COLORS.expense} />
              </Pie>
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.income }} />
              <span className="text-xs text-gray-600 dark:text-gray-400">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.expense }} />
              <span className="text-xs text-gray-600 dark:text-gray-400">Expense</span>
            </div>
          </div>
        </div>

        {/* Monthly trend line chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickFill }} stroke={isDark ? '#374151' : '#e5e7eb'} />
              <YAxis tick={{ fontSize: 11, fill: tickFill }} stroke={isDark ? '#374151' : '#e5e7eb'} />
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
              <Line type="monotone" dataKey="income" stroke={COLORS.income} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="expense" stroke={COLORS.expense} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly bar chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Monthly Comparison</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickFill }} stroke={isDark ? '#374151' : '#e5e7eb'} />
              <YAxis tick={{ fontSize: 11, fill: tickFill }} stroke={isDark ? '#374151' : '#e5e7eb'} />
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
              <Bar dataKey="income" fill={COLORS.income} />
              <Bar dataKey="expense" fill={COLORS.expense} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
