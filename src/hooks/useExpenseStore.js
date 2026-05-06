import { useState, useEffect } from 'react'

const STORAGE_KEY = 'expense-tracker-data'

const defaultData = {
  records: [],
  categories: [],
  settings: {},
}

export function useExpenseStore() {
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : defaultData
    } catch {
      return defaultData
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  return [data, setData]
}
