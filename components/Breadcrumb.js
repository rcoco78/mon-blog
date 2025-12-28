import Link from 'next/link'
import { siteConfig } from '../lib/config'
import StructuredData from './seo/StructuredData'

export default function Breadcrumb({ title, slug }) {
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Accueil',
      item: siteConfig.url
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: `${siteConfig.url}/blog`
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: title,
      item: slug ? `${siteConfig.url}/blog/${slug}` : `${siteConfig.url}/blog`
    }
  ]

  return (
    <nav className="mb-8" aria-label="Fil d'Ariane">
      <ol className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
        <li>
          <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Accueil
          </Link>
        </li>
        <li className="flex items-center space-x-2">
          <span className="mx-1">/</span>
          <Link href="/blog" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Blog
          </Link>
        </li>
        {title && (
          <li className="flex items-center space-x-2">
            <span className="mx-1">/</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
              {title}
            </span>
          </li>
        )}
      </ol>

      <StructuredData
        type="BreadcrumbList"
        data={{ items: breadcrumbItems }}
      />
    </nav>
  )
} 