import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import CreateRecord from './pages/CreateRecord'
import BottomNav from './components/BottomNav'
import TopBar from './components/TopBar'
import AccountsModal from './components/AccountsModal'
import { useExpenseStore } from './hooks/useExpenseStore'

const PAGES = {
  dashboard: Dashboard,
  create: CreateRecord,
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [showAccounts, setShowAccounts] = useState(false)
  const [data, setData] = useExpenseStore()

  const PageComponent = PAGES[activePage] ?? Dashboard

  const handleSaveAccounts = (updatedAccounts) => {
    setData((prev) => ({ ...prev, accounts: updatedAccounts }))
  }

  return (
    <div className="min-h-screen bg-gray-100 sm:flex sm:items-center sm:justify-center sm:p-6">
      <div className="relative w-full max-w-md h-screen sm:h-[85vh] sm:min-h-[600px] bg-white sm:rounded-3xl sm:shadow-2xl flex flex-col overflow-hidden">
        <TopBar accounts={data.accounts} onManage={() => setShowAccounts(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <PageComponent />
        </main>
        <BottomNav activePage={activePage} setActivePage={setActivePage} />
        {showAccounts && (
          <AccountsModal
            accounts={data.accounts}
            onSave={handleSaveAccounts}
            onClose={() => setShowAccounts(false)}
          />
        )}
      </div>
    </div>
  )
}

export default App
