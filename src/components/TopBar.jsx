export default function TopBar({ accounts, onManage }) {
  const total = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
  const formatted = total.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div className="bg-indigo-600 text-white px-4 h-14 flex items-center justify-between shrink-0 shadow-md">
      <span className="font-bold text-base tracking-tight">Expense Tracker</span>

      <button
        onClick={onManage}
        className="flex items-center gap-2 bg-white/15 active:bg-white/25 transition-colors rounded-full pl-3 pr-2.5 py-1.5"
        aria-label="Manage accounts"
      >
        <span className="text-sm font-semibold text-white">₹ {formatted}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-3.5 h-3.5 text-indigo-200"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}
