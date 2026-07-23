import { useMemo, useState, useEffect } from 'react'

function normalizeMarkdown(markdown) {
  if (!markdown) return null
  if (typeof markdown === 'string') return markdown
  if (typeof markdown === 'object' && markdown.parent) return markdown.parent
  if (typeof markdown === 'object') {
    const stringProps = Object.values(markdown).find((v) => typeof v === 'string')
    return stringProps || null
  }
  return null
}

export default function TableOfContents({ markdown }) {
  const headings = useMemo(() => {
    const markdownContent = normalizeMarkdown(markdown)
    if (!markdownContent || typeof markdownContent !== 'string') return []

    const headingRegex = /^(#{1,4})\s+(.+)$/gm
    const items = []
    let match

    while ((match = headingRegex.exec(markdownContent)) !== null) {
      const level = match[1].length
      let text = match[2].trim()
      text = text.replace(/\*\*(.*?)\*\*/g, '$1')
      text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')

      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      items.push({ id, text, level })
    }

    return items
  }, [markdown])

  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    if (headings.length === 0 || typeof window === 'undefined') return

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id)
          return
        }

        const midpoint = window.scrollY + window.innerHeight * 0.35
        let current = headings[0]?.id || null
        for (const heading of headings) {
          const el = document.getElementById(heading.id)
          if (el && el.offsetTop <= midpoint) current = heading.id
        }
        if (current) setActiveId(current)
      },
      {
        rootMargin: '-15% 0px -55% 0px',
        threshold: [0, 0.25, 0.5, 1],
      }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  const scrollToHeading = (id) => {
    const element = document.getElementById(id)
    if (!element) return
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
  }

  return (
    <div className="mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-800">
      <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-3">
        Sommaire
      </h2>
      <nav aria-label="Sommaire de l'article">
        <ul className="space-y-1">
          {headings.map((heading, index) => {
            const isActive = activeId === heading.id
            return (
              <li
                key={`${heading.id}-${index}`}
                className={
                  heading.level === 1 || heading.level === 2
                    ? 'ml-0'
                    : heading.level === 3
                      ? 'ml-3'
                      : 'ml-6'
                }
              >
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToHeading(heading.id)
                  }}
                  className={[
                    'block border-l pl-3 py-1 text-sm transition-colors',
                    isActive
                      ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 font-medium'
                      : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-300 dark:hover:border-neutral-600',
                  ].join(' ')}
                  aria-current={isActive ? 'location' : undefined}
                >
                  {heading.text}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
