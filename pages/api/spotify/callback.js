// Callback OAuth pour Spotify
// Cette route gère la redirection après autorisation Spotify

import { useRouter } from 'next/router'

export default async function handler(req, res) {
  const { code, error } = req.query

  if (error) {
    return res.redirect(`/spotify?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return res.redirect('/spotify?error=no_code')
  }

  try {
    // Échanger le code contre un access token et refresh token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.corentinrobert.fr'}/api/spotify/callback`
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Error exchanging code:', errorData)
      return res.redirect(`/spotify?error=token_exchange_failed`)
    }

    const tokens = await tokenResponse.json()
    
    // Afficher le refresh token pour que l'utilisateur puisse le copier
    // En production, vous pourriez vouloir le stocker de manière sécurisée
    return res.redirect(`/spotify?refresh_token=${tokens.refresh_token}`)
  } catch (error) {
    console.error('Error in callback:', error)
    return res.redirect(`/spotify?error=callback_error`)
  }
}

