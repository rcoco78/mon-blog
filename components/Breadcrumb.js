import Link from 'next/link'

export default function Breadcrumb({ title }) {
  return (
    <nav className="mb-8" aria-label="Fil d'Ariane">
      <ol className="flex items-center space-x-2 text-sm text-gray-400">
        <li>
          <Link href="/" className="hover:text-white transition-colors">
            Accueil
          </Link>
        </li>
        <li className="flex items-center space-x-2">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <Link href="/blog" className="hover:text-white transition-colors">
            Blog
          </Link>
        </li>
        <li className="flex items-center space-x-2">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-gray-300 hover:text-white transition-colors font-medium">
            {title}
          </span>
        </li>
      </ol>

      {/* Schema.org markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Accueil",
              "item": "https://corentinrobert.com"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Blog",
              "item": "https://corentinrobert.com/blog"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": title,
              "item": `https://corentinrobert.com/blog/${title.toLowerCase().replace(/\s+/g, '-')}`
            }
          ]
        })}
      </script>
    </nav>
  )
} 