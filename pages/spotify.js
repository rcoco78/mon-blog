import { useState, useEffect } from 'react'
import Image from 'next/image'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'

const TIME_RANGE_OPTIONS = [
  { value: 'short_term', label: '4 semaines' },
  { value: 'medium_term', label: '6 mois' },
  { value: 'long_term', label: 'Toute la vie' },
]

const rowClassName =
  'group flex items-center gap-3 py-3 border-b border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-500 transition-colors'

function CoverThumb({ src, alt, size = 32 }) {
  if (!src) return null
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="object-cover flex-shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

export default function Spotify() {
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)
  const [topTracks, setTopTracks] = useState([])
  const [topArtists, setTopArtists] = useState([])
  const [recentlyPlayed, setRecentlyPlayed] = useState([])
  const [timeRange, setTimeRange] = useState('short_term') // short_term, medium_term, long_term
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [errorReason, setErrorReason] = useState(null)
  const [newRefreshToken, setNewRefreshToken] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const tokenFromCallback = params.get('refresh_token')
    if (tokenFromCallback) {
      setNewRefreshToken(tokenFromCallback)
      // Retirer le secret de l'URL pour éviter qu'il reste dans l'historique
      const cleanUrl = window.location.pathname
      window.history.replaceState({}, '', cleanUrl)
    }
  }, [])

  useEffect(() => {
    const fetchSpotifyData = async () => {
      try {
        setLoading(true)

        // Récupérer les données depuis notre API avec le time_range sélectionné
        const response = await fetch(`/api/spotify/data?time_range=${timeRange}`)
        const data = await response.json()

        if (data.error) {
          setError(data.error)
          setErrorReason(data.reason || null)
        } else {
          setError(null)
          setErrorReason(null)
          setCurrentlyPlaying(data.currentlyPlaying)
          setTopTracks(data.topTracks || [])
          setTopArtists(data.topArtists || [])
          setRecentlyPlayed(data.recentlyPlayed || [])
        }
      } catch (err) {
        console.error('Error fetching Spotify data:', err)
        setError('Impossible de charger les données Spotify')
        setErrorReason(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSpotifyData()

    // Rafraîchir toutes les 30 secondes pour la musique en cours
    const interval = setInterval(fetchSpotifyData, 30000)
    return () => clearInterval(interval)
  }, [timeRange])

  // Fonction pour formater la durée en minutes:secondes
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Fonction pour obtenir le label du time range
  const getTimeRangeLabel = (range) => {
    const labels = {
      short_term: '4 semaines',
      medium_term: '6 mois',
      long_term: 'Toute la vie',
    }
    return labels[range] || range
  }

  const errorDetail =
    errorReason === 'refresh_revoked'
      ? 'Le refresh token Spotify a été révoqué. Régénérez-le en ouvrant /api/spotify/auth, puis mettez à jour SPOTIFY_REFRESH_TOKEN sur Vercel.'
      : errorReason === 'missing_credentials'
        ? 'SPOTIFY_CLIENT_ID ou SPOTIFY_CLIENT_SECRET manquant sur Vercel.'
        : 'Vérifiez que les variables d\'environnement Spotify sont bien configurées sur Vercel.'

  const pageSEO = generatePageSEO({
    title: 'Musique - Ce que j\'écoute sur Spotify | Corentin Robert',
    description: `Découvrez mes musiques préférées sur Spotify : top ${topTracks.length > 0 ? topTracks.length : 5} morceaux, artistes favoris et dernières écoutes. Playlist personnelle mise à jour en temps réel.`,
    path: '/spotify',
    keywords: ['spotify', 'musique', 'playlist', 'musique du moment', 'top tracks', 'artistes favoris', 'musique préférée'],
  })

  return (
    <>
      <SEOHead {...pageSEO} />

      {/* Structured Data - CollectionPage */}
      <StructuredData
        type="CollectionPage"
        data={{
          name: 'Musique - Ce que j\'écoute',
          description: 'Découvrez ce que j\'écoute en ce moment et mes musiques préférées sur Spotify',
          url: `${siteConfig.url}/spotify`,
        }}
      />

      {/* Structured Data - ItemList pour Top Tracks */}
      {topTracks.length > 0 && (
        <StructuredData
          type="ItemList"
          data={{
            name: `Top ${topTracks.length} musiques - ${getTimeRangeLabel(timeRange)}`,
            description: `Mes ${topTracks.length} musiques les plus écoutées sur ${getTimeRangeLabel(timeRange)}`,
            numberOfItems: topTracks.length,
            items: topTracks.map((track, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'MusicRecording',
                name: track.name,
                byArtist: {
                  '@type': 'MusicGroup',
                  name: track.artists?.map((a) => a.name).join(', ') || 'Artiste inconnu',
                },
                duration: track.duration_ms
                  ? `PT${Math.floor(track.duration_ms / 1000)}S`
                  : undefined,
                inAlbum: track.album
                  ? {
                      '@type': 'MusicAlbum',
                      name: track.album.name,
                      image: track.album.images?.[0]?.url,
                    }
                  : undefined,
                url: track.external_urls?.spotify,
                image: track.album?.images?.[0]?.url,
              },
            })),
          }}
        />
      )}

      {/* Structured Data - ItemList pour Top Artists */}
      {topArtists.length > 0 && (
        <StructuredData
          type="ItemList"
          data={{
            name: `Top ${topArtists.length} artistes - ${getTimeRangeLabel(timeRange)}`,
            description: `Mes ${topArtists.length} artistes les plus écoutés sur ${getTimeRangeLabel(timeRange)}`,
            numberOfItems: topArtists.length,
            items: topArtists.map((artist, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'MusicGroup',
                name: artist.name,
                image: artist.images?.[0]?.url,
                genre: artist.genres || [],
                url: artist.external_urls?.spotify,
              },
            })),
          }}
        />
      )}

      {/* Structured Data - MusicRecording pour la musique en cours */}
      {currentlyPlaying && (
        <StructuredData
          type="MusicRecording"
          data={{
            name: currentlyPlaying.name,
            artists: currentlyPlaying.artists,
            duration: currentlyPlaying.duration_ms,
            inAlbum: currentlyPlaying.album,
            url: currentlyPlaying.external_urls?.spotify,
            image: currentlyPlaying.album?.images?.[0]?.url,
          }}
        />
      )}

      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-3 tracking-tighter">Musique</h1>
          <p className="text-neutral-600 dark:text-neutral-400 tracking-tight">
            Découvrez ce que j&apos;écoute en ce moment et mes musiques préférées.
          </p>

          {newRefreshToken && (
            <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
              <p>
                Nouveau refresh token généré. Copiez-le dans{' '}
                <code className="text-xs">SPOTIFY_REFRESH_TOKEN</code> (Production Vercel),
                redéployez. Ne le partagez pas.
              </p>
              <pre className="text-xs break-all whitespace-pre-wrap select-all text-neutral-800 dark:text-neutral-200">
                {newRefreshToken}
              </pre>
            </div>
          )}

          {loading && (
            <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
              <p>Chargement des données Spotify…</p>
              <p className="text-neutral-500 dark:text-neutral-500">
                Top morceaux, artistes et écoutes récentes.
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
              <p>Impossible d&apos;afficher Spotify — {error}</p>
              <p className="text-neutral-500 dark:text-neutral-500">{errorDetail}</p>
            </div>
          )}
        </section>

        {!loading && !error && (
          <>
            {currentlyPlaying && (
              <section className="journal-rule pt-5 mb-10" aria-label="En ce moment">
                <h2 className="font-semibold text-xl mb-3 tracking-tighter">
                  En ce moment{' '}
                  <span className="font-normal text-sm text-neutral-500 dark:text-neutral-500">
                    en direct
                  </span>
                </h2>
                <div className="flex items-center gap-3 text-sm">
                  <CoverThumb
                    src={currentlyPlaying.album?.images?.[0]?.url}
                    alt=""
                    size={36}
                  />
                  <div className="min-w-0 flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-neutral-900 dark:text-neutral-100 font-medium truncate">
                      {currentlyPlaying.name}
                    </span>
                    <span className="text-neutral-600 dark:text-neutral-400 truncate">
                      {currentlyPlaying.artists?.map((a) => a.name).join(', ')}
                    </span>
                    {currentlyPlaying.external_urls?.spotify && (
                      <a
                        href={currentlyPlaying.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-600 hover:decoration-neutral-900 dark:hover:decoration-neutral-100 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                      >
                        Spotify
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className={`${currentlyPlaying ? 'mt-2' : 'journal-rule pt-5'} mb-10`}>
              <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex flex-nowrap gap-x-4 overflow-x-auto pb-1 text-sm scrollbar-hide">
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTimeRange(option.value)}
                      className={`shrink-0 whitespace-nowrap pb-1 border-b border-dashed ${
                        timeRange === option.value
                          ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                          : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {topTracks.length > 0 && (
                <div className="mb-10">
                  <h2 className="font-semibold text-xl mb-2 tracking-tighter">
                    Top morceaux
                  </h2>
                  <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400 tracking-tight">
                    {getTimeRangeLabel(timeRange)}
                  </p>
                  <div>
                    {topTracks.map((track, index) => (
                      <a
                        key={track.id}
                        href={track.external_urls?.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={rowClassName}
                      >
                        <span className="text-xs tabular-nums text-neutral-400 dark:text-neutral-500 w-5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <CoverThumb
                          src={track.album?.images?.[0]?.url}
                          alt=""
                          size={32}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate underline-offset-2 group-hover:underline decoration-neutral-300 dark:decoration-neutral-600">
                            {track.name}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 truncate">
                            {track.artists?.map((a) => a.name).join(', ')}
                            {track.duration_ms ? ` · ${formatDuration(track.duration_ms)}` : ''}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {topArtists.length > 0 && (
                <div className="mb-10">
                  <h2 className="font-semibold text-xl mb-2 tracking-tighter">
                    Top artistes
                  </h2>
                  <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400 tracking-tight">
                    {getTimeRangeLabel(timeRange)}
                  </p>
                  <div>
                    {topArtists.map((artist, index) => (
                      <a
                        key={artist.id}
                        href={artist.external_urls?.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={rowClassName}
                      >
                        <span className="text-xs tabular-nums text-neutral-400 dark:text-neutral-500 w-5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <CoverThumb
                          src={artist.images?.[0]?.url}
                          alt=""
                          size={32}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate underline-offset-2 group-hover:underline decoration-neutral-300 dark:decoration-neutral-600">
                            {artist.name}
                          </p>
                          {artist.genres && artist.genres.length > 0 && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 truncate">
                              {artist.genres.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {recentlyPlayed.length > 0 && (
              <section className="journal-rule pt-5 mb-16" aria-label="Récemment écouté">
                <h2 className="font-semibold text-xl mb-2 tracking-tighter">Récemment</h2>
                <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400 tracking-tight">
                  Dernières écoutes.
                </p>
                <div>
                  {recentlyPlayed.slice(0, 10).map((track) => (
                    <a
                      key={`${track.id}-${track.played_at || ''}`}
                      href={track.external_urls?.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={rowClassName}
                    >
                      <CoverThumb
                        src={
                          track.album?.images?.[2]?.url || track.album?.images?.[0]?.url
                        }
                        alt=""
                        size={32}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate underline-offset-2 group-hover:underline decoration-neutral-300 dark:decoration-neutral-600">
                          {track.name}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 truncate">
                          {track.artists?.map((a) => a.name).join(', ')}
                          {track.duration_ms ? ` · ${formatDuration(track.duration_ms)}` : ''}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  )
}
