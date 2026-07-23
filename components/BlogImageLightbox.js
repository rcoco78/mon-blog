'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Affiche une image avec lightbox au clic.
 * Utilise <img> pour la lightbox afin de supporter toutes les URLs (ex. Vercel Blob).
 */
export default function BlogImageLightbox({ src, alt, caption, children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const node = rootRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '80px 0px', threshold: 0.12 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

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

  const showCaption =
    caption &&
    caption.trim() &&
    !/^image illustrative/i.test(caption) &&
    !/^capture[_\s-]?d/i.test(caption)

  return (
    <>
      <figure
        ref={rootRef}
        className={[
          'my-8 transition-all duration-700 ease-out',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 dark:focus:ring-offset-neutral-950 rounded-xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800"
          aria-label="Agrandir l'image"
        >
          {children}
        </button>
        {showCaption ? (
          <figcaption className="mt-2.5 text-center text-sm text-neutral-500 dark:text-neutral-400 leading-snug">
            {caption}
          </figcaption>
        ) : null}
      </figure>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
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
            className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </>
  )
}
