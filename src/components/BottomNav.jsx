const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4.5 10.5V19a1 1 0 001 1h4.5v-5h4v5H19a1 1 0 001-1v-8.5" />
      </svg>
    ),
  },
  {
    key: 'create',
    label: 'Add Record',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
]

export default function BottomNav({ activePage, setActivePage }) {
  return (
    <nav className="w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-around items-center h-16 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      {NAV_ITEMS.map((item) => {
        const isActive = activePage === item.key
        return (
          <button
            key={item.key}
            onClick={() => setActivePage(item.key)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-150 ${
              isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
