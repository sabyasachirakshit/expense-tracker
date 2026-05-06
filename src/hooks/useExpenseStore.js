import { useState, useEffect } from 'react'

const STORAGE_KEY = 'expense-tracker-data'

const defaultData = {
  records: [],
  categories: [],
  settings: {},
  accounts: [{ id: 'wallet', name: 'Wallet', balance: 0 }],
}

export function useExpenseStore() {
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.primaryAccount && !parsed.accounts) {
          parsed.accounts = [{ id: 'wallet', ...parsed.primaryAccount }]
          delete parsed.primaryAccount
        }
        return { ...defaultData, ...parsed }
      }
      return defaultData
    } catch {
      return defaultData
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  return [data, setData]
}
