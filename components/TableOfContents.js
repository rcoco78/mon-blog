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

function TocNav({ headings, activeId, onNavigate, compact = false }) {
  return (
    <nav aria-label="Sommaire de l'article">
      <ul className={compact ? 'space-y-0.5' : 'space-y-1'}>
        {headings.map((heading, index) => {
          const isActive = activeId === heading.id
          return (
            <li
              key={`${heading.id}-${index}`}
              className={
                heading.level === 1 || heading.level === 2
                  ? 'ml-0'
                  : heading.level === 3
                    ? 'ml-2'
                    : 'ml-4'
              }
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(heading.id)
                }}
                className={[
                  'block border-l pl-2.5 py-1 transition-colors leading-snug',
                  compact ? 'text-xs' : 'text-sm',
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
  )
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
    <>
      {/* Mobile / tablette : sommaire repliable */}
      <details className="xl:hidden mb-8 rounded-lg border border-neutral-200 dark:border-neutral-800 group">
        <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3.5 select-none [&::-webkit-details-marker]:hidden">
          <span className="uppercase tracking-wide text-neutral-500 dark:text-neutral-500 text-xs font-medium">
            Sommaire
          </span>
          <span className="inline-flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
            <span className="text-xs">{headings.length} sections</span>
            <svg
              className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </summary>
        <div className="px-4 pb-4 pt-1 border-t border-neutral-200 dark:border-neutral-800">
          <TocNav headings={headings} activeId={activeId} onNavigate={scrollToHeading} />
        </div>
      </details>

      {/* Desktop large : sticky latéral discret */}
      <aside
        className="hidden xl:block absolute top-0 right-full mr-10 w-44 pointer-events-none"
        aria-hidden={false}
      >
        <div className="sticky top-24 pointer-events-auto max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 scrollbar-hide">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-3">
            Sommaire
          </p>
          <TocNav
            headings={headings}
            activeId={activeId}
            onNavigate={scrollToHeading}
            compact
          />
        </div>
      </aside>
    </>
  )
}
