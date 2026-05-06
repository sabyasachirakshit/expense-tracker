import { useState, useEffect } from 'react'

const STORAGE_KEY = 'expense-tracker-data'

const defaultData = {
  records: [],
  accounts: [{ id: 'wallet', name: 'Wallet', balance: 0 }],
  tags: [
    { id: 'food', name: 'Food', color: '#f97316' },
    { id: 'entertainment', name: 'Entertainment', color: '#a855f7' },
    { id: 'health', name: 'Health', color: '#22c55e' },
    { id: 'transport', name: 'Transport', color: '#3b82f6' },
    { id: 'shopping', name: 'Shopping', color: '#ec4899' },
  ],
  settings: {
    pin: null,
    darkMode: false,
    lastAccountId: null,
    passbookFilters: {
      account: '',
      month: -1,
      year: new Date().getFullYear(),
      type: null,
      tag: '',
    },
  },
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
        return {
          ...defaultData,
          ...parsed,
          tags: parsed.tags ?? defaultData.tags,
          settings: {
            ...defaultData.settings,
            ...(parsed.settings || {}),
            passbookFilters: {
              ...defaultData.settings.passbookFilters,
              ...((parsed.settings || {}).passbookFilters || {}),
            },
          },
        }
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
