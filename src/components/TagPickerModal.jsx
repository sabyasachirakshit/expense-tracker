import { useState } from 'react'

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#84cc16',
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#6b7280',
]

export default function TagPickerModal({ tags, onSave, onClose }) {
  const [view, setView] = useState('list')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PALETTE[0])

  const handleCreate = () => {
    if (!newName.trim()) return
    onSave([...tags, { id: genId(), name: newName.trim(), color: newColor }])
    setNewName('')
    setNewColor(PALETTE[0])
    setView('list')
  }

  const handleDelete = (id) => {
    onSave(tags.filter((t) => t.id !== id))
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
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Manage Tags</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-lg"
              >
                ×
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-5 max-h-44 overflow-y-auto">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                  style={{ backgroundColor: tag.color + '18', borderColor: tag.color + '60' }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="text-xs font-semibold" style={{ color: tag.color }}>{tag.name}</span>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-0.5 leading-none text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">No tags yet.</p>
              )}
            </div>

            <button
              onClick={() => setView('create')}
              className="w-full py-3.5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex items-center justify-center gap-1.5 active:bg-indigo-50 dark:active:bg-indigo-900/30 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create New Tag
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-5">
              <button
                onClick={() => setView('list')}
                className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Create Tag</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rent, Travel, Gym"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                  Color
                </label>
                <div className="flex gap-3 flex-wrap">
                  {PALETTE.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newColor === color ? 'scale-125 ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {newName.trim() && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Preview:</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: newColor }}
                  >
                    {newName}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setView('list')}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm active:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                Create
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
