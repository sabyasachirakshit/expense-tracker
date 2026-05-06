import { useState } from 'react'

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

function fmt(val) {
  return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function AccountsModal({ accounts, onSave, onClose }) {
  const [view, setView] = useState('list')
  const [editing, setEditing] = useState(null)
  const [formName, setFormName] = useState('')
  const [formBalance, setFormBalance] = useState('')

  const openAdd = () => {
    setEditing(null)
    setFormName('')
    setFormBalance('')
    setView('form')
  }

  const openEdit = (account) => {
    setEditing(account)
    setFormName(account.name)
    setFormBalance(String(account.balance))
    setView('form')
  }

  const handleSubmit = () => {
    const balance = parseFloat(formBalance) || 0
    const name = formName.trim() || 'Account'
    if (editing) {
      onSave(accounts.map((a) => (a.id === editing.id ? { ...a, name, balance } : a)))
    } else {
      onSave([...accounts, { id: genId(), name, balance }])
    }
    setView('list')
  }

  const handleDelete = (id) => {
    if (accounts.length <= 1) return
    onSave(accounts.filter((a) => a.id !== id))
    setView('list')
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-t-3xl px-5 pt-4 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" />

        {view === 'list' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Accounts</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-2.5 mb-4 max-h-64 overflow-y-auto">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between px-4 py-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{account.name}</p>
                    <p className="text-indigo-600 dark:text-white font-bold text-base mt-0.5">₹ {fmt(account.balance)}</p>
                  </div>
                  <button
                    onClick={() => openEdit(account)}
                    className="p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                    aria-label={`Edit ${account.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2.414a2 2 0 01.586-1.414z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={openAdd}
              className="w-full py-3.5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex items-center justify-center gap-1.5 active:bg-indigo-50 dark:active:bg-indigo-900/30 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Account
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-5">
              <button
                onClick={() => setView('list')}
                className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                aria-label="Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                {editing ? 'Edit Account' : 'Add Account'}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Wallet, SBI Bank, Cash"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-800 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Balance (₹)
                </label>
                <input
                  type="number"
                  value={formBalance}
                  onChange={(e) => setFormBalance(e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                  min="0"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-800 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {editing && accounts.length > 1 && (
                <button
                  onClick={() => handleDelete(editing.id)}
                  className="px-4 py-3.5 rounded-xl border border-red-200 text-red-500 font-semibold text-sm active:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setView('list')}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm active:bg-indigo-700 transition-colors"
              >
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
