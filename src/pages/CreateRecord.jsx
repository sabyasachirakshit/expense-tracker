import { useState } from 'react'
import TagPickerModal from '../components/TagPickerModal'

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

const TYPES = [
  { key: 'expense', label: 'Expense', active: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800' },
  { key: 'income',  label: 'Income',  active: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800' },
  { key: 'transfer',label: 'Transfer',active: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800' },
]

const AMOUNT_COLOR       = { expense: 'text-red-500',   income: 'text-green-500',   transfer: 'text-blue-500' }
const PLACEHOLDER_COLOR  = { expense: 'placeholder:text-red-300 dark:placeholder:text-red-800', income: 'placeholder:text-green-300 dark:placeholder:text-green-800', transfer: 'placeholder:text-blue-300 dark:placeholder:text-blue-800' }

function nowDate() { return new Date().toISOString().slice(0, 10) }
function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function Field({ label, hint, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-4">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
        {hint && <span className="text-[11px] text-gray-400 dark:text-gray-500 normal-case">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export default function CreateRecord({ data, setData }) {
  const { accounts = [], tags = [] } = data

  const [type, setType]               = useState('expense')
  const [amount, setAmount]           = useState('')
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate]               = useState(nowDate)
  const [time, setTime]               = useState(nowTime)
  const [accountId, setAccountId]     = useState(() => {
    const last = data.settings?.lastAccountId
    return (last && accounts.find((a) => a.id === last)) ? last : accounts[0]?.id ?? ''
  })
  const [fromId, setFromId]           = useState(accounts[0]?.id ?? '')
  const [toId, setToId]               = useState(accounts[1]?.id ?? accounts[0]?.id ?? '')
  const [selectedTags, setSelectedTags] = useState([])
  const [showTagModal, setShowTagModal] = useState(false)
  const [saved, setSaved]             = useState(false)

  const handleAccountChange = (id) => {
    setAccountId(id)
    setData((prev) => ({ ...prev, settings: { ...prev.settings, lastAccountId: id } }))
  }

  const toggleTag = (id) =>
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  const isValid = !!parseFloat(amount) && title.trim().length > 0 &&
    (type !== 'transfer' || fromId !== toId)

  const handleSave = () => {
    if (!isValid) return
    const amt = parseFloat(amount)
    const datetime = new Date(`${date}T${time}`).toISOString()

    const record = {
      id: genId(),
      type,
      title: title.trim(),
      description: description.trim(),
      amount: amt,
      date: datetime,
      tagIds: type !== 'transfer' ? selectedTags : [],
      accountId: type !== 'transfer' ? accountId : null,
      fromAccountId: type === 'transfer' ? fromId : null,
      toAccountId: type === 'transfer' ? toId : null,
    }

    setData((prev) => ({
      ...prev,
      records: [record, ...prev.records],
      accounts: prev.accounts.map((acc) => {
        if (type === 'expense' && acc.id === accountId)  return { ...acc, balance: acc.balance - amt }
        if (type === 'income'  && acc.id === accountId)  return { ...acc, balance: acc.balance + amt }
        if (type === 'transfer' && acc.id === fromId)    return { ...acc, balance: acc.balance - amt }
        if (type === 'transfer' && acc.id === toId)      return { ...acc, balance: acc.balance + amt }
        return acc
      }),
    }))

    setAmount(''); setTitle(''); setDescription('')
    setDate(nowDate()); setTime(nowTime()); setSelectedTags([])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputCls = 'w-full bg-transparent text-gray-800 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 text-sm focus:outline-none'
  const selectCls = 'w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 pb-6 overflow-x-hidden">
      {/* Header + type selector */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-4 pt-4 pb-3 shadow-sm">
        <h1 className="text-base font-bold text-gray-800 dark:text-white mb-3">New Record</h1>
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                type === t.key ? t.active : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Amount */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-4">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</span>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-2xl font-bold ${AMOUNT_COLOR[type]}`}>₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              min="0"
              className={`flex-1 text-3xl font-bold bg-transparent focus:outline-none ${AMOUNT_COLOR[type]} ${PLACEHOLDER_COLOR[type]}`}
            />
          </div>
        </div>

        {/* Account(s) */}
        {type !== 'transfer' ? (
          <Field label="Account">
            <select value={accountId} onChange={(e) => handleAccountChange(e.target.value)} className={selectCls}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Transfer">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">From</p>
                <select value={fromId} onChange={(e) => setFromId(e.target.value)} className={selectCls}>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">To</p>
                <select value={toId} onChange={(e) => setToId(e.target.value)} className={selectCls}>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                {fromId === toId && (
                  <p className="text-xs text-red-500 mt-1.5">From and To accounts must be different.</p>
                )}
              </div>
            </div>
          </Field>
        )}

        {/* Title */}
        <Field label="Title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Grocery shopping"
            className={inputCls}
          />
        </Field>

        {/* Description */}
        <Field label="Description" hint="(optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className={`${inputCls} resize-none`}
          />
        </Field>

        {/* Date & Time */}
        <Field label="Date & Time">
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`flex-1 ${selectCls}`}
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`w-28 ${selectCls}`}
            />
          </div>
        </Field>

        {/* Tags (not for transfer) */}
        {type !== 'transfer' && (
          <Field label="Tags">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedTags.includes(tag.id) ? 'text-white scale-105' : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700'
                  }`}
                  style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name}
                </button>
              ))}
              <button
                onClick={() => setShowTagModal(true)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
              >
                ＋ Manage
              </button>
            </div>
          </Field>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!isValid}
          className={`w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-[0.98] ${
            !isValid
              ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              : type === 'expense' ? 'bg-red-500 active:bg-red-600'
              : type === 'income'  ? 'bg-green-500 active:bg-green-600'
              : 'bg-blue-500 active:bg-blue-600'
          }`}
        >
          {saved ? '✓ Saved!' : `Save ${type.charAt(0).toUpperCase() + type.slice(1)}`}
        </button>
      </div>

      {showTagModal && (
        <TagPickerModal
          tags={tags}
          onSave={(updated) => setData((prev) => ({ ...prev, tags: updated }))}
          onClose={() => setShowTagModal(false)}
        />
      )}
    </div>
  )
}
