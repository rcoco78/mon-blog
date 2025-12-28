import { useState, useEffect } from 'react'
import Image from 'next/image'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'

export default function Spotify() {
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)
  const [topTracks, setTopTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSpotifyData = async () => {
      try {
        setLoading(true)
        
        // Récupérer les données depuis notre API
        const response = await fetch('/api/spotify/data')
        const data = await response.json()

        if (data.error) {
          setError(data.error)
        } else {
          setCurrentlyPlaying(data.currentlyPlaying)
          setTopTracks(data.topTracks || [])
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
  }, [])

  const pageSEO = generatePageSEO({
    title: 'Musique - Ce que j\'écoute',
    description: 'Découvrez ce que j\'écoute en ce moment et mon top 5 des musiques sur Spotify.',
    path: '/spotify',
    keywords: ['spotify', 'musique', 'playlist', 'musique du moment']
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      <StructuredData type="CollectionPage" data={{
        name: 'Musique - Ce que j\'écoute',
        description: 'Découvrez ce que j\'écoute en ce moment et mon top 5 des musiques',
        url: `${siteConfig.url}/spotify`
      }} />
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-16">
          <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Musique</h1>
          <p className="mb-8 text-neutral-600 dark:text-neutral-400 tracking-tight">
            Découvrez ce que j'écoute en ce moment et mes musiques préférées.
          </p>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-neutral-600 dark:text-neutral-400">Chargement...</p>
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
                  <h2 className="font-semibold text-lg mb-4 tracking-tighter">En ce moment</h2>
                  <div className="flex items-center gap-4">
                    {currentlyPlaying.album?.images?.[0]?.url && (
                      <Image
                        src={currentlyPlaying.album.images[0].url}
                        alt={currentlyPlaying.album.name}
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

              {/* Top 5 */}
              {topTracks.length > 0 && (
                <div>
                  <h2 className="font-semibold text-xl mb-6 tracking-tighter">Top 5</h2>
                  <div className="space-y-4">
                    {topTracks.map((track, index) => (
                      <a
                        key={track.id}
                        href={track.external_urls?.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                      >
                        <span className="text-2xl font-bold text-neutral-400 dark:text-neutral-600 w-8 flex-shrink-0">
                          {index + 1}
                        </span>
                        {track.album?.images?.[0]?.url && (
                          <Image
                            src={track.album.images[0].url}
                            alt={track.album.name}
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
                        </div>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
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

