import Link from 'next/link'
import Tag from './Tag'

/** Série éditoriale Freelance & growth — hub + leviers */
export const FREELANCE_GROWTH_SERIES = [
  'freelance-3-ans-malt-fiverr-affiliation-apify-logement-atypique',
  'affiliation-saas-lemlist-100000-revenus-24-mois',
  'gagner-argent-apify-bilan-8-mois-location-scripts',
  'logement-atypique-genese-histoire-vision-plateforme',
  'chatseo-outrank-outils-ia-contenu-seo-automatique',
]

function byTagScore(currentPost, allPosts, excludeSlugs = new Set()) {
  const currentTags = currentPost.tags || []
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

export default function RelatedPosts({ currentPost, allPosts }) {
  const inSeries = FREELANCE_GROWTH_SERIES.includes(currentPost?.slug)
  let relatedPosts = []
  let heading = 'Articles similaires'

  if (inSeries) {
    heading = 'Dans la série Freelance & growth'
    relatedPosts = FREELANCE_GROWTH_SERIES.filter((slug) => slug !== currentPost.slug)
      .map((slug) => allPosts.find((post) => post.slug === slug))
      .filter(Boolean)
  }

  if (relatedPosts.length < 3) {
    const exclude = new Set(relatedPosts.map((p) => p.slug))
    const fillers = byTagScore(currentPost, allPosts, exclude).slice(0, 3 - relatedPosts.length)
    relatedPosts = [...relatedPosts, ...fillers]
  }

  if (!inSeries) {
    relatedPosts = byTagScore(currentPost, allPosts).slice(0, 3)
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
    </div>
  )
}
