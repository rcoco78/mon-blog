import { useState, useEffect } from 'react'

// Fonction pour extraire les titres du markdown
export function extractHeadings(markdownContent) {
  if (!markdownContent) return []

  // Si c'est un objet avec une propriété parent, l'utiliser
  const content = typeof markdownContent === 'string' 
    ? markdownContent 
    : (markdownContent.parent || '')

  const headingRegex = /^(#{1,4})\s+(.+)$/gm
  const headings = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    let text = match[2].trim()
    
    // Nettoyer le texte des astérisques markdown (**texte** -> texte)
    text = text.replace(/\*\*(.*?)\*\*/g, '$1')
    
    // Générer l'ID (même logique que MarkdownRenderer)
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    headings.push({ id, text, level })
  }

  return headings
}

export default function TableOfContents({ markdownContent }) {
  const [headings, setHeadings] = useState([])
  const [activeHeadingId, setActiveHeadingId] = useState(null)

  useEffect(() => {
    if (markdownContent) {
      const extractedHeadings = extractHeadings(markdownContent)
      setHeadings(extractedHeadings)
    }
  }, [markdownContent])

  // Détecter le titre actif au scroll
  useEffect(() => {
    if (headings.length === 0) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100 // Offset pour le header

      // Trouver le titre actif
      for (let i = headings.length - 1; i >= 0; i--) {
        const element = document.getElementById(headings[i].id)
        if (element && element.offsetTop <= scrollPosition) {
          setActiveHeadingId(headings[i].id)
          return
        }
      }

      // Si aucun titre n'est trouvé, utiliser le premier
      setActiveHeadingId(headings[0]?.id || null)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Appel initial

    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  if (headings.length === 0) return null

  const scrollToHeading = (id) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // Offset pour le header fixe
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="sticky top-24">
      <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        <h3 className="font-semibold text-sm mb-4 text-neutral-900 dark:text-neutral-100">
          Sommaire
        </h3>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => scrollToHeading(heading.id)}
              className={`block w-full text-left text-sm transition-colors ${
                heading.level === 1
                  ? 'pl-0 font-medium'
                  : heading.level === 2
                  ? 'pl-3'
                  : heading.level === 3
                  ? 'pl-6'
                  : 'pl-9'
              } ${
                activeHeadingId === heading.id
                  ? 'text-neutral-900 dark:text-neutral-100 font-medium'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

