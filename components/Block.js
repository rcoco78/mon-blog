import ImageWithZoom from './ImageWithZoom'

const linkClassName =
  'text-neutral-900 dark:text-neutral-100 underline hover:text-neutral-600 dark:hover:text-neutral-400'

function getRichTextHref(text) {
  if (!text) return null
  if (typeof text.href === 'string' && text.href) return text.href
  const linkUrl = text.text?.link?.url
  if (typeof linkUrl === 'string' && linkUrl) return linkUrl
  return null
}

function RichText({ texts }) {
  if (!Array.isArray(texts) || texts.length === 0) return null

  return texts.map((text, i) => {
    const content = text?.plain_text || ''
    if (!content) return null

    const className = [
      text?.annotations?.bold ? 'font-bold' : '',
      text?.annotations?.italic ? 'italic' : '',
      text?.annotations?.strikethrough ? 'line-through' : '',
      text?.annotations?.underline ? 'underline' : '',
      text?.annotations?.code
        ? 'bg-neutral-100 dark:bg-neutral-800 rounded px-1 font-mono text-[0.9em]'
        : '',
    ]
      .filter(Boolean)
      .join(' ')

    let node = (
      <span key={i} className={className || undefined}>
        {content}
      </span>
    )

    const href = getRichTextHref(text)
    if (href) {
      const isExternal = /^https?:\/\//i.test(href)
      node = (
        <a
          key={i}
          href={href}
          className={[linkClassName, className].filter(Boolean).join(' ')}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {content}
        </a>
      )
    }

    return node
  })
}

export default function Block({ block }) {
  const { type, id } = block
  const value = block[type]

  if (!value) {
    return null
  }

  switch (type) {
    case 'paragraph':
      if (!value.rich_text || !Array.isArray(value.rich_text) || value.rich_text.length === 0) {
        return null
      }
      return (
        <p className="mb-4">
          <RichText texts={value.rich_text} />
        </p>
      )
    case 'heading_1':
      // IMPORTANT SEO : Convertir heading_1 en H2 dans le contenu
      // Car les pages ont déjà un H1 pour le titre principal
      // Un seul H1 par page est requis pour un bon SEO
      if (!value.rich_text || !Array.isArray(value.rich_text) || value.rich_text.length === 0) {
        return null
      }
      return (
        <h2 className="text-3xl font-bold mb-4">
          <RichText texts={value.rich_text} />
        </h2>
      )
    case 'heading_2':
      if (!value.rich_text || !Array.isArray(value.rich_text) || value.rich_text.length === 0) {
        return null
      }
      return (
        <h2 className="text-2xl font-bold mb-4">
          <RichText texts={value.rich_text} />
        </h2>
      )
    case 'heading_3':
      if (!value.rich_text || !Array.isArray(value.rich_text) || value.rich_text.length === 0) {
        return null
      }
      return (
        <h3 className="text-xl font-bold mb-4">
          <RichText texts={value.rich_text} />
        </h3>
      )
    case 'bulleted_list_item':
      if (!value.rich_text || !Array.isArray(value.rich_text) || value.rich_text.length === 0) {
        return null
      }
      return (
        <ul className="list-disc ml-4 mb-4">
          <li>
            <RichText texts={value.rich_text} />
          </li>
        </ul>
      )
    case 'numbered_list_item':
      if (!value.rich_text || !Array.isArray(value.rich_text) || value.rich_text.length === 0) {
        return null
      }
      return (
        <ol className="list-decimal ml-4 mb-4">
          <li>
            <RichText texts={value.rich_text} />
          </li>
        </ol>
      )
    case 'code':
      if (!value.rich_text || !Array.isArray(value.rich_text)) {
        return null
      }
      return (
        <pre className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mb-4 overflow-x-auto">
          <code>{value.rich_text.map((text) => text?.plain_text || '').join('')}</code>
        </pre>
      )
    case 'image':
      if (!block.image) {
        return null
      }
      const imageUrl =
        block.image.type === 'external' ? block.image.external?.url : block.image.file?.url

      if (!imageUrl) {
        return null
      }

      const caption =
        block.image.caption && Array.isArray(block.image.caption) && block.image.caption.length > 0
          ? block.image.caption[0]?.plain_text || ''
          : ''

      return <ImageWithZoom src={imageUrl} alt={caption || "Image illustrative de l'article"} />
    default:
      return null
  }
}
