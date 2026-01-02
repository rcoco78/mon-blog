import { useState } from 'react'

export default function NewsletterForm({ compact = false }) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)

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
        setMessage({ type: 'success', text: 'Merci, vous êtes bien inscrit à la newsletter !' })
        setEmail('')
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
      <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-900/50 dark:to-neutral-800/50">
        <h3 className="font-semibold text-sm mb-2 text-neutral-900 dark:text-neutral-100">
          Restez informé
        </h3>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
          Recevez mes derniers articles et réflexions directement dans votre boîte mail.
        </p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
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
    <div className="mt-12 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-900/50 dark:to-neutral-800/50">
      <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
        Ne ratez aucun article
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
        Recevez mes derniers articles et réflexions sur le scraping, l'automatisation et l'entrepreneuriat directement dans votre boîte mail.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg">
        <input
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
      {message && (
        <p
          className={`text-sm mt-3 ${
            message.type === 'success'
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {message.text}
        </p>
      )}
      <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-3">
        Pas de spam, désinscription en un clic. Vos données sont protégées.
      </p>
    </div>
  )
}

