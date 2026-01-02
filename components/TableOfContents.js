import { useMemo } from 'react'

export default function TableOfContents({ markdown }) {
  const headings = useMemo(() => {
    if (!markdown || typeof markdown !== 'string') return []

    const headingRegex = /^(#{1,4})\s+(.+)$/gm
    const headings = []
    let match

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length
      let text = match[2].trim()
      
      // Nettoyer le texte des astérisques markdown (**texte** -> texte)
      text = text.replace(/\*\*(.*?)\*\*/g, '$1')
      text = text.replace(/\*(.*?)\*/g, '$1')
      
      // Utiliser la même logique de génération d'ID que MarkdownRenderer
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      headings.push({ id, text, level })
    }

    return headings
  }, [markdown])

  if (headings.length === 0) return null

  const scrollToHeading = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      // Highlight temporaire
      element.style.transition = 'background-color 0.3s ease'
      element.style.backgroundColor = 'rgba(254, 243, 199, 0.5)'
      setTimeout(() => {
        if (element) element.style.backgroundColor = ''
      }, 2000)
    }
  }

  return (
    <div className="mb-8 p-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
        Sommaire
      </h2>
      <nav>
        <ul className="space-y-2">
          {headings.map((heading, index) => (
            <li
              key={index}
              className={`${
                heading.level === 1
                  ? 'ml-0 font-semibold'
                  : heading.level === 2
                  ? 'ml-4'
                  : heading.level === 3
                  ? 'ml-8'
                  : 'ml-12'
              }`}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToHeading(heading.id)
                }}
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
