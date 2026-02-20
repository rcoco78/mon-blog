'use client'

import { useState, useEffect, useRef } from 'react'

export default function SearchBar({ tags = [], selectedTag, onTagSelect }) {
  const scrollRef = useRef(null)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkOverflow = () => {
    const el = scrollRef.current
    if (!el) return
    const { scrollWidth, clientWidth, scrollLeft } = el
    setCanScrollRight(scrollWidth > clientWidth && scrollLeft < scrollWidth - clientWidth - 2)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkOverflow()
    const ro = new ResizeObserver(checkOverflow)
    ro.observe(el)
    el.addEventListener('scroll', checkOverflow)
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', checkOverflow)
    }
  }, [tags])

  return (
    <div className="relative min-w-0 overflow-hidden">
      <div
        ref={scrollRef}
        className="flex flex-nowrap gap-2 overflow-x-auto pb-1.5 scrollbar-hide"
      >
        <button
          onClick={() => onTagSelect(null)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 border ${
            selectedTag === null
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
              : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
          }`}
        >
          Tous
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagSelect(tag)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 border ${
              selectedTag === tag
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      {/* Fade à droite pour inciter au scroll (plus de catégories à découvrir) */}
      {canScrollRight && (
        <>
          <div
            className="absolute right-0 top-0 bottom-1.5 w-12 pointer-events-none hidden dark:block"
            aria-hidden
            style={{
              background: 'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.92), rgb(0,0,0))'
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-1.5 w-12 pointer-events-none dark:hidden"
            aria-hidden
            style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.92), rgb(255 255 255))'
            }}
          />
        </>
      )}
    </div>
  )
}
