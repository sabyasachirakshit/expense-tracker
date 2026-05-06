import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import CreateRecord from './pages/CreateRecord'
import Passbook from './pages/Passbook'
import BottomNav from './components/BottomNav'
import TopBar from './components/TopBar'
import AccountsModal from './components/AccountsModal'
import PinScreen from './components/PinScreen'
import { useExpenseStore } from './hooks/useExpenseStore'

const PAGES = {
  dashboard: Dashboard,
  passbook: Passbook,
  create: CreateRecord,
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
    setData((prev) => ({ ...prev, accounts: updatedAccounts }))
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
            <TopBar
              accounts={data.accounts}
              onManage={() => setShowAccounts(true)}
              isDark={isDark}
              onToggleDark={handleToggleDark}
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
