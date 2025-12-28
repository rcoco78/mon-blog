import Link from 'next/link'
import { getAllPosts } from '../lib/notion'
import ViewCounter from '../components/ViewCounter'
import Tag from '../components/Tag'
import { useState, useEffect } from 'react'
import SearchBar from '../components/SearchBar'
import SEOHead from '../components/seo/SEOHead'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'

function TagFilter({ tags, selectedTag, onTagSelect }) {
  const [showMore, setShowMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrer les tags en fonction de la recherche
  const filteredTags = tags.filter(tag => 
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Afficher les 5 premiers tags par défaut
  const visibleTags = showMore ? filteredTags : filteredTags.slice(0, 5)
  const hasMoreTags = filteredTags.length > 5

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Tag
          name="Tous"
          isActive={!selectedTag}
          onClick={() => onTagSelect(null)}
        />
        {visibleTags.map(tag => (
          <Tag
            key={tag}
            name={tag}
            isActive={selectedTag === tag}
            onClick={() => onTagSelect(tag)}
          />
        ))}
        {hasMoreTags && !showMore && (
          <button
            onClick={() => setShowMore(true)}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors
              bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 
              hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            Plus
          </button>
        )}
      </div>
      
      {showMore && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Rechercher un tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1 text-sm rounded-md border border-neutral-200 
              dark:border-neutral-800 bg-white dark:bg-neutral-900"
          />
          <div className="flex flex-wrap gap-2">
            {filteredTags.map(tag => (
              <Tag
                key={tag}
                name={tag}
                isActive={selectedTag === tag}
                onClick={() => onTagSelect(tag)}
              />
            ))}
          </div>
          <button
            onClick={() => setShowMore(false)}
            className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Voir moins
          </button>
        </div>
      )}
    </div>
  )
}

export default function Blog({ posts }) {
  const [selectedTag, setSelectedTag] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [allTags, setAllTags] = useState([])
  const [filteredPosts, setFilteredPosts] = useState(posts)

  useEffect(() => {
    // Extraire tous les tags uniques
    const tags = [...new Set(posts.flatMap(post => post.tags))]
    setAllTags(tags)
  }, [posts])

  useEffect(() => {
    // Filtrer les posts en fonction du tag sélectionné et de la recherche
    let filtered = posts

    if (selectedTag) {
      filtered = filtered.filter(post => post.tags.includes(selectedTag))
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    setFilteredPosts(filtered)
  }, [selectedTag, searchQuery, posts])

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.blog.title,
    description: siteConfig.seo.pages.blog.description,
    path: '/blog',
    keywords: siteConfig.seo.pages.blog.keywords
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section>
          <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Blog</h1>

        <SearchBar 
          onSearch={handleSearch} 
          tags={allTags}
          selectedTag={selectedTag}
          onTagSelect={setSelectedTag}
        />

        <div>
          {filteredPosts && filteredPosts.length > 0 ? (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="post-link">
                  <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
                    <div className="flex flex-col md:flex-row md:items-center w-full">
                      <div className="flex-shrink-0">
                        <p className="post-date whitespace-nowrap">
                          {new Date(post.date).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <p className="post-title flex-grow truncate md:max-w-[60%] w-full md:ml-4">
                        {post.title}
                      </p>
                      <div className="md:ml-auto flex-shrink-0 mt-1 md:mt-0">
                        <ViewCounter slug={post.slug} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p>Aucun article disponible pour le moment.</p>
          )}
        </div>
      </section>
    </main>
    </>
  )
}

export async function getStaticProps() {
  const posts = await getAllPosts()
  return {
    props: {
      posts,
    },
    revalidate: 60,
  }
} 