import { useEffect, useState } from 'react'

export default function ProjectClickCounter({ projectId }) {
  const [clicks, setClicks] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClicks = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/projects/clicks?projectIds=${projectId}`)
        const data = await response.json()
        setClicks(data[projectId] || 0)
      } catch (error) {
        console.error('Erreur lors de la récupération des clics:', error)
        setClicks(0)
      } finally {
        setLoading(false)
      }
    }

    fetchClicks()
  }, [projectId])

  if (loading) {
    return (
      <span className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums">
        <span className="inline-block h-3 w-10 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></span>
      </span>
    )
  }

  return (
    <span className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums">
      {clicks} {clicks === 1 ? 'clic' : 'clics'}
    </span>
  )
}

