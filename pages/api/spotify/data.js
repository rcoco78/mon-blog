// API route pour récupérer les données Spotify
// Utilise l'API Spotify avec OAuth

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Récupérer un access token
    const accessToken = await getSpotifyAccessToken()
    
    if (!accessToken) {
      return res.status(500).json({ error: 'Impossible d\'obtenir un token d\'accès Spotify' })
    }

    // Récupérer le time_range depuis les query params (par défaut: short_term)
    const timeRange = req.query.time_range || 'short_term' // short_term, medium_term, long_term

    // Récupérer les données en parallèle
    const [currentlyPlaying, topTracks, topArtists, recentlyPlayed] = await Promise.all([
      getCurrentlyPlaying(accessToken),
      getTopTracks(accessToken, timeRange),
      getTopArtists(accessToken, timeRange),
      getRecentlyPlayed(accessToken)
    ])

    res.status(200).json({
      currentlyPlaying,
      topTracks: topTracks.slice(0, 5), // Top 5 seulement
      topArtists: topArtists.slice(0, 5), // Top 5 seulement
      recentlyPlayed: recentlyPlayed.slice(0, 10), // 10 dernières musiques
      timeRange
    })
  } catch (error) {
    console.error('Error fetching Spotify data:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des données Spotify' })
  }
}

/**
 * Obtient un access token Spotify via Client Credentials Flow
 * Pour accéder aux données publiques, on peut utiliser Client Credentials
 * Mais pour les données utilisateur (currently playing, top tracks), il faut OAuth avec l'utilisateur
 * 
 * Pour simplifier, on utilise un refresh token stocké en variable d'environnement
 */
async function getSpotifyAccessToken() {
  try {
    // Vérifier que les variables d'environnement sont configurées
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.error('SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not configured')
      return null
    }

    // Si on a un refresh token, l'utiliser pour obtenir un nouvel access token
    if (process.env.SPOTIFY_REFRESH_TOKEN) {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: process.env.SPOTIFY_REFRESH_TOKEN
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Si un nouveau refresh token est fourni, on pourrait le sauvegarder
        // mais pour l'instant on garde celui en variable d'environnement
        return data.access_token
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error refreshing Spotify token:', errorData)
        // Si le refresh token est invalide, on ne peut pas continuer
        return null
      }
    }

    // Fallback : Client Credentials Flow (pour les données publiques uniquement)
    // Note: Ce flow ne permet PAS d'accéder aux données utilisateur (currently playing, top tracks)
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })

    if (response.ok) {
      const data = await response.json()
      return data.access_token
    }

    console.error('Failed to get access token with client credentials')
    return null
  } catch (error) {
    console.error('Error getting Spotify access token:', error)
    return null
  }
}

/**
 * Récupère la musique actuellement en cours d'écoute
 */
async function getCurrentlyPlaying(accessToken) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (response.status === 204 || !response.ok) {
      // Pas de musique en cours ou erreur
      return null
    }

    const data = await response.json()
    return data.item
  } catch (error) {
    console.error('Error fetching currently playing:', error)
    return null
  }
}

/**
 * Récupère le top des musiques
 * @param {string} accessToken - Token d'accès Spotify
 * @param {string} timeRange - short_term (4 semaines), medium_term (6 mois), long_term (toute la vie)
 */
async function getTopTracks(accessToken, timeRange = 'short_term') {
  try {
    const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=20`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Error fetching top tracks:', error)
    return []
  }
}

/**
 * Récupère le top des artistes
 * @param {string} accessToken - Token d'accès Spotify
 * @param {string} timeRange - short_term (4 semaines), medium_term (6 mois), long_term (toute la vie)
 */
async function getTopArtists(accessToken, timeRange = 'short_term') {
  try {
    const response = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=20`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Error fetching top artists:', error)
    return []
  }
}

/**
 * Récupère les dernières musiques écoutées
 */
async function getRecentlyPlayed(accessToken) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    // Transformer les données pour avoir le même format que les tracks
    // et préserver played_at pour le tri
    const tracks = (data.items || []).map(item => ({
      ...item.track,
      played_at: item.played_at
    }))
    
    // Trier par date de lecture (les plus récentes en premier)
    // L'API Spotify retourne déjà dans l'ordre chronologique, mais on s'assure du tri
    return tracks.sort((a, b) => {
      if (!a.played_at || !b.played_at) return 0
      return new Date(b.played_at) - new Date(a.played_at)
    })
  } catch (error) {
    console.error('Error fetching recently played:', error)
    return []
  }
}


      return new Date(b.played_at) - new Date(a.played_at)
    })
  } catch (error) {
    console.error('Error fetching recently played:', error)
    return []
  }
}

