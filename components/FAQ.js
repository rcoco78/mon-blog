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
    <div className="border-t border-neutral-300 dark:border-neutral-700" style={{ borderTopStyle: 'var(--line-style-chrome)' }}>
      {items.map((item, index) => (
        <div
          key={index}
          className="border-b border-neutral-300 dark:border-neutral-700"
          style={{ borderBottomStyle: 'var(--line-style-chrome)' }}
        >
          <button
            onClick={() => toggleItem(index)}
            className="w-full flex items-center justify-between py-3 text-left hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            aria-expanded={openIndex === index}
            aria-controls={`faq-answer-${index}`}
          >
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 pr-4 text-sm sm:text-base">
              {item.question}
            </h3>
            <svg
              className={`flex-shrink-0 w-4 h-4 text-neutral-500 dark:text-neutral-400 transition-transform ${
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
              className="pb-3 text-sm text-neutral-600 dark:text-neutral-400"
            >
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
