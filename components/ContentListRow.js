/**
 * Ligne de liste générique — style blog (pas de carte).
 */

import Link from 'next/link'

const rowClassName =
  'group flex items-start justify-between gap-4 py-4 border-b border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors'

export default function ContentListRow({
  href,
  title,
  meta = null,
  description = null,
  trailing = null,
  onClick,
  external = false,
}) {
  if (!title) return null

  const metaText = Array.isArray(meta) ? meta.filter(Boolean).join(' · ') : meta
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-base tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
          {title}
        </h3>
        {metaText && (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">{metaText}</p>
        )}
        {description && (
          <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
            {description}
          </p>
        )}
      </div>
      {trailing != null && trailing !== '' && (
        <div className="flex-shrink-0 text-right pt-0.5">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
            {trailing}
          </span>
        </div>
      )}
    </>
  )

  if (!href) {
    return <div className={rowClassName}>{content}</div>
  }

  const isExternal =
    external ||
    /^https?:\/\//i.test(href) ||
    href.startsWith('mailto:') ||
    href.startsWith('//')

  if (isExternal) {
    const isMail = href.startsWith('mailto:')
    return (
      <a
        href={href}
        onClick={onClick}
        className={rowClassName}
        {...(!isMail
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={href} onClick={onClick} className={rowClassName}>
      {content}
    </Link>
  )
}

export function ContentListRowSkeleton() {
  return (
    <div className="py-4 border-b border-neutral-200 dark:border-neutral-800 animate-pulse">
      <div className="h-5 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
      <div className="h-3 w-1/3 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
      <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
    </div>
  )
}
