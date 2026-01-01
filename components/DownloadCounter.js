import { useState, useEffect } from 'react'

export default function DownloadCounter({ toolId, className = '' }) {
  const [count, setCount] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(`/api/tools/track-download?tool=${toolId}`)
        if (response.ok) {
          const data = await response.json()
          setCount(data.count || 0)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du compteur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (toolId) {
      fetchCount()
    }
  }, [toolId])

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        <span className="text-xs text-neutral-500 dark:text-neutral-500">téléchargements</span>
      </div>
    )
  }

  if (count === null || count === 0) {
    return null
  }

  // Formater le nombre (ex: 1234 -> 1,2k)
  const formatCount = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 ${className}`}>
      <svg className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {formatCount(count)}
      </span>
      <span className="text-xs text-neutral-500 dark:text-neutral-500">
        {count === 1 ? 'téléchargement' : 'téléchargés'}
      </span>
    </div>
  )
}

