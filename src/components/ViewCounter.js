import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function ViewCounter({ slug }) {
  const [views, setViews] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const trackPageView = async () => {
      try {
        setLoading(true)
        
        // Récupérer les vues existantes depuis localStorage
        const storedViews = localStorage.getItem(`views-${slug}`)
        let currentViews = storedViews ? parseInt(storedViews, 10) : 0
        
        // Incrémenter les vues seulement si c'est une nouvelle visite
        const lastVisit = localStorage.getItem(`lastVisit-${slug}`)
        const now = new Date().getTime()
        
        if (!lastVisit || (now - parseInt(lastVisit, 10)) > 3600000) { // 1 heure
          currentViews += 1
          localStorage.setItem(`views-${slug}`, currentViews.toString())
          localStorage.setItem(`lastVisit-${slug}`, now.toString())
        }
        
        setViews(currentViews)
        
        // Envoyer l'événement de vue à Google Analytics si disponible
        if (window.gtag) {
          window.gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_path: router.asPath,
            article_slug: slug
          })
        }
      } catch (error) {
        console.error('Error tracking page view:', error)
        setViews(0)
      } finally {
        setLoading(false)
      }
    }

    trackPageView()
  }, [slug, router.asPath])

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Chargement...
      </div>
    )
  }

  return (
    <div className="text-sm text-gray-500 dark:text-gray-400">
      {views.toLocaleString()} vues
    </div>
  )
} 