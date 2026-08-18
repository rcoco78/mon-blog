import { useState, useEffect } from 'react'
import { getPosthogIdentityHeaders, identifySubscriber } from '../lib/posthog-client'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [subscriberCount, setSubscriberCount] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchSubscriberCount = async () => {
      try {
        const response = await fetch('/api/newsletter/count')
        const data = await response.json()
        setSubscriberCount(data.count)
      } catch (error) {
        console.error('Erreur lors de la récupération du nombre d\'inscrits:', error)
      }
    }

    fetchSubscriberCount()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getPosthogIdentityHeaders(),
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        identifySubscriber(email)
        setStatus('success')
        setEmail('')
        
        // Mettre à jour le nombre d'inscrits après une inscription réussie
        const countResponse = await fetch('/api/newsletter/count')
        const countData = await countResponse.json()
        setSubscriberCount(countData.count)
      } else {
        // Si l'erreur indique que l'email est déjà inscrit
        if (data.alreadySubscribed || (data.message && data.message.includes('déjà inscrit'))) {
          setStatus('already_subscribed')
        } else {
          setStatus('error')
        }
        setErrorMessage(data.error || data.message || 'Une erreur est survenue. Veuillez réessayer.')
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  const getButtonText = () => {
    switch (status) {
      case 'loading':
        return 'Envoi...'
      case 'success':
        return 'Inscrit ! ❤️'
      case 'already_subscribed':
        return 'Déjà inscrit'
      default:
        return 'S\'inscrire'
    }
  }

  return (
    <div className="bg-transparent dark:bg-transparent rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors p-6">
      <div className="flex flex-col sm:flex-row sm:items-center mb-4">
        <div className="flex items-center">
          <h3 className="text-neutral-900 dark:text-neutral-100 text-xl font-semibold">Newsletter</h3>
          <span className="mx-2 text-neutral-400 dark:text-neutral-600 hidden sm:inline">•</span>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1 sm:mt-0">
          Restez informé des nouveaux articles
          {subscriberCount !== null && (
            <span className="ml-2 text-neutral-500 dark:text-neutral-500">
              ({subscriberCount} {subscriberCount === 1 ? 'inscrit' : 'inscrits'})
            </span>
          )}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-row items-center gap-2">
        <label className="sr-only" htmlFor="newsletter-inline-email">
          Adresse email
        </label>
        <input
          id="newsletter-inline-email"
          type="email"
          placeholder="Votre email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-grow px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'already_subscribed'}
          className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {getButtonText()}
        </button>
      </form>
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  )
} 