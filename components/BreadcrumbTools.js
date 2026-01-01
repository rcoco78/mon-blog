import Link from 'next/link'
import { siteConfig } from '../lib/config'
import StructuredData from './seo/StructuredData'

export default function BreadcrumbTools({ toolName, toolPath }) {
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
      name: 'Marketplace',
      item: `${siteConfig.url}/marketplace`
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: toolName,
      item: `${siteConfig.url}${toolPath}`
    }
  ]

  return (
    <nav className="mb-6" aria-label="Fil d'Ariane">
      <ol className="flex items-center flex-wrap gap-x-1.5 sm:gap-x-2 gap-y-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">
        <li className="flex items-center">
          <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors whitespace-nowrap">
            Accueil
          </Link>
        </li>
        <li className="flex items-center gap-x-1.5 sm:gap-x-2">
          <span className="text-neutral-400 dark:text-neutral-600">/</span>
          <Link href="/marketplace" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors whitespace-nowrap">
            Marketplace
          </Link>
        </li>
        {toolName && (
          <li className="flex items-center gap-x-1.5 sm:gap-x-2 min-w-0">
            <span className="text-neutral-400 dark:text-neutral-600">/</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium truncate max-w-[200px] sm:max-w-none">
              {toolName}
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

