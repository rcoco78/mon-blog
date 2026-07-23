import { useState, useEffect } from 'react'

/**
 * Image d'article avec agrandissement au clic (overlay simple).
 * Pas de scale hover, pas d'animation gadget — juste mieux voir le détail.
 */
export default function ImageWithZoom({ src, alt, caption, children }) {
  const [isOpen, setIsOpen] = useState(false)

  const captionText = caption ?? alt
  const looksLikeFilename =
    captionText &&
    (/\.(jpe?g|png|gif|webp|svg|heic|avif)$/i.test(captionText.trim()) ||
      (src &&
        captionText.trim() ===
          (src.split('/').pop()?.split('?')[0] || '')))
  const showCaption =
    captionText &&
    captionText.trim() &&
    !looksLikeFilename &&
    !/^image illustrative/i.test(captionText) &&
    !/^capture[_\s-]?d/i.test(captionText)

  useEffect(() => {
    if (!isOpen) return
    const onEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onEscape)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEscape)
      document.body.style.overflow = prev
    }
  }, [isOpen])

  return (
    <>
      <figure className="my-8">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="block w-full text-left cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 rounded-lg"
          aria-label="Agrandir l'image"
        >
          {children || (
            <img
              src={src}
              alt={alt || ''}
              className="w-full h-auto rounded-lg"
              loading="lazy"
            />
          )}
        </button>
        {showCaption ? (
          <figcaption className="mt-2 text-sm text-neutral-500 dark:text-neutral-500">
            {captionText}
          </figcaption>
        ) : null}
      </figure>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image agrandie"
        >
          <button
            type="button"
            className="absolute top-3 right-3 sm:top-5 sm:right-5 p-2 text-white/70 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
            onClick={() => setIsOpen(false)}
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={src}
            alt={alt || ''}
            className="max-w-[92vw] max-h-[88vh] w-auto h-auto object-contain"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      ) : null}
    </>
  )
}
