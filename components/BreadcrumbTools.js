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
      name: 'Outils',
      item: `${siteConfig.url}/outils`
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
      <ol className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-500">
        <li>
          <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Accueil
          </Link>
        </li>
        <li className="flex items-center space-x-2">
          <span className="mx-1">/</span>
          <Link href="/outils" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Outils
          </Link>
        </li>
        {toolName && (
          <li className="flex items-center space-x-2">
            <span className="mx-1">/</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
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

