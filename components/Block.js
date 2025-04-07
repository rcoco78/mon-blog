import Image from 'next/image'
import ImageWithZoom from './ImageWithZoom'

export default function Block({ block }) {
  const { type, id } = block
  const value = block[type]

  switch (type) {
    case 'paragraph':
      return (
        <p className="mb-4">
          {value.rich_text.map((text, i) => (
            <span
              key={i}
              className={`${
                text.annotations.bold ? 'font-bold' : ''
              } ${
                text.annotations.italic ? 'italic' : ''
              } ${
                text.annotations.strikethrough ? 'line-through' : ''
              } ${
                text.annotations.code ? 'bg-neutral-100 dark:bg-neutral-800 rounded px-1' : ''
              }`}
            >
              {text.plain_text}
            </span>
          ))}
        </p>
      )
    case 'heading_1':
      return (
        <h1 className="text-3xl font-bold mb-4">
          {value.rich_text.map((text, i) => (
            <span key={i}>{text.plain_text}</span>
          ))}
        </h1>
      )
    case 'heading_2':
      return (
        <h2 className="text-2xl font-bold mb-4">
          {value.rich_text.map((text, i) => (
            <span key={i}>{text.plain_text}</span>
          ))}
        </h2>
      )
    case 'heading_3':
      return (
        <h3 className="text-xl font-bold mb-4">
          {value.rich_text.map((text, i) => (
            <span key={i}>{text.plain_text}</span>
          ))}
        </h3>
      )
    case 'bulleted_list_item':
      return (
        <ul className="list-disc ml-4 mb-4">
          <li>
            {value.rich_text.map((text, i) => (
              <span key={i}>{text.plain_text}</span>
            ))}
          </li>
        </ul>
      )
    case 'numbered_list_item':
      return (
        <ol className="list-decimal ml-4 mb-4">
          <li>
            {value.rich_text.map((text, i) => (
              <span key={i}>{text.plain_text}</span>
            ))}
          </li>
        </ol>
      )
    case 'code':
      return (
        <pre className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mb-4 overflow-x-auto">
          <code>{value.rich_text.map((text, i) => text.plain_text).join('')}</code>
        </pre>
      )
    case 'image':
      const imageUrl = block.image.type === 'external' ? block.image.external.url : block.image.file.url
      const caption = block.image.caption && block.image.caption.length > 0 ? block.image.caption[0].plain_text : ''
      
      return (
        <ImageWithZoom 
          src={imageUrl}
          alt={caption}
        />
      )
    default:
      return null
  }
} 