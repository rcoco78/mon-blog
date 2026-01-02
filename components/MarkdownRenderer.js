import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
          // Images avec Next.js Image - toujours avec alt-text (comme logement-atypique)
          img: ({ node, ...props }) => {
            const { src, alt, title } = props
            if (!src) return null

            // Générer un alt-text automatique si pas fourni (comme logement-atypique)
            let altText = alt || title || ''
            
            // Si pas d'alt-text, essayer de l'extraire du nom de fichier
            if (!altText && src) {
              const fileName = src.split('/').pop()?.split('?')[0] || ''
              if (fileName) {
                // Nettoyer le nom de fichier pour créer un alt-text descriptif
                altText = fileName
                  .replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, '') // Enlever l'extension
                  .replace(/[-_]/g, ' ') // Remplacer tirets et underscores par espaces
                  .replace(/\b\w/g, l => l.toUpperCase()) // Capitaliser chaque mot
                  .trim()
              }
            }
            
            // Fallback si toujours pas d'alt-text
            if (!altText) {
              altText = 'Image illustrative de l\'article'
            }

            // Si c'est une URL externe, utiliser img normal
            if (src.startsWith('http://') || src.startsWith('https://')) {
              return (
                <span className="block my-6">
                  <img
                    src={src}
                    alt={altText}
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
                  alt={altText}
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
          a: ({ node, children, href, ...props }) => {
            // Détection des vidéos YouTube (comme dans logement-atypique)
            if (href && (href.includes('youtube.com/embed/') || href.includes('youtu.be/') || href.includes('youtube.com/watch?v='))) {
              let videoId = ''
              
              // Extraire l'ID de la vidéo selon le format de l'URL
              if (href.includes('youtube.com/embed/')) {
                videoId = href.split('youtube.com/embed/')[1]?.split('?')[0]
              } else if (href.includes('youtu.be/')) {
                videoId = href.split('youtu.be/')[1]?.split('?')[0]
              } else if (href.includes('youtube.com/watch?v=')) {
                videoId = href.split('v=')[1]?.split('&')[0]
              }
              
              if (videoId) {
                return (
                  <div className="my-6">
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )
              }
            }
            
            // Lien ancre interne
            if (href && href.startsWith('#')) {
              return (
                <a
                  href={href}
                  className="text-neutral-900 dark:text-neutral-100 underline hover:text-neutral-600 dark:hover:text-neutral-400"
                  onClick={(e) => {
                    e.preventDefault()
                    const element = document.getElementById(href.substring(1))
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  {...props}
                >
                  {children}
                </a>
              )
            }
            
            // Lien externe normal
            return (
              <a
                href={href}
                className="text-neutral-900 dark:text-neutral-100 underline hover:text-neutral-600 dark:hover:text-neutral-400"
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            )
          },
          // Paragraphes - détecter les URLs YouTube brutes
          p: ({ node, children, ...props }) => {
            // Si le contenu est une URL YouTube, la convertir en iframe
            // Vérifier si children est une string ou un array avec une seule string
            let text = ''
            if (typeof children === 'string') {
              text = children
            } else if (Array.isArray(children) && children.length === 1 && typeof children[0] === 'string') {
              text = children[0]
            } else if (children && typeof children.toString === 'function') {
              text = children.toString()
            }
            
            const trimmedText = text.trim()
            
            // Détecter les URLs YouTube (embed, youtu.be, ou watch)
            if (trimmedText && (
              trimmedText.includes('youtube.com/embed/') || 
              trimmedText.includes('youtu.be/') || 
              trimmedText.includes('youtube.com/watch?v=')
            )) {
              let videoId = ''
              
              if (trimmedText.includes('youtube.com/embed/')) {
                videoId = trimmedText.split('youtube.com/embed/')[1]?.split('?')[0]?.split('&')[0]
              } else if (trimmedText.includes('youtu.be/')) {
                videoId = trimmedText.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0]
              } else if (trimmedText.includes('youtube.com/watch?v=')) {
                videoId = trimmedText.split('v=')[1]?.split('&')[0]
              }
              
              if (videoId) {
                return (
                  <div className="my-6">
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )
              }
            }
            
            // Paragraphe normal
            return (
              <p className="mb-4 leading-relaxed" {...props}>
                {children}
              </p>
            )
          },
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
          // Tableaux - style amélioré avec coins arrondis et design system
          table: ({ node, children, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <table className="min-w-full border-collapse" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ node, children, ...props }) => (
            <thead className="bg-neutral-50 dark:bg-neutral-900/50" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ node, children, ...props }) => (
            <tbody className="bg-white dark:bg-neutral-950" {...props}>
              {children}
            </tbody>
          ),
          tr: ({ node, children, ...props }) => (
            <tr className="border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors" {...props}>
              {children}
            </tr>
          ),
          th: ({ node, children, ...props }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100 first:rounded-tl-lg last:rounded-tr-lg" {...props}>
              {children}
            </th>
          ),
          td: ({ node, children, ...props }) => (
            <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300" {...props}>
              {children}
            </td>
          ),
        }}
        remarkPlugins={[remarkGfm]}
      >
        {markdownContent}
      </ReactMarkdown>
    </div>
  )
}

