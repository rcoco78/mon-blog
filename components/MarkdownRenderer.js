import ReactMarkdown from 'react-markdown'
import Image from 'next/image'

export default function MarkdownRenderer({ children }) {
  if (!children) return null

  // Extraire le contenu markdown selon la structure
  const getMarkdownContent = () => {
    if (!children) return null

    // Si c'est une string, retourner directement
    if (typeof children === 'string') {
      return children
    }

    // Si c'est un objet avec une propriété parent (structure notion-to-md)
    if (typeof children === 'object' && children.parent) {
      return children.parent
    }

    // Si c'est un objet, chercher une propriété string
    if (typeof children === 'object') {
      const stringProps = Object.values(children).find((v) => typeof v === 'string')
      return stringProps || null
    }

    return null
  }

  const markdownContent = getMarkdownContent()

  if (!markdownContent) return null

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          // Images avec Next.js Image
          img: ({ node, ...props }) => {
            const { src, alt } = props
            if (!src) return null

            // Si c'est une URL externe, utiliser img normal
            if (src.startsWith('http://') || src.startsWith('https://')) {
              return (
                <span className="block my-6">
                  <img
                    src={src}
                    alt={alt || ''}
                    className="rounded-lg w-full h-auto"
                    loading="lazy"
                  />
                </span>
              )
            }

            // Sinon, essayer avec Next.js Image (pour les images locales)
            return (
              <span className="block my-6">
                <Image
                  src={src}
                  alt={alt || ''}
                  width={800}
                  height={600}
                  className="rounded-lg w-full h-auto"
                  loading="lazy"
                />
              </span>
            )
          },
          // Titres avec IDs pour le sommaire
          h1: ({ node, children, ...props }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim()
            return (
              <h1 id={id} className="text-3xl font-bold mb-4 mt-8" {...props}>
                {children}
              </h1>
            )
          },
          h2: ({ node, children, ...props }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim()
            return (
              <h2 id={id} className="text-2xl font-bold mb-4 mt-6" {...props}>
                {children}
              </h2>
            )
          },
          h3: ({ node, children, ...props }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim()
            return (
              <h3 id={id} className="text-xl font-semibold mb-3 mt-5" {...props}>
                {children}
              </h3>
            )
          },
          // Paragraphes
          p: ({ node, children, ...props }) => (
            <p className="mb-4 leading-relaxed" {...props}>
              {children}
            </p>
          ),
          // Listes
          ul: ({ node, children, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2" {...props}>
              {children}
            </ul>
          ),
          ol: ({ node, children, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2" {...props}>
              {children}
            </ol>
          ),
          li: ({ node, children, ...props }) => (
            <li className="ml-4" {...props}>
              {children}
            </li>
          ),
          // Code
          code: ({ node, inline, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className="bg-neutral-100 dark:bg-neutral-800 rounded px-1.5 py-0.5 text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <code
                className="block bg-neutral-100 dark:bg-neutral-800 rounded p-4 text-sm font-mono overflow-x-auto mb-4"
                {...props}
              >
                {children}
              </code>
            )
          },
          pre: ({ node, children, ...props }) => (
            <pre className="bg-neutral-100 dark:bg-neutral-800 rounded p-4 overflow-x-auto mb-4" {...props}>
              {children}
            </pre>
          ),
          // Liens
          a: ({ node, children, href, ...props }) => (
            <a
              href={href}
              className="text-neutral-900 dark:text-neutral-100 underline hover:text-neutral-600 dark:hover:text-neutral-400"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              {...props}
            >
              {children}
            </a>
          ),
          // Blockquote
          blockquote: ({ node, children, ...props }) => (
            <blockquote
              className="border-l-4 border-neutral-300 dark:border-neutral-700 pl-4 italic my-4 text-neutral-600 dark:text-neutral-400"
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Séparateur
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-neutral-200 dark:border-neutral-800" {...props} />
          ),
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    </div>
  )
}

