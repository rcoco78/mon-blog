import Link from 'next/link'
import Tag from './Tag'
import { getPrimarySeries, getSeriesPosts } from '../lib/blog-series'

function byTagScore(currentPost, allPosts, excludeSlugs = new Set()) {
  const currentTags = currentPost.tags || []
  if (currentTags.length === 0) return []

  return allPosts
    .filter(
      (post) =>
        post.slug !== currentPost.slug &&
        !excludeSlugs.has(post.slug) &&
        Array.isArray(post.tags) &&
        post.tags.some((tag) => currentTags.includes(tag))
    )
    .map((post) => ({
      ...post,
      score: post.tags.filter((tag) => currentTags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score)
}

function byRecency(currentPost, allPosts, excludeSlugs = new Set()) {
  return [...allPosts]
    .filter((post) => post.slug !== currentPost.slug && !excludeSlugs.has(post.slug))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
}

/**
 * Interlinking pour TOUS les articles :
 * 1) autres articles de la série primaire
 * 2) tags communs
 * 3) articles récents (filet de sécurité)
 */
export default function RelatedPosts({ currentPost, allPosts }) {
  if (!currentPost?.slug || !Array.isArray(allPosts) || allPosts.length === 0) return null

  const availableSlugs = allPosts.map((p) => p.slug)
  const series = getPrimarySeries(currentPost.slug, availableSlugs)

  let relatedPosts = []
  let heading = 'Articles similaires'

  if (series) {
    heading = `Dans la série ${series.title}`
    relatedPosts = getSeriesPosts(series, allPosts, { excludeSlug: currentPost.slug })
  }

  const exclude = new Set([currentPost.slug, ...relatedPosts.map((p) => p.slug)])
  const LIMIT = series ? Math.min(6, Math.max(3, relatedPosts.length)) : 3

  if (relatedPosts.length < LIMIT) {
    const need = LIMIT - relatedPosts.length
    const byTags = byTagScore(currentPost, allPosts, exclude).slice(0, need)
    relatedPosts = [...relatedPosts, ...byTags]
    byTags.forEach((p) => exclude.add(p.slug))
  }

  if (relatedPosts.length < LIMIT) {
    const need = LIMIT - relatedPosts.length
    const recent = byRecency(currentPost, allPosts, exclude).slice(0, need)
    relatedPosts = [...relatedPosts, ...recent]
  }

  if (!series && relatedPosts.length > 0) {
    const hasTagMatch = relatedPosts.some((p) =>
      (currentPost.tags || []).some((t) => (p.tags || []).includes(t))
    )
    heading = hasTagMatch ? 'Articles similaires' : 'À lire aussi'
  }

  if (relatedPosts.length === 0) return null

  return (
    <div className="mt-12 mb-8">
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
        {heading}
      </h2>
      <div className="space-y-4">
        {relatedPosts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
            <div className="flex items-center">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 truncate mr-2">
                {post.title}
              </h3>
              <div className="flex items-center ml-1.5 flex-shrink-0">
                {(post.tags || []).slice(0, 1).map((tag) => (
                  <Tag key={tag} name={tag} isActive={false} onClick={() => {}} />
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {series?.hub && series.hub !== currentPost.slug ? (
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-500">
          Hub de la série :{' '}
          <Link
            href={`/blog/${series.hub}`}
            className="text-neutral-800 dark:text-neutral-200 underline underline-offset-2 hover:no-underline"
          >
            {allPosts.find((p) => p.slug === series.hub)?.title || 'voir le hub'}
          </Link>
        </p>
      ) : null}
    </div>
  )
}
