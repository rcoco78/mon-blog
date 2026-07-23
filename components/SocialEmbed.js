/**
 * Embeds Instagram (post / reel) et fallback lien propre pour bookmarks.
 */

function getInstagramEmbedSrc(url) {
  if (!url || typeof url !== 'string') return null
  try {
    const parsed = new URL(url)
    if (!/(^|\.)instagram\.com$/i.test(parsed.hostname)) return null
    // /p/ID/, /reel/ID/, /reels/ID/, /tv/ID/
    const match = parsed.pathname.match(/^\/(p|reel|reels|tv)\/([^/?#]+)/i)
    if (!match) return null
    const kind = match[1].toLowerCase() === 'reels' ? 'reel' : match[1].toLowerCase()
    const id = match[2]
    return `https://www.instagram.com/${kind}/${id}/embed`
  } catch {
    return null
  }
}

export function isInstagramUrl(url) {
  return Boolean(getInstagramEmbedSrc(url))
}

export default function SocialEmbed({ url, caption = '', className = '' }) {
  const embedSrc = getInstagramEmbedSrc(url)

  if (embedSrc) {
    return (
      <figure className={`my-8 ${className}`.trim()}>
        <div className="mx-auto w-full max-w-[540px] overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40">
          <iframe
            src={embedSrc}
            title={caption || 'Publication Instagram'}
            className="w-full border-0"
            style={{ height: 680, maxWidth: '100%' }}
            loading="lazy"
            allow="encrypted-media; clipboard-write"
            allowFullScreen
          />
        </div>
        {caption ? (
          <figcaption className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-500">
            {caption}
          </figcaption>
        ) : null}
        <p className="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-500">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-[3px] hover:decoration-neutral-900 dark:hover:decoration-neutral-100"
          >
            Voir sur Instagram
          </a>
        </p>
      </figure>
    )
  }

  // Bookmark générique : encart hairline, pas d'embed
  return (
    <aside className={`my-6 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-3 ${className}`.trim()}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-neutral-900 dark:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-[3px] hover:decoration-neutral-900 dark:hover:decoration-neutral-100 break-all"
      >
        {caption || url}
      </a>
    </aside>
  )
}
