const CLOSED = new Set([
  'de', 'le', 'la', 'les', 'un', 'une', 'des', 'du', 'au', 'aux', 'et', 'ou', 'en',
  'vos', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'mon', 'ma', 'mes', 'nos',
  'pour', 'par', 'sur', 'dans', 'avec', 'sans', 'que', 'qui', 'dont', 'ce',
  'pas', 'plus', 'api', 'seo', 'b2b', 'ia', 'rh',
])

function escapeReg(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Garde-fou d'affichage : un titre Notion mis en cache peut s'arrêter au milieu
 * d'un mot. On ne complète que par un mot déjà présent (slug, meta, contenu).
 * Sinon, ellipse après un mot entier.
 */
function endingFromLoadedCopy(title, post) {
  const stem = title.replace(/[\s.…]+$/u, '').trim()
  if (stem.length < 16) return null
  const sources = [post?.metaDescription || '', post?.contentMarkdown || '']
    .filter((part) => typeof part === 'string' && part.trim())
  for (const source of sources) {
    const idx = source.toLowerCase().indexOf(stem.toLowerCase())
    if (idx < 0) continue
    const rest = source.slice(idx + stem.length)
    const match = rest.match(/^(\s+\S+(?:\s+\S+){0,8})(?=\s*[.!?…]|\s*$)/)
    if (!match) continue
    const extra = match[1].trim()
    if (!extra || extra.length > 60) continue
    return `${stem} ${extra}`.replace(/\s+/g, ' ')
  }
  return null
}

export function displayPostTitle(post) {
  const title = String(post?.title || '').replace(/\s+/g, ' ').trim()
  const recovered = endingFromLoadedCopy(title, post)
  if (recovered) return recovered
  if (!title || /[.!?…:»"']$/.test(title)) return title

  const parts = title.split(' ')
  const last = parts[parts.length - 1].replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
  if (!last || CLOSED.has(last.toLowerCase()) || /^\d+$/.test(last)) return title

  const slug = typeof post?.slug === 'string' ? post.slug : ''
  const sources = [slug, post?.metaDescription || '', post?.contentMarkdown || '']
    .filter((part) => typeof part === 'string')
    .join('\n')

  const stem = last.toLowerCase()
  const extendsStem = (word) => {
    const lower = word.toLowerCase()
    return lower.startsWith(stem) && lower.length >= stem.length + 2
  }
  const slugExtensions = [...new Set(slug.split(/[^\p{L}\p{N}]+/u).filter(extendsStem))]
  const extensions = slugExtensions.length === 1
    ? slugExtensions
    : [
        ...new Set(
          sources.split(/[^\p{L}\p{N}]+/u).filter(extendsStem)
        ),
      ]

  if (extensions.length === 1 && stem.length >= 4) {
    const completed = extensions[0]
    const prefix = parts.slice(0, -1).join(' ')
    const rebuilt = `${prefix} ${completed}`.trim()
    const endsInSource = new RegExp(
      `${escapeReg(prefix)}\\s+${escapeReg(completed)}\\s*[.!?…]`,
      'i'
    ).test(sources)
    return endsInSource ? rebuilt : `${rebuilt}…`
  }

  if (last.length <= 4) {
    const prefix = parts.slice(0, -1).join(' ').trim()
    return prefix ? `${prefix}…` : title
  }

  return title
}
