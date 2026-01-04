import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import SEOHead from '../components/seo/SEOHead'
import { generatePageSEO } from '../lib/seo'
import { getPhotosByMonth, photos as defaultPhotos } from '../lib/photos'

export default function Photos() {
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [monthIndices, setMonthIndices] = useState({})
  const [currentScrollIndices, setCurrentScrollIndices] = useState({})
  const [photos, setPhotos] = useState(defaultPhotos)
  const [loading, setLoading] = useState(true)
  const scrollRefs = useRef({})

  // Charger les photos depuis l'API
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const response = await fetch('/api/photos/list', {
          cache: 'no-store',
        })
        if (response.ok) {
          const data = await response.json()
          if (data.photos && data.photos.length > 0) {
            setPhotos(data.photos)
          }
        }
      } catch (error) {
        console.warn('Erreur lors du chargement des photos:', error)
      } finally {
        setLoading(false)
      }
    }
    loadPhotos()
  }, [])

  const photosByMonth = getPhotosByMonth(photos)
  
  // Auto-rotation du carousel par mois (désactivée, on utilise le scroll natif)
  // Le scroll natif avec snap remplace l'auto-rotation

  // Gérer le scroll et mettre à jour les indicateurs sur mobile
  useEffect(() => {
    const cleanupFunctions = []

    photosByMonth.forEach((monthGroup) => {
      const monthKey = `${monthGroup.year}-${monthGroup.monthNumber}`
      const container = scrollRefs.current[monthKey]
      if (!container || monthGroup.photos.length <= 1) return

      const handleScroll = () => {
        const scrollLeft = container.scrollLeft
        const containerWidth = container.clientWidth
        const itemWidth = containerWidth // w-full = 100% de la largeur
        
        const index = Math.round(scrollLeft / itemWidth)
        setCurrentScrollIndices((prev) => ({
          ...prev,
          [monthKey]: Math.min(Math.max(0, index), monthGroup.photos.length - 1)
        }))
      }

      const timeout = setTimeout(handleScroll, 100)
      container.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('resize', handleScroll)
      
      cleanupFunctions.push(() => {
        clearTimeout(timeout)
        container.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleScroll)
      })
    })

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }, [photosByMonth])
  
  const pageSEO = generatePageSEO({
    title: 'Photos - Corentin Robert',
    description: 'Quelques moments capturés au fil du temps — voyages, projets, rencontres.',
    path: '/photos',
    keywords: ['photos', 'voyages', 'projets', 'moments']
  })

  if (photosByMonth.length === 0) {
    return (
      <>
        <SEOHead {...pageSEO} />
        <main className="flex-auto min-w-0 mt-6 flex flex-col">
          <section className="mb-16">
            <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Photos</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Aucune photo pour le moment.
            </p>
          </section>
        </main>
      </>
    )
  }

  return (
    <>
      <SEOHead {...pageSEO} />
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-8 md:mb-12">
          <h1 className="font-semibold text-2xl mb-4 md:mb-6 tracking-tighter">Photos</h1>
          <p className="mb-0 text-neutral-600 dark:text-neutral-400 tracking-tight">
            Quelques moments capturés au fil du temps — voyages, projets, rencontres.
          </p>
        </section>

        <div className="space-y-16">
          {photosByMonth.map((monthGroup) => {
            const monthKey = `${monthGroup.year}-${monthGroup.monthNumber}`
            const currentIndex = monthIndices[monthKey] || 0
            
            return (
              <div key={monthKey}>
              <h2 className="font-medium text-sm text-neutral-500 dark:text-neutral-400 mb-6 tracking-tighter">
                {monthGroup.month.charAt(0).toUpperCase() + monthGroup.month.slice(1)}
              </h2>
                
                {/* Vue mobile : Carousel horizontal par mois */}
                <div className="block sm:hidden">
                  <div className="relative overflow-hidden rounded-lg">
                    <div 
                      ref={(el) => {
                        if (el) scrollRefs.current[monthKey] = el
                      }}
                      className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                      {monthGroup.photos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedPhoto(photo)}
                          className="relative flex-shrink-0 w-full aspect-[3/4] overflow-hidden snap-start"
                        >
                          <Image
                            src={photo.src}
                            alt={photo.alt || 'Photo'}
                            fill
                            className="object-cover"
                            loading="lazy"
                          />
                          {photo.location && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                              <p className="text-white text-xs">{photo.location}</p>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    
                    {/* Indicateurs de navigation */}
                    {monthGroup.photos.length > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {monthGroup.photos.map((_, index) => {
                          const currentIndex = currentScrollIndices[monthKey] ?? 0
                          return (
                            <button
                              key={index}
                              onClick={() => {
                                const container = scrollRefs.current[monthKey]
                                if (container) {
                                  const containerWidth = container.clientWidth
                                  const scrollPosition = index * containerWidth
                                  container.scrollTo({ left: scrollPosition, behavior: 'smooth' })
                                }
                              }}
                              className={`h-1.5 rounded-full transition-all ${
                                currentIndex === index
                                  ? 'w-6 bg-neutral-900 dark:bg-neutral-100'
                                  : 'w-1.5 bg-neutral-300 dark:bg-neutral-700'
                              }`}
                              aria-label={`Aller à la photo ${index + 1}`}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vue desktop : Grille */}
                <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-3">
                {monthGroup.photos.map((photo, photoIndex) => (
                  <button
                    key={photoIndex}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt || 'Photo'}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    {photo.location && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs">{photo.location}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            )
          })}
        </div>

        {/* Modal pour afficher la photo en grand */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 text-white hover:text-neutral-300 transition-colors"
                aria-label="Fermer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <div className="relative w-full aspect-auto">
                <Image
                  src={selectedPhoto.src}
                  alt={selectedPhoto.alt || 'Photo'}
                  width={1200}
                  height={800}
                  className="object-contain w-full h-full rounded-lg"
                />
              </div>
              {(selectedPhoto.alt || selectedPhoto.location) && (
                <div className="mt-4 text-center">
                  {selectedPhoto.alt && (
                    <p className="text-white text-sm mb-1">{selectedPhoto.alt}</p>
                  )}
                  {selectedPhoto.location && (
                    <p className="text-neutral-400 text-xs">{selectedPhoto.location}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  )
}

