import { useState, useEffect } from 'react'

export default function NewsletterForm({ compact = false, subscriberCount: propSubscriberCount = null }) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [subscriberCount, setSubscriberCount] = useState(propSubscriberCount)

  // Récupérer le nombre d'inscrits si non fourni en prop
  useEffect(() => {
    if (propSubscriberCount === null) {
      const fetchCount = async () => {
        try {
          const response = await fetch('/api/newsletter/count')
          const data = await response.json()
          setSubscriberCount(data.count)
        } catch (error) {
          console.error('Erreur lors de la récupération du nombre d\'inscrits:', error)
        }
      }
      fetchCount()
    } else {
      setSubscriberCount(propSubscriberCount)
    }
  }, [propSubscriberCount])

  // Afficher le toast et le masquer automatiquement après 5 secondes
  useEffect(() => {
    if (message) {
      setShowToast(true)
      const timer = setTimeout(() => {
        setShowToast(false)
        setMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: data.alreadySubscribed 
            ? 'Vous êtes déjà inscrit à la newsletter !' 
            : 'Merci, vous êtes bien inscrit à la newsletter ! Vous recevrez mes derniers articles directement dans votre boîte mail.' 
        })
        setEmail('')
        // Mettre à jour le compteur après une inscription réussie
        if (!data.alreadySubscribed && subscriberCount !== null) {
          setSubscriberCount(prevCount => prevCount + 1)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Une erreur est survenue. Veuillez réessayer.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Impossible de contacter le serveur. Veuillez réessayer.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (compact) {
    // Version compacte pour la sidebar
    return (
      <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <h3 className="font-semibold text-sm mb-2 text-neutral-900 dark:text-neutral-100">
          Recevoir la suite
        </h3>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
          Notes terrain scraping &amp; automatisation — 1× / semaine max.
        </p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="sr-only" htmlFor="newsletter-email-compact">
            Adresse email
          </label>
          <input
            id="newsletter-email-compact"
            type="email"
            placeholder="Votre adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            required
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-center py-2 px-4 rounded-md font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>
        {message && (
          <p
            className={`text-xs mt-2 ${
              message.type === 'success'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {message.text}
          </p>
        )}
        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
          Pas de spam, désinscription en un clic.
        </p>
      </div>
    )
  }

  // Version complète pour la fin d'article
  return (
    <div className="mt-12 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <h3 className="text-xl font-semibold mb-2 tracking-tighter text-neutral-900 dark:text-neutral-100">
        Recevoir la suite
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
        Retours d&apos;expérience scraping, automatisation et freelance — le même niveau de détail que cet article, dans votre boîte.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg">
        <label className="sr-only" htmlFor="newsletter-email-full">
          Adresse email
        </label>
        <input
          id="newsletter-email-full"
          type="email"
          placeholder="Votre adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
          required
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-6 py-2 rounded-md font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Inscription...' : "S'inscrire"}
        </button>
      </form>
      <div className="mt-3 space-y-1">
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          1× / semaine max · désinscription en un clic
        </p>
        {subscriberCount !== null && (
          <p className="text-xs text-neutral-400 dark:text-neutral-600">
            {subscriberCount} {subscriberCount === 1 ? 'inscrit' : 'inscrits'}
          </p>
        )}
      </div>
      
      {/* Toast notification */}
      {showToast && message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200'
              : 'bg-white dark:bg-neutral-900 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          } transition-all duration-300`}
          style={{ maxWidth: '400px' }}
        >
          <div className="flex items-start gap-3">
            <p className="text-sm font-medium flex-1">{message.text}</p>
            <button
              onClick={() => {
                setShowToast(false)
                setMessage(null)
              }}
              className="flex-shrink-0 text-current opacity-70 hover:opacity-100"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

