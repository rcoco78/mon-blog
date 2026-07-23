import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'

function BlogFigure({ src, alt, caption, local = false }) {
  const showCaption =
    caption &&
    caption.trim() &&
    !/^image illustrative/i.test(caption) &&
    !/^capture[_\s-]?d/i.test(caption)

  return (
    <figure className="my-8">
      {local ? (
        <Image
          src={src}
          alt={alt}
          width={800}
          height={600}
          className="rounded-lg w-full h-auto"
          loading="lazy"
        />
      ) : (
        <img
          src={src}
          alt={alt}
          className="rounded-lg w-full h-auto"
          loading="lazy"
        />
      )}
      {showCaption ? (
        <figcaption className="mt-2 text-sm text-neutral-500 dark:text-neutral-500">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

export default function MarkdownRenderer({ children }) {
  if (!children) return null

  const getMarkdownContent = () => {
    if (!children) return null

    if (typeof children === 'string') {
      return children
    }

    if (typeof children === 'object' && children.parent) {
      return children.parent
    }

    if (typeof children === 'object') {
      const stringProps = Object.values(children).find((v) => typeof v === 'string')
      return stringProps || null
    }

    return null
  }

  let markdownContent = getMarkdownContent()

  if (!markdownContent) return null

  markdownContent = markdownContent
    .replace(/`([^`\n]*)\n([^`]*)`/g, '`$1$2`')
    .replace(/`\s+([^`\n]+?)\s+`/g, '`$1`')
    .replace(/```([^`]+?)```/g, (match, code) => {
      const trimmed = code.trim()
      if (trimmed.length < 50 && !trimmed.includes('\n')) {
        return `\`${trimmed}\``
      }
      return match
    })
    .replace(/\(ex:\s*([a-z0-9-]+)\)/gi, '(ex: `$1`)')
    .replace(/`([^`]+)`\s*\)\s*-\s*/g, '`$1`) - ')
    .replace(/`([^`]+)`\s*([)-])(?!\s)/g, '`$1` $2')
    .replace(/^(\s*[-*+])\s+([^`\n]*`[^`]+`[^`\n]*)\s+-\s+([^`\n]*`[^`]+`[^`\n]*)$/gm, (match, bullet, firstPart, secondPart) => {
      if (firstPart.includes('`') && secondPart.includes('`')) {
        return `${bullet} ${firstPart.trim()}\n${bullet} ${secondPart.trim()}`
      }
      return match
    })

  return (
    <div className="blog-prose prose prose-neutral dark:prose-invert max-w-none sm:max-w-[65ch]">
      <ReactMarkdown
        components={{
          img: ({ node, ...props }) => {
            const { src, alt, title } = props
            if (!src) return null

            let altText = alt || title || ''

            if (!altText && src) {
              const fileName = src.split('/').pop()?.split('?')[0] || ''
              if (fileName) {
                altText = fileName
                  .replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, '')
                  .replace(/[-_]/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())
                  .trim()
              }
            }

            if (!altText) {
              altText = "Image illustrative de l'article"
            }

            const caption = alt || title || ''
            const isExternal = src.startsWith('http://') || src.startsWith('https://')

            return (
              <BlogFigure
                src={src}
                alt={altText}
                caption={caption}
                local={!isExternal}
              />
            )
          },
          h1: ({ node, children, ...props }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim()
            return (
              <h1 id={id} className="text-2xl font-semibold tracking-tighter mb-4 mt-10 scroll-mt-24" {...props}>
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
              <h2 id={id} className="text-xl font-semibold tracking-tighter mb-4 mt-10 scroll-mt-24" {...props}>
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
              <h3 id={id} className="text-lg font-semibold tracking-tight mb-3 mt-8 scroll-mt-24" {...props}>
                {children}
              </h3>
            )
          },
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
            <li className="ml-4 leading-relaxed" {...props}>
              {children}
            </li>
          ),
          code: ({ node, inline, children, ...props }) => {
            const codeText = typeof children === 'string'
              ? children
              : (Array.isArray(children) ? children.join('') : String(children))

            const isInPre = node?.parent?.tagName === 'pre'

            if (isInPre) {
              return (
                <code
                  className="text-sm font-mono text-neutral-900 dark:text-neutral-100"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            const hasNoLineBreaks = !codeText.includes('\n')
            const isInlineCode = inline === true || (!isInPre && hasNoLineBreaks)

            if (isInlineCode) {
              return (
                <code
                  className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded px-1.5 py-0.5 text-sm font-mono border border-neutral-200 dark:border-neutral-700"
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
          pre: ({ node, children, ...props }) => {
            const codeNode = node?.children?.[0]
            const className = codeNode?.properties?.className?.[0] || ''
            const language = className?.replace('language-', '') || ''

            return (
              <pre className="bg-neutral-100 dark:bg-neutral-800 rounded p-4 overflow-x-auto mb-4" {...props}>
                {language && (
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-mono">
                    {language}
                  </div>
                )}
                {children}
              </pre>
            )
          },
          a: ({ node, children, href, ...props }) => {
            if (href && (href.includes('youtube.com/embed/') || href.includes('youtu.be/') || href.includes('youtube.com/watch?v='))) {
              let videoId = ''

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

            if (href && href.startsWith('#')) {
              return (
                <a
                  href={href}
                  className="text-neutral-900 dark:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-[3px] hover:decoration-neutral-900 dark:hover:decoration-neutral-100 transition-colors"
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

            return (
              <a
                href={href}
                className="text-neutral-900 dark:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-[3px] hover:decoration-neutral-900 dark:hover:decoration-neutral-100 transition-colors"
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            )
          },
          p: ({ node, children, ...props }) => {
            let text = ''
            if (typeof children === 'string') {
              text = children
            } else if (Array.isArray(children) && children.length === 1 && typeof children[0] === 'string') {
              text = children[0]
            } else if (children && typeof children.toString === 'function') {
              text = children.toString()
            }

            const trimmedText = text.trim()

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

            return (
              <p className="mb-5 leading-relaxed text-neutral-800 dark:text-neutral-200" {...props}>
                {children}
              </p>
            )
          },
          blockquote: ({ node, children, ...props }) => (
            <aside
              className="my-6 border-l border-neutral-300 dark:border-neutral-700 pl-4 text-neutral-800 dark:text-neutral-200 not-italic [&>p]:mb-0 [&>p]:leading-relaxed [&>p+p]:mt-2"
              {...props}
            >
              {children}
            </aside>
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-neutral-200 dark:border-neutral-800" {...props} />
          ),
          table: ({ node, children, ...props }) => (
            <div className="overflow-x-auto my-6 border border-neutral-200 dark:border-neutral-800">
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
            <tr className="border-b border-neutral-200 dark:border-neutral-800 last:border-b-0" {...props}>
              {children}
            </tr>
          ),
          th: ({ node, children, ...props }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100" {...props}>
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
