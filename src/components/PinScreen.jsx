import { useState } from 'react'

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export default function PinScreen({ mode, savedPin, onAuthenticated, onPinCreated }) {
  const [digits, setDigits] = useState('')
  const [createStep, setCreateStep] = useState(1)
  const [firstPin, setFirstPin] = useState('')
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)

  const isCreate = mode === 'create'
  const title = isCreate
    ? createStep === 1 ? 'Create Your PIN' : 'Confirm Your PIN'
    : 'Welcome Back'
  const subtitle = isCreate
    ? createStep === 1 ? 'Set a 4-digit PIN to secure your app' : 'Re-enter PIN to confirm'
    : 'Enter your PIN to continue'

  const triggerError = (msg) => {
    setError(msg)
    setShaking(true)
    setTimeout(() => {
      setShaking(false)
      setDigits('')
    }, 400)
  }

  const handleKey = (key) => {
    if (key === '⌫') {
      setDigits((d) => d.slice(0, -1))
      setError('')
      return
    }
    if (key === '' || digits.length >= 4 || shaking) return

    const next = digits + key
    setDigits(next)

    if (next.length === 4) {
      setTimeout(() => {
        if (!isCreate) {
          if (next === savedPin) {
            onAuthenticated()
          } else {
            triggerError('Incorrect PIN. Try again.')
          }
        } else if (createStep === 1) {
          setFirstPin(next)
          setDigits('')
          setCreateStep(2)
          setError('')
        } else {
          if (next === firstPin) {
            onPinCreated(next)
          } else {
            triggerError("PINs don't match. Try again.")
            setCreateStep(1)
            setFirstPin('')
          }
        }
      }, 150)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-7 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-1.5">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-9">{subtitle}</p>

        <div className={`flex gap-5 mb-3 ${shaking ? 'pin-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                i < digits.length
                  ? 'bg-indigo-600 scale-110'
                  : 'border-2 border-gray-300 dark:border-gray-600'
              }`}
            />
          ))}
        </div>

        <p className="text-red-500 dark:text-red-400 text-sm mt-2 text-center min-h-[20px]">
          {error}
        </p>
      </div>

      <div className="px-8 pb-10">
        <div className="grid grid-cols-3 gap-3">
          {KEYPAD.map((key, i) => {
            if (key === '') return <div key={i} />
            return (
              <button
                key={i}
                onClick={() => handleKey(key)}
                className={`h-16 rounded-2xl text-xl font-semibold transition-all duration-100 active:scale-95 select-none ${
                  key === '⌫'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white active:bg-gray-200 dark:active:bg-gray-700'
                }`}
              >
                {key}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
