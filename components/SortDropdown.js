'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function SortDropdown({ id, value, onChange, options, label }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const containerRef = useRef(null)
  const buttonRef = useRef(null)

  const selectedOption = options.find((o) => o.value === value) || options[0]

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 160)
      })
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (open && buttonRef.current) {
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <label id={`${id}-label`} className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
        {label}
      </label>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
        onClick={() => {
          if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setPosition({
              top: rect.bottom + 4,
              left: rect.left,
              width: Math.max(rect.width, 160)
            })
          }
          setOpen((o) => !o)
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white hover:border-neutral-300 dark:hover:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 min-w-[140px] justify-between"
      >
        <span>{selectedOption?.label}</span>
        <svg
          className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && position && typeof document !== 'undefined' && createPortal(
        <ul
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="fixed z-[9999] py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            minWidth: 160
          }}
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onChange(opt.value)
                  setOpen(false)
                }
              }}
              tabIndex={0}
              className={`px-3 py-2 text-xs cursor-pointer transition-colors first:rounded-t-[7px] last:rounded-b-[7px] ${
                value === opt.value
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/70 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  )
}
