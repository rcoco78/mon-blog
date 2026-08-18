import { useState } from 'react'

export default function FAQ({ items = [], onItemOpen } = {}) {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleItem = (index) => {
    const next = openIndex === index ? null : index
    setOpenIndex(next)
    if (next !== null && typeof onItemOpen === 'function') {
      onItemOpen(items[next], next)
    }
  }

  if (!items || items.length === 0) return null

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleItem(index)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors"
            aria-expanded={openIndex === index}
            aria-controls={`faq-answer-${index}`}
          >
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 pr-4">
              {item.question}
            </h3>
            <svg
              className={`flex-shrink-0 w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform ${
                openIndex === index ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === index && (
            <div
              id={`faq-answer-${index}`}
              className="px-4 pb-4 text-sm text-neutral-600 dark:text-neutral-400"
            >
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

