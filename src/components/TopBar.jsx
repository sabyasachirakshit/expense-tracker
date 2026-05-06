export default function TopBar({ accounts, onManage, isDark, onToggleDark }) {
  const total = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
  const formatted = total.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div className="bg-indigo-600 text-white px-4 h-14 flex items-center justify-between shrink-0 shadow-md">
      <div className="flex items-center gap-2">
        <span className="font-bold text-base tracking-tight">Expense Tracker</span>
        <button
          onClick={onToggleDark}
          className="p-1.5 rounded-full bg-white/10 active:bg-white/25 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <button
        onClick={onManage}
        className="flex items-center gap-2 bg-white/15 active:bg-white/25 transition-colors rounded-full pl-3 pr-2.5 py-1.5"
        aria-label="Manage accounts"
      >
        <span className="text-sm font-semibold text-white">₹ {formatted}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-indigo-200">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}
