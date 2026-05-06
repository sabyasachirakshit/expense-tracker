import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import CreateRecord from './pages/CreateRecord'
import BottomNav from './components/BottomNav'

const PAGES = {
  dashboard: Dashboard,
  create: CreateRecord,
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')

  const PageComponent = PAGES[activePage] ?? Dashboard

  return (
    <div className="min-h-screen bg-gray-100 sm:flex sm:items-center sm:justify-center sm:p-6">
      <div className="relative w-full max-w-md h-screen sm:h-[85vh] sm:min-h-[600px] bg-white sm:rounded-3xl sm:shadow-2xl flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <PageComponent />
        </main>
        <BottomNav activePage={activePage} setActivePage={setActivePage} />
      </div>
    </div>
  )
}

export default App
