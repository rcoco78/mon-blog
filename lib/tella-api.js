/**
 * Client API Tella pour lister les vidéos d'une playlist
 * Utilisé par le cron marketplace-videos
 */

const TELLA_API_BASE = 'https://api.tella.com'

/**
 * Liste toutes les vidéos d'une playlist Tella (paginated)
 * @param {string} playlistId - ID playlist (ex. pl_xxx)
 * @param {string} apiKey - TELLA_API_KEY
 * @returns {Promise<Array<{ id: string, name: string, description: string, embedPage: string }>>}
 */
export async function listVideosByPlaylist(playlistId, apiKey) {
  if (!apiKey || !playlistId) {
    return []
  }

  const videos = []
  let cursor = null

  do {
    const params = new URLSearchParams()
    params.set('limit', '100')
    if (cursor) params.set('cursor', cursor)

    const url = `${TELLA_API_BASE}/v1/videos?playlistId=${encodeURIComponent(playlistId)}&${params}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[tella-api] Erreur list videos', res.status, text)
      break
    }

    const data = await res.json()
    const list = data.videos || []
    list.forEach((v) => {
      videos.push({
        id: v.id,
        name: v.name || '',
        description: v.description || '',
        embedPage: v.links?.embedPage || `https://www.tella.tv/video/${v.id}/embed`,
      })
    })

    cursor = data.pagination?.hasMore ? data.pagination?.nextCursor : null
  } while (cursor)

  return videos
}
