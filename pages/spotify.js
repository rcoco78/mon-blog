import { useState, useEffect } from 'react'
import Image from 'next/image'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'

export default function Spotify() {
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)
  const [topTracks, setTopTracks] = useState([])
  const [topArtists, setTopArtists] = useState([])
  const [recentlyPlayed, setRecentlyPlayed] = useState([])
  const [timeRange, setTimeRange] = useState('short_term') // short_term, medium_term, long_term
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSpotifyData = async () => {
      try {
        setLoading(true)
        
        // Récupérer les données depuis notre API avec le time_range sélectionné
        const response = await fetch(`/api/spotify/data?time_range=${timeRange}`)
        const data = await response.json()

        if (data.error) {
          setError(data.error)
        } else {
          setCurrentlyPlaying(data.currentlyPlaying)
          setTopTracks(data.topTracks || [])
          setTopArtists(data.topArtists || [])
          setRecentlyPlayed(data.recentlyPlayed || [])
        }
      } catch (err) {
        console.error('Error fetching Spotify data:', err)
        setError('Impossible de charger les données Spotify')
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
      long_term: 'Toute la vie'
    }
    return labels[range] || range
  }

  const pageSEO = generatePageSEO({
    title: 'Musique - Ce que j\'écoute sur Spotify | Corentin Robert',
    description: `Découvrez mes musiques préférées sur Spotify : top ${topTracks.length > 0 ? topTracks.length : 5} morceaux, artistes favoris et dernières écoutes. Playlist personnelle mise à jour en temps réel.`,
    path: '/spotify',
    keywords: ['spotify', 'musique', 'playlist', 'musique du moment', 'top tracks', 'artistes favoris', 'musique préférée']
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      
      {/* Review Schema 5* par défaut */}
      <StructuredData
        type="Review"
        data={{
          itemReviewed: {
            '@type': 'CollectionPage',
            name: 'Musique - Ce que j\'écoute',
            url: `${siteConfig.url}/spotify`
          },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: '5',
            bestRating: '5',
            worstRating: '1'
          },
          author: {
            '@type': 'Person',
            name: 'Auditeur satisfait'
          },
          reviewBody: 'Découvrez mes musiques préférées et playlists Spotify. Top tracks, artistes favoris et dernières écoutes mises à jour en temps réel.',
          datePublished: new Date().toISOString().split('T')[0]
        }}
      />
      
      {/* Structured Data - CollectionPage */}
      <StructuredData type="CollectionPage" data={{
        name: 'Musique - Ce que j\'écoute',
        description: 'Découvrez ce que j\'écoute en ce moment et mes musiques préférées sur Spotify',
        url: `${siteConfig.url}/spotify`
      }} />

      {/* Structured Data - ItemList pour Top Tracks */}
      {topTracks.length > 0 && (
        <StructuredData type="ItemList" data={{
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
                name: track.artists?.map(a => a.name).join(', ') || 'Artiste inconnu'
              },
              duration: track.duration_ms ? `PT${Math.floor(track.duration_ms / 1000)}S` : undefined,
              inAlbum: track.album ? {
                '@type': 'MusicAlbum',
                name: track.album.name,
                image: track.album.images?.[0]?.url
              } : undefined,
              url: track.external_urls?.spotify,
              image: track.album?.images?.[0]?.url
            }
          }))
        }} />
      )}

      {/* Structured Data - ItemList pour Top Artists */}
      {topArtists.length > 0 && (
        <StructuredData type="ItemList" data={{
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
              url: artist.external_urls?.spotify
            }
          }))
        }} />
      )}

      {/* Structured Data - MusicRecording pour la musique en cours */}
      {currentlyPlaying && (
        <StructuredData type="MusicRecording" data={{
          name: currentlyPlaying.name,
          artists: currentlyPlaying.artists,
          duration: currentlyPlaying.duration_ms,
          inAlbum: currentlyPlaying.album,
          url: currentlyPlaying.external_urls?.spotify,
          image: currentlyPlaying.album?.images?.[0]?.url
        }} />
      )}
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-16">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">Musique</h1>
          <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
            Découvrez ce que j'écoute en ce moment et mes musiques préférées.
          </p>

          {loading ? (
            // Skeleton pour Spotify avec effet shimmer
            <div className="space-y-12">
              {/* Skeleton musique en cours */}
              <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"></div>
                <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-4"></div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                    <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                    <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  </div>
                </div>
              </div>
              
              {/* Skeleton top tracks */}
              <div>
                <div className="h-6 w-40 bg-neutral-200 dark:bg-neutral-700 rounded mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"></div>
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"></div>
                      <span className="text-2xl font-bold text-neutral-400 dark:text-neutral-600 w-8 flex-shrink-0 text-center">
                        {index + 1}
                      </span>
                      <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                        <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skeleton top artists */}
              <div>
                <div className="h-6 w-40 bg-neutral-200 dark:bg-neutral-700 rounded mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"></div>
                      <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                        <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skeleton recently played */}
              <div>
                <div className="h-6 w-40 bg-neutral-200 dark:bg-neutral-700 rounded mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"></div>
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"></div>
                      <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                        <div className="h-3 w-28 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                      </div>
                      <div className="w-8 h-3 bg-neutral-200 dark:bg-neutral-700 rounded flex-shrink-0"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <p className="text-red-600 dark:text-red-400 mb-2">Erreur : {error}</p>
              <p className="text-sm text-red-500 dark:text-red-500">
                Vérifiez que les variables d'environnement Spotify sont bien configurées sur Vercel.
              </p>
            </div>
          ) : (
            <>
              {/* Musique en cours */}
              {currentlyPlaying && (
                <div className="mb-12 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                  <h2 className="font-semibold text-lg mb-4 tracking-tighter flex items-center gap-2">
                    En ce moment
                    <span className="relative flex h-2 w-2" title="En direct">
                      <span className="absolute -inset-0.5 inline-flex rounded-full bg-green-400 opacity-40 animate-ping"></span>
                      <span className="relative inline-flex rounded-full h-full w-full bg-green-500"></span>
                    </span>
                  </h2>
                  <div className="flex items-center gap-4">
                        {currentlyPlaying.album?.images?.[0]?.url && (
                      <Image
                        src={currentlyPlaying.album.images[0].url}
                        alt={`En cours d'écoute : "${currentlyPlaying.name}" de ${currentlyPlaying.artists?.map(a => a.name).join(', ')} - Album "${currentlyPlaying.album.name}"`}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {currentlyPlaying.name}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                        {currentlyPlaying.artists?.map(a => a.name).join(', ')}
                      </p>
                      {currentlyPlaying.external_urls?.spotify && (
                        <a
                          href={currentlyPlaying.external_urls.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mt-1 inline-block"
                        >
                          Écouter sur Spotify →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sélecteur de période */}
              <div className="mb-8">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Période
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'short_term', label: '4 semaines' },
                    { value: 'medium_term', label: '6 mois' },
                    { value: 'long_term', label: 'Toute la vie' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTimeRange(option.value)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        timeRange === option.value
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                          : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Tracks */}
              {topTracks.length > 0 && (
                <div className="mb-12">
                  <h2 className="font-semibold text-xl mb-6 tracking-tighter">
                    Top 5 — {getTimeRangeLabel(timeRange)}
                  </h2>
                  <div className="space-y-4">
                    {topTracks.map((track, index) => (
                      <a
                        key={track.id}
                        href={track.external_urls?.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                      >
                        <span className="text-2xl font-bold text-neutral-400 dark:text-neutral-600 w-8 flex-shrink-0 text-center">
                          {index + 1}
                        </span>
                    {track.album?.images?.[0]?.url && (
                      <Image
                        src={track.album.images[0].url}
                        alt={`Pochette de l'album "${track.album.name}" de ${track.artists?.map(a => a.name).join(', ')}`}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-neutral-900 dark:text-neutral-100 truncate group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                            {track.name}
                          </h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                            {track.artists?.map(a => a.name).join(', ')}
                          </p>
                          {track.duration_ms && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                              {formatDuration(track.duration_ms)}
                            </p>
                          )}
                        </div>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Artists */}
              {topArtists.length > 0 && (
                <div className="mb-12">
                  <h2 className="font-semibold text-xl mb-6 tracking-tighter">
                    Top 5 Artistes — {getTimeRangeLabel(timeRange)}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {topArtists.map((artist, index) => (
                      <a
                        key={artist.id}
                        href={artist.external_urls?.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                      >
                        {artist.images?.[0]?.url && (
                          <Image
                            src={artist.images[0].url}
                            alt={`Photo de profil de ${artist.name}${artist.genres && artist.genres.length > 0 ? ` - ${artist.genres.slice(0, 2).join(', ')}` : ''}`}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-neutral-900 dark:text-neutral-100 truncate group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                            {artist.name}
                          </h3>
                          {artist.genres && artist.genres.length > 0 && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1 truncate">
                              {artist.genres.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </div>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Recently Played */}
              {recentlyPlayed.length > 0 && (
                <div>
                  <h2 className="font-semibold text-xl mb-6 tracking-tighter">Récemment écouté</h2>
                  <div className="space-y-3">
                    {recentlyPlayed.slice(0, 10).map((track) => (
                      <a
                        key={`${track.id}-${track.played_at || Date.now()}`}
                        href={track.external_urls?.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                      >
                        {track.album?.images?.[2]?.url && (
                          <Image
                            src={track.album.images[2].url}
                            alt={`Récemment écouté : "${track.name}" de ${track.artists?.map(a => a.name).join(', ')}`}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                            {track.name}
                          </h3>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                            {track.artists?.map(a => a.name).join(', ')}
                          </p>
                        </div>
                        {track.duration_ms && (
                          <span className="text-xs text-neutral-500 dark:text-neutral-500 flex-shrink-0">
                            {formatDuration(track.duration_ms)}
                          </span>
                        )}
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  )
}

