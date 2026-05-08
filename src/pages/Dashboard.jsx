import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const COLORS = { income: '#22c55e', expense: '#ef4444' }

function fmtShort(n) {
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export default function Dashboard({ data }) {
  const { records = [], accounts = [], tags = [] } = data
  const now = new Date()
  const [filterMonth, setFilterMonth]   = useState(-1)
  const [filterYear, setFilterYear]     = useState(now.getFullYear())
  const [filterAccount, setFilterAccount] = useState('')
  const [filterTags, setFilterTags]     = useState([])

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

  const selectCls = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none'

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
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
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
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
              <Bar dataKey="income" fill={COLORS.income} />
              <Bar dataKey="expense" fill={COLORS.expense} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
