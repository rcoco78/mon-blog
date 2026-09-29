// Démarre le flux OAuth Spotify pour (re)générer un refresh token.
// Usage one-shot : ouvrir /api/spotify/auth dans le navigateur, autoriser, puis
// copier le refresh_token affiché sur /spotify et le mettre dans Vercel.

const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-top-read',
  'user-read-playback-state'
].join(' ')

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  if (!clientId) {
    return res.status(500).json({
      error: 'SPOTIFY_CLIENT_ID manquant. Configurez les variables Spotify sur Vercel.'
    })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.corentinrobert.fr'}/api/spotify/callback`
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SPOTIFY_SCOPES,
    redirect_uri: redirectUri,
    show_dialog: 'true'
  })

  return res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`)
}
