import Link from 'next/link';
import Tag from './Tag';

export default function RelatedPosts({ currentPost, allPosts }) {
  // Filtrer les articles pour ne garder que ceux qui partagent au moins un tag
  const relatedPosts = allPosts
    .filter(post => 
      post.slug !== currentPost.slug && 
      post.tags.some(tag => currentPost.tags.includes(tag))
    )
    .map(post => {
      // Calculer le score de pertinence basé sur les tags communs
      const commonTags = post.tags.filter(tag => currentPost.tags.includes(tag));
      const tagScore = commonTags.length;
      
      return {
        ...post,
        score: tagScore
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3); // Prendre les 3 articles les plus pertinents

  if (relatedPosts.length === 0) return null;

  return (
    <div className="mt-12 mb-8">
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
        Articles similaires
      </h2>
      <div className="space-y-4">
        {relatedPosts.map(post => (
          <Link 
            key={post.slug} 
            href={`/blog/${post.slug}`}
            className="group block"
          >
            <div className="flex items-center">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 truncate mr-2">
                {post.title}
              </h3>
              <div className="flex items-center ml-1.5 flex-shrink-0">
                {post.tags.slice(0, 1).map(tag => (
                  <Tag
                    key={tag}
                    name={tag}
                    isActive={false}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 