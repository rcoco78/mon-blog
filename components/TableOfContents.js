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

        // Fallback : dernière section au-dessus du milieu de viewport
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
    <div className="mb-10 p-5 sm:p-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
      <h2 className="text-sm font-semibold tracking-wide uppercase text-neutral-500 dark:text-neutral-400 mb-4">
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
                  heading.level === 1
                    ? 'ml-0'
                    : heading.level === 2
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
                    'group relative block rounded-md px-2.5 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-white/70 dark:hover:bg-neutral-800/60',
                  ].join(' ')}
                  aria-current={isActive ? 'location' : undefined}
                >
                  <span
                    className={[
                      'absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full transition-opacity',
                      isActive ? 'opacity-100 bg-neutral-900 dark:bg-neutral-100' : 'opacity-0',
                    ].join(' ')}
                    aria-hidden="true"
                  />
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
