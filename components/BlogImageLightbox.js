'use client'

import { useState, useEffect } from 'react'

/**
 * Affiche une image avec lightbox au clic.
 * Utilise <img> pour la lightbox afin de supporter toutes les URLs (ex. Vercel Blob).
 */
export default function BlogImageLightbox({ src, alt, children }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const onEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      <span className="block my-6">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 rounded-lg overflow-hidden"
          aria-label="Agrandir l'image"
        >
          {children}
        </button>
      </span>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image en grand"
        >
          <button
            type="button"
            className="absolute top-4 right-4 z-10 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            onClick={() => setIsOpen(false)}
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </>
  )
}
