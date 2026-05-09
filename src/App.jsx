import { useState, useRef } from 'react'
import Dashboard from './pages/Dashboard'
import CreateRecord from './pages/CreateRecord'
import Passbook from './pages/Passbook'
import Budget from './pages/Budget'
import BottomNav from './components/BottomNav'
import TopBar from './components/TopBar'
import AccountsModal from './components/AccountsModal'
import PinScreen from './components/PinScreen'
import { useExpenseStore } from './hooks/useExpenseStore'

const PAGES = {
  dashboard: Dashboard,
  passbook: Passbook,
  create: CreateRecord,
  budget: Budget,
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [showAccounts, setShowAccounts] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [data, setData] = useExpenseStore()

  const PageComponent = PAGES[activePage] ?? Dashboard
  const isDark = data.settings?.darkMode ?? false
  const hasPin = !!data.settings?.pin

  const handleSaveAccounts = (updatedAccounts) => {
    setData((prev) => {
      const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
      const adjustments = []

      updatedAccounts.forEach((acc) => {
        const old = prev.accounts.find((a) => a.id === acc.id)
        if (!old || old.balance === acc.balance) return
        const diff = acc.balance - old.balance
        adjustments.push({
          id: genId(),
          type: 'adjustment',
          title: 'Balance Adjustment',
          description: `${acc.name}: ₹${old.balance} → ₹${acc.balance}`,
          amount: Math.abs(diff),
          date: new Date().toISOString(),
          tagIds: [],
          accountId: acc.id,
          fromAccountId: null,
          toAccountId: null,
        })
      })

      return {
        ...prev,
        accounts: updatedAccounts,
        records: [...adjustments, ...prev.records],
      }
    })
  }

  const fileInputRef = useRef(null)

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `expense-tracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result)
        if (typeof parsed !== 'object' || !Array.isArray(parsed.accounts) || !Array.isArray(parsed.records)) {
          alert('Invalid backup file — missing accounts or records.')
          return
        }
        if (window.confirm(`Import "${file.name}"?\nThis will replace ALL current data.`)) {
          setData(parsed)
        }
      } catch {
        alert('Failed to read file. Make sure it is a valid JSON backup.')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  const handleToggleDark = () => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, darkMode: !prev.settings.darkMode },
    }))
  }

  const handlePinCreated = (pin) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, pin } }))
    setIsAuthenticated(true)
  }

  return (
    <div className={`${isDark ? 'dark' : ''} min-h-screen bg-gray-100 dark:bg-gray-950 sm:flex sm:items-center sm:justify-center sm:p-6`}>
      <div className="relative w-full max-w-md h-screen sm:h-[85vh] sm:min-h-[600px] bg-white dark:bg-gray-900 sm:rounded-3xl sm:shadow-2xl flex flex-col overflow-hidden">
        {!isAuthenticated ? (
          <PinScreen
            mode={hasPin ? 'enter' : 'create'}
            savedPin={data.settings?.pin}
            onAuthenticated={() => setIsAuthenticated(true)}
            onPinCreated={handlePinCreated}
          />
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportFile}
            />
            <TopBar
              accounts={data.accounts}
              onManage={() => setShowAccounts(true)}
              isDark={isDark}
              onToggleDark={handleToggleDark}
              onExport={handleExport}
              onImport={() => fileInputRef.current?.click()}
            />
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              <PageComponent data={data} setData={setData} />
            </main>
            <BottomNav activePage={activePage} setActivePage={setActivePage} />
            {showAccounts && (
              <AccountsModal
                accounts={data.accounts}
                onSave={handleSaveAccounts}
                onClose={() => setShowAccounts(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
