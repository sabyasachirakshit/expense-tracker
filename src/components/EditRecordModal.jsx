import { useState } from 'react'

const TYPES = [
  { key: 'expense',  label: 'Expense',  active: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800' },
  { key: 'income',   label: 'Income',   active: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800' },
  { key: 'transfer', label: 'Transfer', active: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800' },
]

const AMOUNT_COLOR      = { expense: 'text-red-500',   income: 'text-green-500',   transfer: 'text-blue-500' }
const PLACEHOLDER_COLOR = {
  expense:  'placeholder:text-red-300 dark:placeholder:text-red-800',
  income:   'placeholder:text-green-300 dark:placeholder:text-green-800',
  transfer: 'placeholder:text-blue-300 dark:placeholder:text-blue-800',
}

export default function EditRecordModal({ record, accounts, tags, onSave, onClose }) {
  const [type, setType]               = useState(record.type)
  const [amount, setAmount]           = useState(String(record.amount))
  const [title, setTitle]             = useState(record.title)
  const [description, setDescription] = useState(record.description || '')
  const [date, setDate]               = useState(() => record.date.slice(0, 10))
  const [time, setTime]               = useState(() => {
    const d = new Date(record.date)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })
  const [accountId, setAccountId]     = useState(record.accountId ?? accounts[0]?.id ?? '')
  const [fromId, setFromId]           = useState(record.fromAccountId ?? accounts[0]?.id ?? '')
  const [toId, setToId]               = useState(record.toAccountId ?? accounts[1]?.id ?? accounts[0]?.id ?? '')
  const [selectedTags, setSelectedTags] = useState(record.tagIds ?? [])

  const toggleTag = (id) =>
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  const isValid = !!parseFloat(amount) && title.trim().length > 0 &&
    (type !== 'transfer' || fromId !== toId)

  const handleSave = () => {
    if (!isValid) return
    const amt = parseFloat(amount)
    const datetime = new Date(`${date}T${time}`).toISOString()
    onSave(record, {
      ...record,
      type,
      title: title.trim(),
      description: description.trim(),
      amount: amt,
      date: datetime,
      tagIds: type !== 'transfer' ? selectedTags : [],
      accountId: type !== 'transfer' ? accountId : null,
      fromAccountId: type === 'transfer' ? fromId : null,
      toAccountId: type === 'transfer' ? toId : null,
    })
  }

  const selectCls = 'w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const inputCls  = 'w-full bg-transparent text-gray-800 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 text-sm focus:outline-none'
  const lbl       = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2'

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="relative bg-white dark:bg-gray-900 rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 shrink-0 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800 dark:text-white">Edit Record</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-lg"
            >
              ×
            </button>
          </div>
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Amount */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-4">
            <span className={lbl}>Amount</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${AMOUNT_COLOR[type]}`}>₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className={`flex-1 text-3xl font-bold bg-transparent focus:outline-none ${AMOUNT_COLOR[type]} ${PLACEHOLDER_COLOR[type]}`}
              />
            </div>
          </div>

          {/* Account / Transfer */}
          {type !== 'transfer' ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-4">
              <span className={lbl}>Account</span>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={selectCls}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-4 space-y-3">
              <span className={lbl}>Transfer</span>
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
                {fromId === toId && <p className="text-xs text-red-500 mt-1.5">From and To must be different.</p>}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-4">
            <span className={lbl}>Title</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Record title" className={inputCls} />
          </div>

          {/* Description */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-4">
            <span className={lbl}>Description <span className="normal-case font-normal text-gray-400">(optional)</span></span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a note..." rows={2} className={`${inputCls} resize-none`} />
          </div>

          {/* Date & Time */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-4">
            <span className={lbl}>Date & Time</span>
            <div className="flex gap-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`flex-1 ${selectCls}`} />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`w-28 ${selectCls}`} />
            </div>
          </div>

          {/* Tags */}
          {type !== 'transfer' && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-4">
              <span className={lbl}>Tags</span>
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
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`flex-1 py-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-colors ${
                type === 'expense' ? 'bg-red-500 active:bg-red-600'
                : type === 'income' ? 'bg-green-500 active:bg-green-600'
                : 'bg-blue-500 active:bg-blue-600'
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
