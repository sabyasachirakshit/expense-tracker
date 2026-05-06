import { useState } from 'react'

export default function EditAccountModal({ account, onSave, onClose }) {
  const [name, setName] = useState(account.name)
  const [balance, setBalance] = useState(String(account.balance))

  const handleSave = () => {
    const parsedBalance = parseFloat(balance)
    onSave({
      name: name.trim() || 'Wallet',
      balance: isNaN(parsedBalance) ? 0 : parsedBalance,
    })
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-t-3xl px-6 pt-4 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <h2 className="text-lg font-bold text-gray-800 mb-6">Edit Account</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Account Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wallet, Bank, Cash"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Current Balance (₹)
            </label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              min="0"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-7">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm active:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm active:bg-indigo-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
